import { Router, Request, Response } from "express";
import User from "../models/User";
import { Prediction } from "../models/Prediction";
import { validateEthAddress, generalLimiter } from "../middleware";
import logger from "../utils/logger";

const router = Router();
router.use(generalLimiter);

// Get user profile and stats
router.get(
  "/:address",
  validateEthAddress,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;

      let user = await User.findOne({ address });

      if (!user) {
        user = new User({
          address,
          totalPredictions: 0,
          correctPredictions: 0,
          totalStaked: "0",
          totalRewards: "0",
          reputation: 0,
        });
        await user.save();
      }

      // Get recent predictions
      const recentPredictions = await Prediction.find({ user: address })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("question prediction amount status outcome createdAt");

      res.json({
        success: true,
        user,
        recentPredictions,
      });
    } catch (error: any) {
      logger.error("Error fetching user profile:", error);
      res.status(500).json({
        error: "Failed to fetch user profile",
      });
    }
  }
);

// Get basic leaderboard
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);

    const users = await User.find({
      totalPredictions: { $gte: 1 },
      isActive: true,
    })
      .sort({ reputation: -1, totalPredictions: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-__v");

    const total = await User.countDocuments({
      totalPredictions: { $gte: 1 },
      isActive: true,
    });

    res.json({
      success: true,
      leaderboard: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard",
    });
  }
});

export default router;
