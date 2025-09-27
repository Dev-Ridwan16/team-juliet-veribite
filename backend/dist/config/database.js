"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
async function connectDatabase() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/veribite";
        await mongoose_1.default.connect(MONGODB_URI);
        mongoose_1.default.connection.on("error", (error) => {
            logger_1.default.error("MongoDB connection error:", error);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            logger_1.default.warn("MongoDB disconnected");
        });
        mongoose_1.default.connection.on("reconnected", () => {
            logger_1.default.info("MongoDB reconnected");
        });
        logger_1.default.info(`MongoDB connected to: ${MONGODB_URI}`);
    }
    catch (error) {
        logger_1.default.error("MongoDB connection failed:", error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map