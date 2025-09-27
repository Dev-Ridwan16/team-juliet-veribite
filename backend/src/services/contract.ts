import {
  ethers,
  JsonRpcProvider,
  Wallet,
  Contract,
  TransactionResponse,
  TransactionReceipt,
} from "ethers";
import logger from "../utils/logger";
import { FoodCategory } from "./classifier";

// Import the contract ABI (using the simple VeriBitePredictor)
import contractData from "../contracts/VeriBitePredictor.json";

// Extract the ABI and address from the contract data
const CONTRACT_ABI = JSON.parse(contractData.abi);
const CONTRACT_ADDRESS = contractData.address;

/**
 * Smart contract enum mappings (matching Solidity contract)
 */
export enum ContractCategory {
  Ingredient = 0,
  Dish = 1,
  Diet = 2,
  Restaurant = 3,
  Consumption = 4,
  FoodPolicy = 5,
  Other = 6,
}

export enum ContractOutcome {
  Pending = 0,
  Correct = 1,
  Incorrect = 2,
  Disputed = 3,
  Settled = 4,
}

/**
 * Contract interaction interfaces
 */
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

/**
 * Smart contract service for interacting with VeriBiteFoodPredictor
 */
export class ContractService {
  private provider: JsonRpcProvider;
  private contract: Contract;
  private relayerWallet?: Wallet;
  private ownerWallet?: Wallet;
  private contractAddress: string;

  constructor(
    rpcUrl: string,
    contractAddress: string,
    relayerPrivateKey?: string,
    ownerPrivateKey?: string
  ) {
    // Initialize provider
    this.provider = new JsonRpcProvider(rpcUrl);
    this.contractAddress = contractAddress;

    // Initialize contract instance
    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.provider);

    // Initialize wallets if private keys provided
    if (relayerPrivateKey) {
      this.relayerWallet = new Wallet(relayerPrivateKey, this.provider);
      logger.info("Relayer wallet initialized");
    }

    if (ownerPrivateKey) {
      this.ownerWallet = new Wallet(ownerPrivateKey, this.provider);
      logger.info("Owner wallet initialized for admin operations");
    }

