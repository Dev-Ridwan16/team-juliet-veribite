"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const Prediction_1 = require("../models/Prediction");
const middleware_1 = require("../middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.use(middleware_1.generalLimiter);
router.get('/:address', middleware_1.validateEthAddress, async (req, res) => {
    try {
        const { address } = req.params;
        let user = await User_1.default.findOne({ address });
        if (!user) {
            user = new User_1.default({
                address,
                totalPredictions: 0,
                correctPredictions: 0,
                totalStaked: '0',
                totalRewards: '0',
                reputation: 0
            });
            await user.save();
        }
        const recentPredictions = await Prediction_1.Prediction
            .find({ user: address })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('question prediction amount status outcome createdAt');
        res.json({
            success: true,
            user,
            recentPredictions
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching user profile:', error);
        res.status(500).json({
            error: 'Failed to fetch user profile'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const users = await User_1.default
            .find({ totalPredictions: { $gte: 1 }, isActive: true })
            .sort({ reputation: -1, totalPredictions: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .select('-__v');
        const total = await User_1.default.countDocuments({
            totalPredictions: { $gte: 1 },
            isActive: true
        });
        res.json({
            success: true,
            leaderboard: users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching leaderboard:', error);
        res.status(500).json({
            error: 'Failed to fetch leaderboard'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map