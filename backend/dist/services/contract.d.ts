import { FoodCategory } from "./classifier";
export declare enum ContractCategory {
    Ingredient = 0,
    Dish = 1,
    Diet = 2,
    Restaurant = 3,
    Consumption = 4,
    FoodPolicy = 5,
    Other = 6
}
export declare enum ContractOutcome {
    Pending = 0,
    Correct = 1,
    Incorrect = 2,
    Disputed = 3,
    Settled = 4
}
export interface PredictionSubmission {
    category: ContractCategory;
    shortText: string;
    ipfsCid: string;
    resultHash: string;
    stakeWei: string;
}
export interface ContractPrediction {
    id: number;
    predictor: string;
    category: ContractCategory;
    shortText: string;
    ipfsCid: string;
    resultHash: string;
    stake: string;
    outcome: ContractOutcome;
    createdAt: number;
}
export interface ContractStats {
    totalPredictions: number;
    totalUsers: number;
    contractBalance: string;
    totalStaked: string;
    totalRewards: string;
    totalFees: string;
}
export interface SubmissionResult {
    success: boolean;
    transactionHash?: string;
    predictionId?: number;
    error?: string;
}
export declare class ContractService {
    private provider;
    private contract;
    private relayerWallet?;
    private ownerWallet?;
    private contractAddress;
    constructor(rpcUrl: string, contractAddress: string, relayerPrivateKey?: string, ownerPrivateKey?: string);
    submitPrediction(submission: PredictionSubmission): Promise<SubmissionResult>;
    getPrediction(id: number): Promise<ContractPrediction | null>;
    getPredictions(ids: number[]): Promise<ContractPrediction[]>;
    getPredictionIds(offset?: number, limit?: number): Promise<number[]>;
    getPredictionsByCategory(category: ContractCategory): Promise<number[]>;
    getPredictionsByOutcome(outcome: ContractOutcome): Promise<number[]>;
    getUserPredictionIds(userAddress: string): Promise<number[]>;
    getContractStats(): Promise<ContractStats | null>;
    markOutcome(predictionId: number, outcome: ContractOutcome): Promise<SubmissionResult>;
    distributeReward(predictionId: number): Promise<SubmissionResult>;
    batchDistributeRewards(predictionIds: number[]): Promise<SubmissionResult>;
    updateMinStake(minStakeWei: string): Promise<SubmissionResult>;
    withdraw(amount: string): Promise<SubmissionResult>;
    isContractAccessible(): Promise<boolean>;
    getGasPrice(): Promise<bigint>;
}
export declare class ContractUtils {
    static foodCategoryToContract(category: FoodCategory): ContractCategory;
    static contractCategoryToFood(category: ContractCategory): FoodCategory;
    static isValidAddress(address: string): boolean;
    static formatEther(wei: string | bigint): string;
    static parseEther(ether: string): string;
}
export declare function createContractService(): ContractService;
//# sourceMappingURL=contract.d.ts.map