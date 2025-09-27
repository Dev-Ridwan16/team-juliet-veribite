import express, { Request, Response } from "express";
import Joi from "joi";
import rateLimit from "express-rate-limit";
import { Prediction, PredictionStatus } from "../models/Prediction";
import { createIPFSService } from "../services/ipfs";
import { createFoodClassifier, FoodCategory } from "../services/classifier";
import { createContractService, ContractUtils } from "../services/contract";
import logger from "../utils/logger";

const router = express.Router();

// Initialize services
const ipfsService = createIPFSService();
const foodClassifier = createFoodClassifier();
const contractService = createContractService();

// Rate limiting for prediction submissions
const submitRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 submissions per window per IP
  message: {
    error: "Too many prediction submissions. Please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validation schemas
 */
const submitPredictionSchema = Joi.object({
  shortText: Joi.string().min(1).max(256).required(),
  metadataJson: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(2000).required(),
    timeframe: Joi.string().optional(),
    confidence: Joi.number().min(0).max(1).optional(),
    sources: Joi.array().items(Joi.string().uri()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).required(),
  stakeWei: Joi.string().pattern(/^\d+$/).optional(),
  predictor: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
});

const getPredictionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category: Joi.string()
    .valid(...Object.values(FoodCategory))
    .optional(),
  status: Joi.string()
    .valid(...Object.values(PredictionStatus))
    .optional(),
  predictor: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
});

/**
 * POST /api/predictions
 * Submit a new food prediction
 */
