import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  address: string;
  totalPredictions: number;
  correctPredictions: number;
  totalStaked: string;
  totalRewards: string;
  reputation: number;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: "Invalid Ethereum address format",
      },
    },
    totalPredictions: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctPredictions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStaked: {
      type: String,
      default: "0",
      validate: {
        validator: function (v: string) {
          return /^\d+(\.\d+)?$/.test(v);
        },
        message: "Total staked must be a valid number string",
      },
    },
    totalRewards: {
      type: String,
      default: "0",
      validate: {
        validator: function (v: string) {
          return /^\d+(\.\d+)?$/.test(v);
        },
        message: "Total rewards must be a valid number string",
      },
    },
    reputation: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    indexes: [
      { reputation: -1 },
      { totalPredictions: -1 },
      { correctPredictions: -1 },
      { lastActivity: -1 },
    ],
  }
);

// Virtual for accuracy percentage
UserSchema.virtual("accuracyPercentage").get(function (this: IUser) {
  if (this.totalPredictions === 0) return 0;
  return (this.correctPredictions / this.totalPredictions) * 100;
});

// Ensure virtual fields are serialized
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export default mongoose.model<IUser>("User", UserSchema);