    logger.info(`Contract service initialized for address: ${contractAddress}`);
  }

  /**
   * Submit prediction to smart contract (relayer mode)
   */
  async submitPrediction(
    submission: PredictionSubmission
  ): Promise<SubmissionResult> {
    try {
      if (!this.relayerWallet) {
        throw new Error("Relayer wallet not configured for submission mode");
      }

      logger.info("Submitting prediction to smart contract");
      logger.info(
        `Category: ${submission.category}, Stake: ${ethers.formatEther(
          submission.stakeWei
        )} ETH`
      );

      // Connect contract to relayer wallet
      const contractWithSigner = this.contract.connect(this.relayerWallet);

      // Prepare transaction using 'any' to bypass TypeScript checks for now
      const tx = await (contractWithSigner as any).submitPrediction(
        submission.shortText,
        {
          value: submission.stakeWei,
          gasLimit: 500000, // Set reasonable gas limit
        }
      );

      logger.info(`Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt: TransactionReceipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

      // Extract prediction ID from events
      let predictionId: number | undefined;

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
        } catch (error) {
          // Ignore parsing errors for logs we don't care about
          continue;
        }
      }

      logger.info(
        `Prediction submitted successfully. ID: ${predictionId}, Tx: ${tx.hash}`
      );

      return {
        success: true,
        transactionHash: tx.hash,
        predictionId,
      };
    } catch (error: any) {
      logger.error("Failed to submit prediction to contract:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get prediction details from contract
   */
  async getPrediction(id: number): Promise<ContractPrediction | null> {
    try {
      logger.info(`Fetching prediction ${id} from contract`);

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
    } catch (error: any) {
      logger.error(`Failed to fetch prediction ${id}:`, error);
      return null;
    }
  }

  /**
   * Get multiple predictions by IDs
   */
  async getPredictions(ids: number[]): Promise<ContractPrediction[]> {
    const predictions: ContractPrediction[] = [];

    // Batch requests using Promise.allSettled for error resilience
    const promises = ids.map((id) => this.getPrediction(id));
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        predictions.push(result.value);
      }
    }

    return predictions;
  }

  /**
   * Get all prediction IDs (paginated)
   */
  async getPredictionIds(
    offset: number = 0,
    limit: number = 50
  ): Promise<number[]> {
    try {
      logger.info(
        `Fetching prediction IDs (offset: ${offset}, limit: ${limit})`
      );

      const ids = await this.contract.getPredictionIdsPaginated(offset, limit);
      return ids.map((id: any) => Number(id));
    } catch (error: any) {
      logger.error("Failed to fetch prediction IDs:", error);
      return [];
    }
  }

  /**
   * Get predictions by category
   */
  async getPredictionsByCategory(
    category: ContractCategory
  ): Promise<number[]> {
    try {
      const ids = await this.contract.getPredictionsByCategory(category);
      return ids.map((id: any) => Number(id));
    } catch (error: any) {
      logger.error(
        `Failed to fetch predictions by category ${category}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get predictions by outcome
   */
  async getPredictionsByOutcome(outcome: ContractOutcome): Promise<number[]> {
    try {
      const ids = await this.contract.getPredictionsByOutcome(outcome);
      return ids.map((id: any) => Number(id));
    } catch (error: any) {
      logger.error(`Failed to fetch predictions by outcome ${outcome}:`, error);
      return [];
    }
  }

  /**
   * Get user's prediction IDs
   */
  async getUserPredictionIds(userAddress: string): Promise<number[]> {
    try {
      const ids = await this.contract.getUserPredictionIds(userAddress);
      return ids.map((id: any) => Number(id));
    } catch (error: any) {
      logger.error(
        `Failed to fetch user predictions for ${userAddress}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ContractStats | null> {
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
    } catch (error: any) {
      logger.error("Failed to fetch contract stats:", error);
      return null;
    }
  }

  /**
   * Mark prediction outcome (admin only)
   */
  async markOutcome(
    predictionId: number,
    outcome: ContractOutcome
  ): Promise<SubmissionResult> {
    try {
      if (!this.ownerWallet) {
        throw new Error("Owner wallet not configured for admin operations");
      }

      logger.info(`Marking prediction ${predictionId} as outcome ${outcome}`);

      // Convert outcome to boolean for simple contract
      const isCorrect = outcome === ContractOutcome.Correct;

      const contractWithOwner = this.contract.connect(this.ownerWallet);
      const tx = await (contractWithOwner as any).markOutcome(
        predictionId,
        isCorrect
      );

      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

      logger.info(`Successfully marked outcome for prediction ${predictionId}`);

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error: any) {
      logger.error(
        `Failed to mark outcome for prediction ${predictionId}:`,
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Distribute reward (admin only)
   */
  async distributeReward(predictionId: number): Promise<SubmissionResult> {
    try {
      if (!this.ownerWallet) {
        throw new Error("Owner wallet not configured for admin operations");
      }

      logger.info(`Distributing reward for prediction ${predictionId}`);

      const contractWithOwner = this.contract.connect(this.ownerWallet);
      const tx = await (contractWithOwner as any).distributeReward(
        predictionId
      );

      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

      logger.info(
        `Successfully distributed reward for prediction ${predictionId}`
      );

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error: any) {
      logger.error(
        `Failed to distribute reward for prediction ${predictionId}:`,
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Batch distribute rewards (admin only) - NOT SUPPORTED IN SIMPLE CONTRACT
   * TODO: Implement if needed or remove
   */
  async batchDistributeRewards(
    predictionIds: number[]
  ): Promise<SubmissionResult> {
    try {
      // This method is not supported in the simple VeriBitePredictor contract
      throw new Error(
        "Batch distribute rewards not supported in simple contract"
      );

      /*
      if (!this.ownerWallet) {
        throw new Error("Owner wallet not configured for admin operations");
      }

      logger.info(
        `Batch distributing rewards for ${predictionIds.length} predictions`
      );

      const contractWithOwner = this.contract.connect(this.ownerWallet);
      const tx = await contractWithOwner.batchDistributeRewards(predictionIds);
      */

      /*
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

      logger.info(`Successfully batch distributed rewards`);

      return {
        success: true,
        transactionHash: tx.hash,
      };
      */
    } catch (error: any) {
      logger.error("Failed to batch distribute rewards:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update minimum stake (admin only) - NOT SUPPORTED IN SIMPLE CONTRACT
   */
  async updateMinStake(minStakeWei: string): Promise<SubmissionResult> {
    try {
      // This method is not supported in the simple VeriBitePredictor contract
      throw new Error("Update minimum stake not supported in simple contract");
    } catch (error: any) {
      logger.error("Failed to update minimum stake:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Withdraw contract funds (admin only) - NOT SUPPORTED IN SIMPLE CONTRACT
   */
  async withdraw(amount: string): Promise<SubmissionResult> {
    try {
      // This method is not supported in the simple VeriBitePredictor contract
      throw new Error("Withdraw not supported in simple contract");
    } catch (error: any) {
      logger.error("Failed to withdraw funds:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if contract is accessible
   */
  async isContractAccessible(): Promise<boolean> {
    try {
      // Try to call a simple view function
      await this.contract.minStake();
      return true;
    } catch (error: any) {
      logger.error("Contract not accessible:", error);
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return gasPrice.gasPrice || BigInt(0);
    } catch (error: any) {
      logger.error("Failed to get gas price:", error);
      return BigInt(0);
    }
  }
}

/**
 * Utility functions
 */
export class ContractUtils {
  /**
   * Convert FoodCategory to ContractCategory
   */
  static foodCategoryToContract(category: FoodCategory): ContractCategory {
    switch (category) {
      case FoodCategory.Ingredient:
        return ContractCategory.Ingredient;
      case FoodCategory.Dish:
        return ContractCategory.Dish;
      case FoodCategory.Diet:
        return ContractCategory.Diet;
      case FoodCategory.Restaurant:
        return ContractCategory.Restaurant;
      case FoodCategory.Consumption:
        return ContractCategory.Consumption;
      case FoodCategory.FoodPolicy:
        return ContractCategory.FoodPolicy;
      case FoodCategory.Other:
      default:
        return ContractCategory.Other;
    }
  }

  /**
   * Convert ContractCategory to FoodCategory
   */
  static contractCategoryToFood(category: ContractCategory): FoodCategory {
    switch (category) {
      case ContractCategory.Ingredient:
        return FoodCategory.Ingredient;
      case ContractCategory.Dish:
        return FoodCategory.Dish;
      case ContractCategory.Diet:
        return FoodCategory.Diet;
      case ContractCategory.Restaurant:
        return FoodCategory.Restaurant;
      case ContractCategory.Consumption:
        return FoodCategory.Consumption;
      case ContractCategory.FoodPolicy:
        return FoodCategory.FoodPolicy;
      case ContractCategory.Other:
      default:
        return FoodCategory.Other;
    }
  }

  /**
   * Validate Ethereum address
   */
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Format Wei to Ether string
   */
  static formatEther(wei: string | bigint): string {
    try {
      return ethers.formatEther(wei);
    } catch {
      return "0";
    }
  }

  /**
   * Parse Ether to Wei string
   */
  static parseEther(ether: string): string {
    try {
      return ethers.parseEther(ether).toString();
    } catch {
      return "0";
    }
  }
}

/**
 * Factory function to create contract service
 */
export function createContractService(): ContractService {
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

  return new ContractService(
    rpcUrl,
    contractAddress,
    relayerPrivateKey,
    ownerPrivateKey
  );
}
