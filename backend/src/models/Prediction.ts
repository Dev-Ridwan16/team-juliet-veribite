import mongoose, { Document, Schema, Model } from "mongoose";
import { FoodCategory } from "../services/classifier";

/**
 * Prediction status enum (matches contract + additional DB statuses)
 */
export enum PredictionStatus {
  Pending = "Pending",
  Correct = "Correct",
  Incorrect = "Incorrect",
  Disputed = "Disputed",
  Settled = "Settled",
  // Additional DB-only statuses
  Processing = "Processing", // Being processed by backend
  Failed = "Failed", // Failed to submit to contract
  Archived = "Archived", // Archived old prediction
}

/**
 * Prediction document interface
 */
export interface IPrediction extends Document {
  // Core prediction data
  shortText: string;
  category: FoodCategory;
  predictor: string;

  // IPFS and verification data
  ipfsCid: string;
  resultHash: string;
  metadata: Record<string, any>;

  // Contract integration
  onChainId?: number;
  onChainTxHash?: string;
  stakeWei: string;

  // Status tracking
  status: PredictionStatus;

  // Classification results
  classificationResult?: {
    isFood: boolean;
    category: FoodCategory;
    confidence: number;
    reasoning?: string;
    keywords?: string[];
  };

  // Analytics and tracking
  submissionAttempts: number;
  lastSubmissionError?: string;

  // User tracking
  userAgent?: string;
  ipAddress?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  onChainCreatedAt?: Date;

  // Indexing helpers
  categoryIndex: string;
  statusIndex: string;
  predictorIndex: string;

  // Methods
  toPublicJSON(): any;
  canRetrySubmission(): boolean;
}

/**
 * Prediction schema definition
 */
const PredictionSchema = new Schema<IPrediction>(
  {
    // Core prediction data
    shortText: {
      type: String,
      required: true,
      maxlength: 256,
      trim: true,
      validate: {
        validator: (v: string) => v.length > 0 && v.length <= 256,
        message: "Short text must be between 1 and 256 characters",
      },
    },

    category: {
      type: String,
      required: true,
      enum: Object.values(FoodCategory),
      validate: {
        validator: (v: string) =>
          Object.values(FoodCategory).includes(v as FoodCategory),
        message: "Invalid food category",
      },
    },

    predictor: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
        message: "Predictor must be a valid Ethereum address",
      },
    },

    // IPFS and verification data
    ipfsCid: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) => v.length > 0 && v.startsWith("Qm"),
        message: "IPFS CID must be valid",
      },
    },

    resultHash: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{64}$/.test(v),
        message: "Result hash must be a valid 32-byte hex string",
      },
    },

    metadata: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (v: any) =>
          v && typeof v === "object" && v.title && v.description,
        message: "Metadata must include title and description",
      },
    },

    // Contract integration
    onChainId: {
      type: Number,
      min: 1,
      sparse: true, // Allow null but create index for non-null values
      index: true, // Create sparse index here
    },

    onChainTxHash: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^0x[a-fA-F0-9]{64}$/.test(v);
        },
        message: "Transaction hash must be valid if provided",
      },
      sparse: true,
    },

    stakeWei: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d+$/.test(v) && BigInt(v) > 0,
        message: "Stake must be a positive integer (in wei)",
      },
    },

    // Status tracking
    status: {
      type: String,
      required: true,
      enum: Object.values(PredictionStatus),
      default: PredictionStatus.Processing,
    },

    // Classification results
    classificationResult: {
      isFood: {
        type: Boolean,
        required: true,
      },
      category: {
        type: String,
        enum: Object.values(FoodCategory),
        required: true,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      reasoning: String,
      keywords: [String],
    },

    // Analytics and tracking
    submissionAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastSubmissionError: {
      type: String,
      maxlength: 1000,
    },

    // User tracking (for analytics and spam prevention)
    userAgent: {
      type: String,
      maxlength: 500,
    },

    ipAddress: {
      type: String,
      validate: {
        validator: function (v: string) {
          return (
            !v ||
            /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v) ||
            /^[a-fA-F0-9:]+$/.test(v)
          );
        },
        message: "Invalid IP address format",
      },
    },

    // Additional timestamps
    onChainCreatedAt: {
      type: Date,
    },

    // Indexing helpers (for efficient queries)
    categoryIndex: {
      type: String,
      default: function (this: IPrediction) {
        return this.category.toLowerCase();
      },
    },

    statusIndex: {
      type: String,
      default: function (this: IPrediction) {
        return this.status.toLowerCase();
      },
    },

    predictorIndex: {
      type: String,
      default: function (this: IPrediction) {
        return this.predictor.toLowerCase();
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    collection: "predictions",
  }
);

/**
 * Indexes for efficient queries
 */

// Compound indexes for common query patterns
PredictionSchema.index({ predictorIndex: 1, createdAt: -1 }); // User predictions by date
PredictionSchema.index({ categoryIndex: 1, statusIndex: 1 }); // Category + status queries
PredictionSchema.index({ statusIndex: 1, createdAt: -1 }); // Status-based queries by date
PredictionSchema.index({ ipfsCid: 1 }, { unique: true }); // Unique IPFS CID
PredictionSchema.index({ resultHash: 1 }); // Hash-based lookups

// Text indexes for search
PredictionSchema.index({
  shortText: "text",
  "metadata.title": "text",
  "metadata.description": "text",
});

/**
 * Pre-save middleware to update indexing fields
 */
PredictionSchema.pre("save", function (this: IPrediction) {
  this.categoryIndex = this.category.toLowerCase();
  this.statusIndex = this.status.toLowerCase();
  this.predictorIndex = this.predictor.toLowerCase();
});

/**
 * Instance methods
 */
PredictionSchema.methods.toPublicJSON = function (this: IPrediction) {
  return {
    id: this._id,
    shortText: this.shortText,
    category: this.category,
    predictor: this.predictor,
    ipfsCid: this.ipfsCid,
    metadata: this.metadata,
    onChainId: this.onChainId,
    stakeWei: this.stakeWei,
    status: this.status,
    classificationResult: this.classificationResult,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    onChainCreatedAt: this.onChainCreatedAt,
  };
};

PredictionSchema.methods.canRetrySubmission = function (
  this: IPrediction
): boolean {
  return (
    this.status === PredictionStatus.Failed &&
    this.submissionAttempts < 3 &&
    (!this.onChainId || this.onChainId === 0)
  );
};

export const Prediction = mongoose.model<IPrediction>(
  "Prediction",
  PredictionSchema
);
