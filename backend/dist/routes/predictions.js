"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const Prediction_1 = require("../models/Prediction");
const ipfs_1 = require("../services/ipfs");
const classifier_1 = require("../services/classifier");
const contract_1 = require("../services/contract");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
const ipfsService = (0, ipfs_1.createIPFSService)();
const foodClassifier = (0, classifier_1.createFoodClassifier)();
const contractService = (0, contract_1.createContractService)();
const submitRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: "Too many prediction submissions. Please try again later.",
        retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const submitPredictionSchema = joi_1.default.object({
    shortText: joi_1.default.string().min(1).max(256).required(),
    metadataJson: joi_1.default.object({
        title: joi_1.default.string().min(1).max(200).required(),
        description: joi_1.default.string().min(1).max(2000).required(),
        timeframe: joi_1.default.string().optional(),
        confidence: joi_1.default.number().min(0).max(1).optional(),
        sources: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
        tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).required(),
    stakeWei: joi_1.default.string().pattern(/^\d+$/).optional(),
    predictor: joi_1.default.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
});
const getPredictionsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    category: joi_1.default.string()
        .valid(...Object.values(classifier_1.FoodCategory))
        .optional(),
    status: joi_1.default.string()
        .valid(...Object.values(Prediction_1.PredictionStatus))
        .optional(),
    predictor: joi_1.default.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
});
router.post("/", submitRateLimit, async (req, res) => {
    try {
        logger_1.default.info("Received prediction submission request");
        const { error, value } = submitPredictionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.details.map((d) => d.message),
            });
        }
        const { shortText, metadataJson, stakeWei, predictor } = value;
        const backendMode = process.env.BACKEND_SUBMIT_MODE || "frontend";
        const minStake = process.env.MIN_STAKE_WEI || "10000000000000000";
        const predictorAddress = predictor || req.headers["x-predictor-address"];
        if (!predictorAddress || !contract_1.ContractUtils.isValidAddress(predictorAddress)) {
            return res.status(400).json({
                success: false,
                error: "Valid predictor Ethereum address is required",
            });
        }
        if (backendMode === "relayer") {
            if (!stakeWei || BigInt(stakeWei) < BigInt(minStake)) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum stake of ${contract_1.ContractUtils.formatEther(minStake)} ETH required`,
                    minStakeWei: minStake,
                });
            }
        }
        logger_1.default.info("Classifying prediction for food content");
        const classificationResult = await foodClassifier.classify(shortText, metadataJson);
        if (!classificationResult.isFood) {
            return res.status(400).json({
                success: false,
                error: "Prediction is not food-related",
                details: classificationResult.reasoning,
                confidence: classificationResult.confidence,
            });
        }
        logger_1.default.info("Pinning metadata to IPFS");
        const ipfsResult = await ipfsService.pinJSON(metadataJson);
        const prediction = new Prediction_1.Prediction({
            shortText,
            category: classificationResult.category,
            predictor: predictorAddress.toLowerCase(),
            ipfsCid: ipfsResult.cid,
            resultHash: ipfsResult.hash,
            metadata: metadataJson,
            stakeWei: stakeWei || minStake,
            status: Prediction_1.PredictionStatus.Processing,
            classificationResult,
            userAgent: req.get("User-Agent"),
            ipAddress: req.ip,
        });
        await prediction.save();
        logger_1.default.info(`Prediction saved to database: ${prediction._id}`);
        if (backendMode === "relayer") {
            try {
                const contractCategory = contract_1.ContractUtils.foodCategoryToContract(classificationResult.category);
                const submissionResult = await contractService.submitPrediction({
                    category: contractCategory,
                    shortText,
                    ipfsCid: ipfsResult.cid,
                    resultHash: ipfsResult.hash,
                    stakeWei: stakeWei,
                });
                if (submissionResult.success) {
                    prediction.onChainTxHash = submissionResult.transactionHash;
                    prediction.onChainId = submissionResult.predictionId;
                    prediction.status = Prediction_1.PredictionStatus.Pending;
                    await prediction.save();
                    return res.status(201).json({
                        success: true,
                        mode: "relayer",
                        prediction: prediction.toPublicJSON(),
                        onChainTxHash: submissionResult.transactionHash,
                        onChainId: submissionResult.predictionId,
                        ipfs: {
                            cid: ipfsResult.cid,
                            hash: ipfsResult.hash,
                        },
                    });
                }
                else {
                    prediction.status = Prediction_1.PredictionStatus.Failed;
                    prediction.submissionAttempts = 1;
                    prediction.lastSubmissionError = submissionResult.error;
                    await prediction.save();
                    return res.status(500).json({
                        success: false,
                        error: "Failed to submit to blockchain",
                        details: submissionResult.error,
                        prediction: prediction.toPublicJSON(),
                    });
                }
            }
            catch (contractError) {
                prediction.status = Prediction_1.PredictionStatus.Failed;
                prediction.submissionAttempts = 1;
                prediction.lastSubmissionError = contractError.message;
                await prediction.save();
                return res.status(500).json({
                    success: false,
                    error: "Blockchain submission failed",
                    details: contractError.message,
                });
            }
        }
        else {
            prediction.status = Prediction_1.PredictionStatus.Processing;
            await prediction.save();
            return res.status(201).json({
                success: true,
                mode: "frontend",
                prediction: prediction.toPublicJSON(),
                contractSubmission: {
                    category: contract_1.ContractUtils.foodCategoryToContract(classificationResult.category),
                    shortText,
                    ipfsCid: ipfsResult.cid,
                    resultHash: ipfsResult.hash,
                    minStakeWei: minStake,
                },
                ipfs: {
                    cid: ipfsResult.cid,
                    hash: ipfsResult.hash,
                },
            });
        }
    }
    catch (error) {
        logger_1.default.error("Prediction submission error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error.message,
        });
    }
});
router.get("/", async (req, res) => {
    try {
        const { error, value } = getPredictionsSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.details.map((d) => d.message),
            });
        }
        const { page, limit, category, status, predictor } = value;
        const offset = (page - 1) * limit;
        const query = {};
        if (category)
            query.categoryIndex = category.toLowerCase();
        if (status)
            query.statusIndex = status.toLowerCase();
        if (predictor)
            query.predictorIndex = predictor.toLowerCase();
        const [predictions, total] = await Promise.all([
            Prediction_1.Prediction.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .exec(),
            Prediction_1.Prediction.countDocuments(query),
        ]);
        const enrichedPredictions = await Promise.all(predictions.map(async (prediction) => {
            const publicData = prediction.toPublicJSON();
            if (prediction.onChainId) {
                try {
                    const onChainPrediction = await contractService.getPrediction(prediction.onChainId);
                    if (onChainPrediction) {
                        publicData.onChainData = {
                            outcome: onChainPrediction.outcome,
                            createdAt: new Date(onChainPrediction.createdAt * 1000),
                        };
                    }
                }
                catch (error) {
                    logger_1.default.warn(`Failed to fetch on-chain data for prediction ${prediction.onChainId}:`, error);
                }
            }
            return publicData;
        }));
        return res.json({
            success: true,
            predictions: enrichedPredictions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            filters: { category, status, predictor },
        });
    }
    catch (error) {
        logger_1.default.error("Get predictions error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch predictions",
            details: error.message,
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: "Invalid prediction ID format",
            });
        }
        const prediction = await Prediction_1.Prediction.findById(id);
        if (!prediction) {
            return res.status(404).json({
                success: false,
                error: "Prediction not found",
            });
        }
        const publicData = prediction.toPublicJSON();
        if (prediction.onChainId) {
            try {
                const onChainPrediction = await contractService.getPrediction(prediction.onChainId);
                if (onChainPrediction) {
                    publicData.onChainData = {
                        id: onChainPrediction.id,
                        outcome: onChainPrediction.outcome,
                        stake: onChainPrediction.stake,
                        createdAt: new Date(onChainPrediction.createdAt * 1000),
                    };
                }
            }
            catch (error) {
                logger_1.default.warn(`Failed to fetch on-chain data for prediction ${prediction.onChainId}:`, error);
            }
        }
        return res.json({
            success: true,
            prediction: publicData,
        });
    }
    catch (error) {
        logger_1.default.error("Get prediction error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch prediction",
            details: error.message,
        });
    }
});
router.post("/:id/sync", async (req, res) => {
    try {
        const { id } = req.params;
        const { onChainId, transactionHash } = req.body;
        if (!onChainId || !transactionHash) {
            return res.status(400).json({
                success: false,
                error: "onChainId and transactionHash are required",
            });
        }
        const prediction = await Prediction_1.Prediction.findById(id);
        if (!prediction) {
            return res.status(404).json({
                success: false,
                error: "Prediction not found",
            });
        }
        prediction.onChainId = onChainId;
        prediction.onChainTxHash = transactionHash;
        prediction.status = Prediction_1.PredictionStatus.Pending;
        await prediction.save();
        logger_1.default.info(`Synced prediction ${id} with on-chain ID ${onChainId}`);
        return res.json({
            success: true,
            prediction: prediction.toPublicJSON(),
        });
    }
    catch (error) {
        logger_1.default.error("Sync prediction error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to sync prediction",
            details: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=predictions.js.map