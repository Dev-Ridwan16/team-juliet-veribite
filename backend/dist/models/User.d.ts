import mongoose, { Document } from "mongoose";
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
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map