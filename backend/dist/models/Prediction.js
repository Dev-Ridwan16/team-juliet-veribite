"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prediction = exports.PredictionStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const classifier_1 = require("../services/classifier");
var PredictionStatus;
(function (PredictionStatus) {
    PredictionStatus["Pending"] = "Pending";
    PredictionStatus["Correct"] = "Correct";
    PredictionStatus["Incorrect"] = "Incorrect";
    PredictionStatus["Disputed"] = "Disputed";
    PredictionStatus["Settled"] = "Settled";
    PredictionStatus["Processing"] = "Processing";
    PredictionStatus["Failed"] = "Failed";
    PredictionStatus["Archived"] = "Archived";
})(PredictionStatus || (exports.PredictionStatus = PredictionStatus = {}));
const PredictionSchema = new mongoose_1.Schema({
    shortText: {
        type: String,
        required: true,
        maxlength: 256,
        trim: true,
        validate: {
            validator: (v) => v.length > 0 && v.length <= 256,
            message: "Short text must be between 1 and 256 characters",
        },
    },
    category: {
        type: String,
        required: true,
        enum: Object.values(classifier_1.FoodCategory),
        validate: {
            validator: (v) => Object.values(classifier_1.FoodCategory).includes(v),
            message: "Invalid food category",
        },
    },
    predictor: {
        type: String,
        required: true,
        lowercase: true,
        validate: {
            validator: (v) => /^0x[a-fA-F0-9]{40}$/.test(v),
            message: "Predictor must be a valid Ethereum address",
        },
    },
    ipfsCid: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (v) => v.length > 0 && v.startsWith("Qm"),
            message: "IPFS CID must be valid",
        },
    },
    resultHash: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^0x[a-fA-F0-9]{64}$/.test(v),
            message: "Result hash must be a valid 32-byte hex string",
        },
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: (v) => v && typeof v === "object" && v.title && v.description,
            message: "Metadata must include title and description",
        },
    },
    onChainId: {
        type: Number,
        min: 1,
        sparse: true,
    },
    onChainTxHash: {
        type: String,
        validate: {
            validator: function (v) {
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
            validator: (v) => /^\d+$/.test(v) && BigInt(v) > 0,
            message: "Stake must be a positive integer (in wei)",
        },
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(PredictionStatus),
        default: PredictionStatus.Processing,
    },
    classificationResult: {
        isFood: {
            type: Boolean,
            required: true,
        },
        category: {
            type: String,
            enum: Object.values(classifier_1.FoodCategory),
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
    submissionAttempts: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastSubmissionError: {
        type: String,
        maxlength: 1000,
    },
    userAgent: {
        type: String,
        maxlength: 500,
    },
    ipAddress: {
        type: String,
        validate: {
            validator: function (v) {
                return (!v ||
                    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v) ||
                    /^[a-fA-F0-9:]+$/.test(v));
            },
            message: "Invalid IP address format",
        },
    },
    onChainCreatedAt: {
        type: Date,
    },
    categoryIndex: {
        type: String,
        default: function () {
            return this.category.toLowerCase();
        },
    },
    statusIndex: {
        type: String,
        default: function () {
            return this.status.toLowerCase();
        },
    },
    predictorIndex: {
        type: String,
        default: function () {
            return this.predictor.toLowerCase();
        },
    },
}, {
    timestamps: true,
    collection: "predictions",
});
PredictionSchema.index({ predictorIndex: 1, createdAt: -1 });
PredictionSchema.index({ categoryIndex: 1, statusIndex: 1 });
PredictionSchema.index({ statusIndex: 1, createdAt: -1 });
PredictionSchema.index({ onChainId: 1 }, { sparse: true });
PredictionSchema.index({ ipfsCid: 1 }, { unique: true });
PredictionSchema.index({ resultHash: 1 });
PredictionSchema.index({
    shortText: "text",
    "metadata.title": "text",
    "metadata.description": "text",
});
PredictionSchema.pre("save", function () {
    this.categoryIndex = this.category.toLowerCase();
    this.statusIndex = this.status.toLowerCase();
    this.predictorIndex = this.predictor.toLowerCase();
});
PredictionSchema.methods.toPublicJSON = function () {
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
PredictionSchema.methods.canRetrySubmission = function () {
    return (this.status === PredictionStatus.Failed &&
        this.submissionAttempts < 3 &&
        (!this.onChainId || this.onChainId === 0));
};
exports.Prediction = mongoose_1.default.model("Prediction", PredictionSchema);
//# sourceMappingURL=Prediction.js.map