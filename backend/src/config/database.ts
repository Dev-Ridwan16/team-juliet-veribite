import mongoose from "mongoose";
import logger from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/veribite";

    await mongoose.connect(MONGODB_URI);

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    logger.info(`MongoDB connected to: ${MONGODB_URI}`);
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    throw error;
  }
}
