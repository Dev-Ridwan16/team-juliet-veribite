"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const Prediction_1 = require("../models/Prediction");
const User_1 = __importDefault(require("../models/User"));
const middleware_1 = require("../middleware");
const contract_1 = require("../services/contract");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.use(middleware_1.strictLimiter);
const authenticateAdmin = (req, res, next) => {
    const apiKey = req.headers["x-admin-api-key"];
    const validApiKey = process.env.ADMIN_API_KEY;
    if (!validApiKey) {
        res.status(500).json({
            success: false,
            error: "Admin API not configured",
        });
        return;
    }
    if (!apiKey || apiKey !== validApiKey) {
        res.status(401).json({
            success: false,
            error: "Unauthorized - Invalid API key",
        });
        return;
    }
    next();
};
const contractService = (0, contract_1.createContractService)();
const markOutcomeSchema = joi_1.default.object({
    predictionId: joi_1.default.number().integer().min(1).required(),
    outcome: joi_1.default.string()
        .valid("Correct", "Incorrect", "Disputed", "Settled")
        .required(),
    reason: joi_1.default.string().max(500).optional(),
});
const distributeRewardSchema = joi_1.default.object({
    predictionId: joi_1.default.number().integer().min(1).required(),
});
const batchDistributeSchema = joi_1.default.object({
    predictionIds: joi_1.default.array()
        .items(joi_1.default.number().integer().min(1))
        .min(1)
        .max(50)
        .required(),
});
router.get("/stats", authenticateAdmin, async (req, res) => {
    try {
        const [totalPredictions, totalUsers, recentPredictions, pendingPredictions,] = await Promise.all([
            Prediction_1.Prediction.countDocuments(),
            User_1.default.countDocuments(),
            Prediction_1.Prediction.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
            Prediction_1.Prediction.countDocuments({ status: Prediction_1.PredictionStatus.Pending }),
        ]);
        const statusStats = await Prediction_1.Prediction.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        const categoryStats = await Prediction_1.Prediction.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
        ]);
        res.json({
            success: true,
            stats: {
                totalPredictions,
                totalUsers,
                recentPredictions,
                pendingPredictions,
                statusBreakdown: statusStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                categoryBreakdown: categoryStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                platform: "VeriBite Food Predictions",
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error fetching admin stats:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch statistics",
        });
    }
});
router.get("/predictions", authenticateAdmin, async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const category = req.query.category;
        const filter = {};
        if (status)
            filter.status = status;
        if (category)
            filter.category = category;
        const [predictions, total] = await Promise.all([
            Prediction_1.Prediction.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("user", "address"),
            Prediction_1.Prediction.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: predictions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            filters: {
                status: status || "all",
                category: category || "all",
            },
        });
    }
    catch (error) {
        logger_1.default.error("Failed to fetch predictions for admin:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch predictions",
        });
    }
});
router.post("/mark-outcome", authenticateAdmin, async (req, res) => {
    try {
        const { error, value } = markOutcomeSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.details.map((d) => d.message),
            });
            return;
        }
        const { predictionId, outcome, reason } = value;
        logger_1.default.info(`Admin marking prediction ${predictionId} as ${outcome}`);
        const outcomeMapping = {
            'Correct': contract_1.ContractOutcome.Correct,
            'Incorrect': contract_1.ContractOutcome.Incorrect,
            'Disputed': contract_1.ContractOutcome.Disputed,
            'Settled': contract_1.ContractOutcome.Settled,
        };
        const contractOutcome = outcomeMapping[outcome];
        if (contractOutcome === undefined) {
            res.status(400).json({
                success: false,
                error: `Invalid outcome: ${outcome}`,
            });
            return;
        }
        const result = await contractService.markOutcome(predictionId, contractOutcome);
        if (!result.success) {
            res.status(500).json({
                success: false,
                error: "Failed to mark outcome on contract",
                details: result.error,
            });
            return;
        }
        const dbPrediction = await Prediction_1.Prediction.findOne({
            onChainId: predictionId,
        });
        if (dbPrediction) {
            dbPrediction.status = outcome;
            if (reason) {
                dbPrediction.lastSubmissionError = `Admin decision: ${reason}`;
            }
            await dbPrediction.save();
        }
        logger_1.default.info(`Successfully marked prediction ${predictionId} as ${outcome}`);
        res.json({
            success: true,
            predictionId,
            outcome,
            transactionHash: result.transactionHash,
            dbUpdated: !!dbPrediction,
        });
    }
    catch (error) {
        logger_1.default.error("Mark outcome error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to mark outcome",
            details: error.message,
        });
    }
});
router.post("/distribute-reward", authenticateAdmin, async (req, res) => {
    try {
        const { error, value } = distributeRewardSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.details.map((d) => d.message),
            });
            return;
        }
        const { predictionId } = value;
        logger_1.default.info(`Admin distributing reward for prediction ${predictionId}`);
        const result = await contractService.distributeReward(predictionId);
        if (!result.success) {
            res.status(500).json({
                success: false,
                error: "Failed to distribute reward",
                details: result.error,
            });
            return;
        }
        const dbPrediction = await Prediction_1.Prediction.findOne({
            onChainId: predictionId,
        });
        if (dbPrediction) {
            dbPrediction.status = Prediction_1.PredictionStatus.Settled;
            await dbPrediction.save();
        }
        logger_1.default.info(`Successfully distributed reward for prediction ${predictionId}`);
        res.json({
            success: true,
            predictionId,
            transactionHash: result.transactionHash,
            dbUpdated: !!dbPrediction,
        });
    }
    catch (error) {
        logger_1.default.error("Distribute reward error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to distribute reward",
            details: error.message,
        });
    }
});
router.post("/batch-distribute", authenticateAdmin, async (req, res) => {
    try {
        const { error, value } = batchDistributeSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.details.map((d) => d.message),
            });
            return;
        }
        const { predictionIds } = value;
        logger_1.default.info(`Admin batch distributing rewards for ${predictionIds.length} predictions`);
        const result = await contractService.batchDistributeReward(predictionIds);
        if (!result.success) {
            res.status(500).json({
                success: false,
                error: "Failed to distribute rewards",
                details: result.error,
            });
            return;
        }
        const dbUpdate = await Prediction_1.Prediction.updateMany({ onChainId: { $in: predictionIds } }, { status: Prediction_1.PredictionStatus.Settled });
        logger_1.default.info(`Successfully batch distributed rewards for ${predictionIds.length} predictions`);
        res.json({
            success: true,
            predictionIds,
            transactionHash: result.transactionHash,
            dbUpdatedCount: dbUpdate.modifiedCount,
        });
    }
    catch (error) {
        logger_1.default.error("Batch distribute reward error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to batch distribute rewards",
            details: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map