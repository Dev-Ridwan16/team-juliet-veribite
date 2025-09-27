import mongoose, { Document } from "mongoose";
import { FoodCategory } from "../services/classifier";
export declare enum PredictionStatus {
    Pending = "Pending",
    Correct = "Correct",
    Incorrect = "Incorrect",
    Disputed = "Disputed",
    Settled = "Settled",
    Processing = "Processing",
    Failed = "Failed",
    Archived = "Archived"
}
export interface IPrediction extends Document {
    shortText: string;
    category: FoodCategory;
    predictor: string;
    ipfsCid: string;
    resultHash: string;
    metadata: Record<string, any>;
    onChainId?: number;
    onChainTxHash?: string;
    stakeWei: string;
    status: PredictionStatus;
    classificationResult?: {
        isFood: boolean;
        category: FoodCategory;
        confidence: number;
        reasoning?: string;
        keywords?: string[];
    };
    submissionAttempts: number;
    lastSubmissionError?: string;
    userAgent?: string;
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
    onChainCreatedAt?: Date;
    categoryIndex: string;
    statusIndex: string;
    predictorIndex: string;
    toPublicJSON(): any;
    canRetrySubmission(): boolean;
}
export declare const Prediction: mongoose.Model<IPrediction, {}, {}, {}, mongoose.Document<unknown, {}, IPrediction, {}, {}> & IPrediction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Prediction.d.ts.map