router.post("/", submitRateLimit, async (req: Request, res: Response) => {
  try {
    logger.info("Received prediction submission request");

    // Validate request body
    const { error, value } = submitPredictionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    const { shortText, metadataJson, stakeWei, predictor } = value;

    // Get backend submit mode
    const backendMode = process.env.BACKEND_SUBMIT_MODE || "frontend";
    const minStake = process.env.MIN_STAKE_WEI || "10000000000000000"; // 0.01 ETH default

    // Validate predictor address (required for both modes)
    const predictorAddress =
      predictor || (req.headers["x-predictor-address"] as string);
    if (!predictorAddress || !ContractUtils.isValidAddress(predictorAddress)) {
      return res.status(400).json({
        success: false,
        error: "Valid predictor Ethereum address is required",
      });
    }

    // Validate stake for relayer mode
    if (backendMode === "relayer") {
      if (!stakeWei || BigInt(stakeWei) < BigInt(minStake)) {
        return res.status(400).json({
          success: false,
          error: `Minimum stake of ${ContractUtils.formatEther(
            minStake
          )} ETH required`,
          minStakeWei: minStake,
        });
      }
    }

    // Step 1: Classify the prediction as food-related
    logger.info("Classifying prediction for food content");
    const classificationResult = await foodClassifier.classify(
      shortText,
      metadataJson
    );

    if (!classificationResult.isFood) {
      return res.status(400).json({
        success: false,
        error: "Prediction is not food-related",
        details: classificationResult.reasoning,
        confidence: classificationResult.confidence,
      });
    }

    // Step 2: Pin metadata to IPFS
    logger.info("Pinning metadata to IPFS");
    const ipfsResult = await ipfsService.pinJSON(metadataJson);

    // Step 3: Create prediction in database
    const prediction = new Prediction({
      shortText,
      category: classificationResult.category,
      predictor: predictorAddress.toLowerCase(),
      ipfsCid: ipfsResult.cid,
      resultHash: ipfsResult.hash,
      metadata: metadataJson,
      stakeWei: stakeWei || minStake,
      status: PredictionStatus.Processing,
      classificationResult,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    await prediction.save();
    logger.info(`Prediction saved to database: ${prediction._id}`);

    // Step 4: Submit to contract (if relayer mode)
    if (backendMode === "relayer") {
      try {
        const contractCategory = ContractUtils.foodCategoryToContract(
          classificationResult.category
        );
        const submissionResult = await contractService.submitPrediction({
          category: contractCategory,
          shortText,
          ipfsCid: ipfsResult.cid,
          resultHash: ipfsResult.hash,
          stakeWei: stakeWei!,
        });

        if (submissionResult.success) {
          prediction.onChainTxHash = submissionResult.transactionHash;
          prediction.onChainId = submissionResult.predictionId;
          prediction.status = PredictionStatus.Pending;
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
        } else {
          // Contract submission failed
          prediction.status = PredictionStatus.Failed;
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
      } catch (contractError: any) {
        prediction.status = PredictionStatus.Failed;
        prediction.submissionAttempts = 1;
        prediction.lastSubmissionError = contractError.message;
        await prediction.save();

        return res.status(500).json({
          success: false,
          error: "Blockchain submission failed",
          details: contractError.message,
        });
      }
    } else {
      // Frontend mode - return data for frontend to submit
      prediction.status = PredictionStatus.Processing;
      await prediction.save();

      return res.status(201).json({
        success: true,
        mode: "frontend",
        prediction: prediction.toPublicJSON(),
        contractSubmission: {
          category: ContractUtils.foodCategoryToContract(
            classificationResult.category
          ),
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
  } catch (error: any) {
    logger.error("Prediction submission error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /api/predictions
 * Get paginated list of predictions with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
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

    // Build query
    const query: any = {};
    if (category) query.categoryIndex = category.toLowerCase();
    if (status) query.statusIndex = status.toLowerCase();
    if (predictor) query.predictorIndex = predictor.toLowerCase();

    // Execute query
    const [predictions, total] = await Promise.all([
      Prediction.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      Prediction.countDocuments(query),
    ]);

    // Enrich with on-chain data if available
    const enrichedPredictions = await Promise.all(
      predictions.map(async (prediction) => {
        const publicData = prediction.toPublicJSON();

        // Try to get on-chain status if ID exists
        if (prediction.onChainId) {
          try {
            const onChainPrediction = await contractService.getPrediction(
              prediction.onChainId
            );
            if (onChainPrediction) {
              publicData.onChainData = {
                outcome: onChainPrediction.outcome,
                createdAt: new Date(onChainPrediction.createdAt * 1000),
              };
            }
          } catch (error) {
            // Silently fail - on-chain data is optional
            logger.warn(
              `Failed to fetch on-chain data for prediction ${prediction.onChainId}:`,
              error
            );
          }
        }

        return publicData;
      })
    );

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
  } catch (error: any) {
    logger.error("Get predictions error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch predictions",
      details: error.message,
    });
  }
});

/**
 * GET /api/predictions/:id
 * Get single prediction by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid prediction ID format",
      });
    }

    // Find prediction
    const prediction = await Prediction.findById(id);
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: "Prediction not found",
      });
    }

    const publicData = prediction.toPublicJSON();

    // Enrich with on-chain data
    if (prediction.onChainId) {
      try {
        const onChainPrediction = await contractService.getPrediction(
          prediction.onChainId
        );
        if (onChainPrediction) {
          publicData.onChainData = {
            id: onChainPrediction.id,
            outcome: onChainPrediction.outcome,
            stake: onChainPrediction.stake,
            createdAt: new Date(onChainPrediction.createdAt * 1000),
          };
        }
      } catch (error) {
        logger.warn(
          `Failed to fetch on-chain data for prediction ${prediction.onChainId}:`,
          error
        );
      }
    }

    return res.json({
      success: true,
      prediction: publicData,
    });
  } catch (error: any) {
    logger.error("Get prediction error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch prediction",
      details: error.message,
    });
  }
});

/**
 * POST /api/predictions/:id/sync
 * Sync prediction with on-chain data (for frontend mode)
 */
router.post("/:id/sync", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { onChainId, transactionHash } = req.body;

    // Validate inputs
    if (!onChainId || !transactionHash) {
      return res.status(400).json({
        success: false,
        error: "onChainId and transactionHash are required",
      });
    }

    // Find prediction
    const prediction = await Prediction.findById(id);
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: "Prediction not found",
      });
    }

    // Update with on-chain data
    prediction.onChainId = onChainId;
    prediction.onChainTxHash = transactionHash;
    prediction.status = PredictionStatus.Pending;
    await prediction.save();

    logger.info(`Synced prediction ${id} with on-chain ID ${onChainId}`);

    return res.json({
      success: true,
      prediction: prediction.toPublicJSON(),
    });
  } catch (error: any) {
    logger.error("Sync prediction error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync prediction",
      details: error.message,
    });
  }
});

export default router;
