"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractUtils = exports.ContractService = exports.ContractOutcome = exports.ContractCategory = void 0;
exports.createContractService = createContractService;
const ethers_1 = require("ethers");
const logger_1 = __importDefault(require("../utils/logger"));
const classifier_1 = require("./classifier");
const VeriBitePredictor_json_1 = __importDefault(require("../contracts/VeriBitePredictor.json"));
const CONTRACT_ABI = JSON.parse(VeriBitePredictor_json_1.default.abi);
const CONTRACT_ADDRESS = VeriBitePredictor_json_1.default.address;
var ContractCategory;
(function (ContractCategory) {
    ContractCategory[ContractCategory["Ingredient"] = 0] = "Ingredient";
    ContractCategory[ContractCategory["Dish"] = 1] = "Dish";
    ContractCategory[ContractCategory["Diet"] = 2] = "Diet";
    ContractCategory[ContractCategory["Restaurant"] = 3] = "Restaurant";
    ContractCategory[ContractCategory["Consumption"] = 4] = "Consumption";
    ContractCategory[ContractCategory["FoodPolicy"] = 5] = "FoodPolicy";
    ContractCategory[ContractCategory["Other"] = 6] = "Other";
})(ContractCategory || (exports.ContractCategory = ContractCategory = {}));
var ContractOutcome;
(function (ContractOutcome) {
    ContractOutcome[ContractOutcome["Pending"] = 0] = "Pending";
    ContractOutcome[ContractOutcome["Correct"] = 1] = "Correct";
    ContractOutcome[ContractOutcome["Incorrect"] = 2] = "Incorrect";
    ContractOutcome[ContractOutcome["Disputed"] = 3] = "Disputed";
    ContractOutcome[ContractOutcome["Settled"] = 4] = "Settled";
})(ContractOutcome || (exports.ContractOutcome = ContractOutcome = {}));
class ContractService {
    constructor(rpcUrl, contractAddress, relayerPrivateKey, ownerPrivateKey) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.contractAddress = contractAddress;
        this.contract = new ethers_1.Contract(contractAddress, CONTRACT_ABI, this.provider);
        if (relayerPrivateKey) {
            this.relayerWallet = new ethers_1.Wallet(relayerPrivateKey, this.provider);
            logger_1.default.info("Relayer wallet initialized");
        }
        if (ownerPrivateKey) {
            this.ownerWallet = new ethers_1.Wallet(ownerPrivateKey, this.provider);
            logger_1.default.info("Owner wallet initialized for admin operations");
        }
        logger_1.default.info(`Contract service initialized for address: ${contractAddress}`);
    }
    async submitPrediction(submission) {
        try {
            if (!this.relayerWallet) {
                throw new Error("Relayer wallet not configured for submission mode");
            }
            logger_1.default.info("Submitting prediction to smart contract");
            logger_1.default.info(`Category: ${submission.category}, Stake: ${ethers_1.ethers.formatEther(submission.stakeWei)} ETH`);
            const contractWithSigner = this.contract.connect(this.relayerWallet);
            const tx = await contractWithSigner.submitPrediction(submission.shortText, {
                value: submission.stakeWei,
                gasLimit: 500000,
            });
            logger_1.default.info(`Transaction submitted: ${tx.hash}`);
            const receipt = await tx.wait();
            if (!receipt || receipt.status !== 1) {
                throw new Error("Transaction failed");
            }
            let predictionId;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = this.contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data,
                    });
                    if (parsedLog && parsedLog.name === "FoodPredictionSubmitted") {
                        predictionId = Number(parsedLog.args[0]);
                        break;
                    }
                }
                catch (error) {
                    continue;
                }
            }
            logger_1.default.info(`Prediction submitted successfully. ID: ${predictionId}, Tx: ${tx.hash}`);
            return {
                success: true,
                transactionHash: tx.hash,
                predictionId,
            };
        }
        catch (error) {
            logger_1.default.error("Failed to submit prediction to contract:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getPrediction(id) {
        try {
            logger_1.default.info(`Fetching prediction ${id} from contract`);
            const prediction = await this.contract.getPrediction(id);
            return {
                id: Number(prediction.id),
                predictor: prediction.predictor,
                category: Number(prediction.category),
                shortText: prediction.shortText,
                ipfsCid: prediction.ipfsCid,
                resultHash: prediction.resultHash,
                stake: prediction.stake.toString(),
                outcome: Number(prediction.outcome),
                createdAt: Number(prediction.createdAt),
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to fetch prediction ${id}:`, error);
            return null;
        }
    }
    async getPredictions(ids) {
        const predictions = [];
        const promises = ids.map((id) => this.getPrediction(id));
        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
                predictions.push(result.value);
            }
        }
        return predictions;
    }
    async getPredictionIds(offset = 0, limit = 50) {
        try {
            logger_1.default.info(`Fetching prediction IDs (offset: ${offset}, limit: ${limit})`);
            const ids = await this.contract.getPredictionIdsPaginated(offset, limit);
            return ids.map((id) => Number(id));
        }
        catch (error) {
            logger_1.default.error("Failed to fetch prediction IDs:", error);
            return [];
        }
    }
    async getPredictionsByCategory(category) {
        try {
            const ids = await this.contract.getPredictionsByCategory(category);
            return ids.map((id) => Number(id));
        }
        catch (error) {
            logger_1.default.error(`Failed to fetch predictions by category ${category}:`, error);
            return [];
        }
    }
    async getPredictionsByOutcome(outcome) {
        try {
            const ids = await this.contract.getPredictionsByOutcome(outcome);
            return ids.map((id) => Number(id));
        }
        catch (error) {
            logger_1.default.error(`Failed to fetch predictions by outcome ${outcome}:`, error);
            return [];
        }
    }
    async getUserPredictionIds(userAddress) {
        try {
            const ids = await this.contract.getUserPredictionIds(userAddress);
            return ids.map((id) => Number(id));
        }
        catch (error) {
            logger_1.default.error(`Failed to fetch user predictions for ${userAddress}:`, error);
            return [];
        }
    }
    async getContractStats() {
        try {
            const stats = await this.contract.getContractStats();
            return {
                totalPredictions: Number(stats[0]),
                totalUsers: Number(stats[1]),
                contractBalance: stats[2].toString(),
                totalStaked: stats[3].toString(),
                totalRewards: stats[4].toString(),
                totalFees: stats[5].toString(),
            };
        }
        catch (error) {
            logger_1.default.error("Failed to fetch contract stats:", error);
            return null;
        }
    }
    async markOutcome(predictionId, outcome) {
        try {
            if (!this.ownerWallet) {
                throw new Error("Owner wallet not configured for admin operations");
            }
            logger_1.default.info(`Marking prediction ${predictionId} as outcome ${outcome}`);
            const isCorrect = outcome === ContractOutcome.Correct;
            const contractWithOwner = this.contract.connect(this.ownerWallet);
            const tx = await contractWithOwner.markOutcome(predictionId, isCorrect);
            const receipt = await tx.wait();
            if (!receipt || receipt.status !== 1) {
                throw new Error("Transaction failed");
            }
            logger_1.default.info(`Successfully marked outcome for prediction ${predictionId}`);
            return {
                success: true,
                transactionHash: tx.hash,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to mark outcome for prediction ${predictionId}:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async distributeReward(predictionId) {
        try {
            if (!this.ownerWallet) {
                throw new Error("Owner wallet not configured for admin operations");
            }
            logger_1.default.info(`Distributing reward for prediction ${predictionId}`);
            const contractWithOwner = this.contract.connect(this.ownerWallet);
            const tx = await contractWithOwner.distributeReward(predictionId);
            const receipt = await tx.wait();
            if (!receipt || receipt.status !== 1) {
                throw new Error("Transaction failed");
            }
            logger_1.default.info(`Successfully distributed reward for prediction ${predictionId}`);
            return {
                success: true,
                transactionHash: tx.hash,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to distribute reward for prediction ${predictionId}:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async batchDistributeRewards(predictionIds) {
        try {
            throw new Error("Batch distribute rewards not supported in simple contract");
        }
        catch (error) {
            logger_1.default.error("Failed to batch distribute rewards:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async updateMinStake(minStakeWei) {
        try {
            throw new Error("Update minimum stake not supported in simple contract");
        }
        catch (error) {
            logger_1.default.error("Failed to update minimum stake:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async withdraw(amount) {
        try {
            throw new Error("Withdraw not supported in simple contract");
        }
        catch (error) {
            logger_1.default.error("Failed to withdraw funds:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async isContractAccessible() {
        try {
            await this.contract.minStake();
            return true;
        }
        catch (error) {
            logger_1.default.error("Contract not accessible:", error);
            return false;
        }
    }
    async getGasPrice() {
        try {
            const gasPrice = await this.provider.getFeeData();
            return gasPrice.gasPrice || BigInt(0);
        }
        catch (error) {
            logger_1.default.error("Failed to get gas price:", error);
            return BigInt(0);
        }
    }
}
exports.ContractService = ContractService;
class ContractUtils {
    static foodCategoryToContract(category) {
        switch (category) {
            case classifier_1.FoodCategory.Ingredient:
                return ContractCategory.Ingredient;
            case classifier_1.FoodCategory.Dish:
                return ContractCategory.Dish;
            case classifier_1.FoodCategory.Diet:
                return ContractCategory.Diet;
            case classifier_1.FoodCategory.Restaurant:
                return ContractCategory.Restaurant;
            case classifier_1.FoodCategory.Consumption:
                return ContractCategory.Consumption;
            case classifier_1.FoodCategory.FoodPolicy:
                return ContractCategory.FoodPolicy;
            case classifier_1.FoodCategory.Other:
            default:
                return ContractCategory.Other;
        }
    }
    static contractCategoryToFood(category) {
        switch (category) {
            case ContractCategory.Ingredient:
                return classifier_1.FoodCategory.Ingredient;
            case ContractCategory.Dish:
                return classifier_1.FoodCategory.Dish;
            case ContractCategory.Diet:
                return classifier_1.FoodCategory.Diet;
            case ContractCategory.Restaurant:
                return classifier_1.FoodCategory.Restaurant;
            case ContractCategory.Consumption:
                return classifier_1.FoodCategory.Consumption;
            case ContractCategory.FoodPolicy:
                return classifier_1.FoodCategory.FoodPolicy;
            case ContractCategory.Other:
            default:
                return classifier_1.FoodCategory.Other;
        }
    }
    static isValidAddress(address) {
        try {
            return ethers_1.ethers.isAddress(address);
        }
        catch {
            return false;
        }
    }
    static formatEther(wei) {
        try {
            return ethers_1.ethers.formatEther(wei);
        }
        catch {
            return "0";
        }
    }
    static parseEther(ether) {
        try {
            return ethers_1.ethers.parseEther(ether).toString();
        }
        catch {
            return "0";
        }
    }
}
exports.ContractUtils = ContractUtils;
function createContractService() {
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    if (!rpcUrl) {
        throw new Error("RPC_URL environment variable is required");
    }
    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is required");
    }
    return new ContractService(rpcUrl, contractAddress, relayerPrivateKey, ownerPrivateKey);
}
//# sourceMappingURL=contract.js.map