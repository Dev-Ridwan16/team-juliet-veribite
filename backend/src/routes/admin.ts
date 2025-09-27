import { Router, Request, Response, NextFunction } from "express";
import Joi from "joi";
import {
  Prediction,
  IPrediction,
  PredictionStatus,
} from "../models/Prediction";
import User from "../models/User";
import { validateEthAddress, strictLimiter } from "../middleware";
import { createContractService, ContractOutcome } from "../services/contract";
import logger from "../utils/logger";

const router = Router();
router.use(strictLimiter);

// Simple admin authentication middleware
const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers["x-admin-api-key"] as string;
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

const contractService: any = createContractService();

/**
 * Validation schemas
 */
const markOutcomeSchema = Joi.object({
  predictionId: Joi.number().integer().min(1).required(),
  outcome: Joi.string()
    .valid("Correct", "Incorrect", "Disputed", "Settled")
    .required(),
  reason: Joi.string().max(500).optional(),
});

const distributeRewardSchema = Joi.object({
  predictionId: Joi.number().integer().min(1).required(),
});

const batchDistributeSchema = Joi.object({
  predictionIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .min(1)
    .max(50)
    .required(),
});

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get(
  "/stats",
  authenticateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalPredictions,
        totalUsers,
        recentPredictions,
        pendingPredictions,
      ] = await Promise.all([
        Prediction.countDocuments(),
        User.countDocuments(),
        Prediction.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        Prediction.countDocuments({ status: PredictionStatus.Pending }),
      ]);

      const statusStats = await Prediction.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const categoryStats = await Prediction.aggregate([
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
          statusBreakdown: statusStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          categoryBreakdown: categoryStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          platform: "VeriBite Food Predictions",
        },
      });
    } catch (error: any) {
      logger.error("Error fetching admin stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
      });
    }
  }
);

/**
 * GET /api/admin/predictions
 * Get all predictions for admin review
 */
router.get(
  "/predictions",
  authenticateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const category = req.query.category as string;

      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;

      const [predictions, total] = await Promise.all([
        Prediction.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "address"),
        Prediction.countDocuments(filter),
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
    } catch (error: any) {
      logger.error("Failed to fetch predictions for admin:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch predictions",
      });
    }
  }
);

/**
 * POST /api/admin/mark-outcome
 * Mark prediction outcome (admin only)
 */
router.post(
  "/mark-outcome",
  authenticateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
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

      logger.info(`Admin marking prediction ${predictionId} as ${outcome}`);

      // Map string to contract enum with proper typing
      const outcomeMapping: Record<string, ContractOutcome> = {
        Correct: ContractOutcome.Correct,
        Incorrect: ContractOutcome.Incorrect,
        Disputed: ContractOutcome.Disputed,
        Settled: ContractOutcome.Settled,
      };

      const contractOutcome = outcomeMapping[outcome];
      if (contractOutcome === undefined) {
        res.status(400).json({
          success: false,
          error: `Invalid outcome: ${outcome}`,
        });
        return;
      }

      // Submit to contract
      const result = await contractService.markOutcome(
        predictionId,
        contractOutcome
      );

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: "Failed to mark outcome on contract",
          details: result.error,
        });
        return;
      }

      // Update database
      const dbPrediction = await Prediction.findOne({
        onChainId: predictionId,
      });
      if (dbPrediction) {
        dbPrediction.status = outcome as PredictionStatus;
        if (reason) {
          dbPrediction.lastSubmissionError = `Admin decision: ${reason}`;
        }
        await dbPrediction.save();
      }

      logger.info(
        `Successfully marked prediction ${predictionId} as ${outcome}`
      );

      res.json({
        success: true,
        predictionId,
        outcome,
        transactionHash: result.transactionHash,
        dbUpdated: !!dbPrediction,
      });
    } catch (error: any) {
      logger.error("Mark outcome error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark outcome",
        details: error.message,
      });
    }
  }
);

/**
 * POST /api/admin/distribute-reward
 * Distribute reward for a correct prediction
 */
router.post(
  "/distribute-reward",
  authenticateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
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

      logger.info(`Admin distributing reward for prediction ${predictionId}`);

      // Submit to contract
      const result = await contractService.distributeReward(predictionId);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: "Failed to distribute reward",
          details: result.error,
        });
        return;
      }

      // Update database status if needed
      const dbPrediction = await Prediction.findOne({
        onChainId: predictionId,
      });
      if (dbPrediction) {
        // Mark as settled to indicate reward has been processed
        dbPrediction.status = PredictionStatus.Settled;
        await dbPrediction.save();
      }

      logger.info(
        `Successfully distributed reward for prediction ${predictionId}`
      );

      res.json({
        success: true,
        predictionId,
        transactionHash: result.transactionHash,
        dbUpdated: !!dbPrediction,
      });
    } catch (error: any) {
      logger.error("Distribute reward error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to distribute reward",
        details: error.message,
      });
    }
  }
);

/**
 * POST /api/admin/batch-distribute
 * Distribute rewards for multiple correct predictions
 */
router.post(
  "/batch-distribute",
  authenticateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
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

      logger.info(
        `Admin batch distributing rewards for ${predictionIds.length} predictions`
      );

      // Submit to contract
      const result = await contractService.batchDistributeReward(predictionIds);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: "Failed to distribute rewards",
          details: result.error,
        });
        return;
      }

      // Update database statuses
      const dbUpdate = await Prediction.updateMany(
        { onChainId: { $in: predictionIds } },
        { status: PredictionStatus.Settled }
      );

      logger.info(
        `Successfully batch distributed rewards for ${predictionIds.length} predictions`
      );

      res.json({
        success: true,
        predictionIds,
        transactionHash: result.transactionHash,
        dbUpdatedCount: dbUpdate.modifiedCount,
      });
    } catch (error: any) {
      logger.error("Batch distribute reward error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to batch distribute rewards",
        details: error.message,
      });
    }
  }
);

export default router;
