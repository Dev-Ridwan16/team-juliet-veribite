import { ethers } from "ethers";
import { Address } from "viem";
import {
  retryWeb3Operation,
  retryWithCircuitBreakerHandling,
  parseWeb3Error,
  logWeb3Error,
} from "./error-handling";

// Real deployed contract address and ABI - SEPOLIA DEPLOYMENT
export const CONTRACT_ADDRESS: Address =
  "0xAC93ef07c3861b071169F34D610027A79DF3B742";

// Prediction status enum
export enum PredictionStatus {
  PENDING = 0,
  CORRECT = 1,
  INCORRECT = 2,
}

// Prediction interface
export interface Prediction {
  id: bigint;
  user: Address;
  predictor: Address; // Alias for backward compatibility
  text: string;
  predictionText: string; // Alias for backward compatibility
  timestamp: bigint;
  stake: bigint;
  status: PredictionStatus;
}

// Real contract ABI from deployment
export const CONTRACT_ABI = [
  {
    type: "constructor",
    stateMutability: "undefined",
    payable: false,
    inputs: [],
  },
  {
    type: "error",
    name: "EnforcedPause",
    inputs: [],
  },
  {
    type: "error",
    name: "ExpectedPause",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientStake",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidStatus",
    inputs: [],
  },
  {
    type: "error",
    name: "NoRewardsAvailable",
    inputs: [],
  },
  {
    type: "error",
    name: "OnlyPredictionOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ type: "address", name: "owner" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ type: "address", name: "account" }],
  },
  {
    type: "error",
    name: "PredictionAlreadyResolved",
    inputs: [],
  },
  {
    type: "error",
    name: "PredictionNotFound",
    inputs: [],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "TextTooLong",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [],
  },
  {
    type: "event",
    anonymous: false,
    name: "OutcomeResolved",
    inputs: [
      { type: "uint256", name: "id", indexed: true },
      { type: "bool", name: "correct", indexed: false },
      { type: "address", name: "user", indexed: true },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "OwnershipTransferred",
    inputs: [
      { type: "address", name: "previousOwner", indexed: true },
      { type: "address", name: "newOwner", indexed: true },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "Paused",
    inputs: [{ type: "address", name: "account", indexed: false }],
  },
  {
    type: "event",
    anonymous: false,
    name: "PredictionSubmitted",
    inputs: [
      { type: "address", name: "user", indexed: true },
      { type: "uint256", name: "id", indexed: true },
      { type: "string", name: "text", indexed: false },
      { type: "uint256", name: "stake", indexed: false },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "RewardDistributed",
    inputs: [
      { type: "address", name: "user", indexed: true },
      { type: "uint256", name: "predictionId", indexed: true },
      { type: "uint256", name: "amount", indexed: false },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "StakeWithdrawn",
    inputs: [
      { type: "address", name: "user", indexed: true },
      { type: "uint256", name: "predictionId", indexed: true },
      { type: "uint256", name: "amount", indexed: false },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "Unpaused",
    inputs: [{ type: "address", name: "account", indexed: false }],
  },
  {
    type: "function",
    name: "MAX_TEXT_LENGTH",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "MIN_STAKE",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "distributeReward",
    constant: false,
    payable: false,
    inputs: [{ type: "uint256", name: "id" }],
    outputs: [],
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    constant: false,
    payable: false,
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "getAllPredictions",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        name: "",
        components: [
          { type: "uint256", name: "id" },
          { type: "address", name: "user" },
          { type: "string", name: "text" },
          { type: "uint256", name: "timestamp" },
          { type: "uint256", name: "stake" },
          { type: "uint8", name: "status" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getContractStats",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [
      { type: "uint256", name: "totalPredictions" },
      { type: "uint256", name: "totalUsers" },
      { type: "uint256", name: "contractBalance" },
      { type: "uint256", name: "totalStake" },
      { type: "uint256", name: "totalRewards" },
    ],
  },
  {
    type: "function",
    name: "getPredictionsByStatus",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [{ type: "uint8", name: "status" }],
    outputs: [
      {
        type: "tuple[]",
        name: "",
        components: [
          { type: "uint256", name: "id" },
          { type: "address", name: "user" },
          { type: "string", name: "text" },
          { type: "uint256", name: "timestamp" },
          { type: "uint256", name: "stake" },
          { type: "uint8", name: "status" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTotalPredictions",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "getUserPredictions",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [{ type: "address", name: "user" }],
    outputs: [
      {
        type: "tuple[]",
        name: "",
        components: [
          { type: "uint256", name: "id" },
          { type: "address", name: "user" },
          { type: "string", name: "text" },
          { type: "uint256", name: "timestamp" },
          { type: "uint256", name: "stake" },
          { type: "uint8", name: "status" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "markOutcome",
    constant: false,
    payable: false,
    inputs: [
      { type: "uint256", name: "id" },
      { type: "bool", name: "correct" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "address", name: "" }],
  },
  {
    type: "function",
    name: "pause",
    constant: false,
    payable: false,
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "paused",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "bool", name: "" }],
  },
  {
    type: "function",
    name: "predictionIds",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [{ type: "uint256", name: "" }],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "predictions",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [{ type: "uint256", name: "" }],
    outputs: [
      { type: "uint256", name: "id" },
      { type: "address", name: "user" },
      { type: "string", name: "text" },
      { type: "uint256", name: "timestamp" },
      { type: "uint256", name: "stake" },
      { type: "uint8", name: "status" },
    ],
  },
  {
    type: "function",
    name: "renounceOwnership",
    constant: false,
    payable: false,
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "submitPrediction",
    constant: false,
    stateMutability: "payable",
    payable: true,
    inputs: [{ type: "string", name: "text" }],
    outputs: [],
  },
  {
    type: "function",
    name: "totalRewardsDistributed",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "totalStaked",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "transferOwnership",
    constant: false,
    payable: false,
    inputs: [{ type: "address", name: "newOwner" }],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    constant: false,
    payable: false,
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "userPredictions",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [
      { type: "address", name: "" },
      { type: "uint256", name: "" },
    ],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "userRewards",
    constant: true,
    stateMutability: "view",
    payable: false,
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "withdrawIncorrectStake",
    constant: false,
    payable: false,
    inputs: [{ type: "uint256", name: "id" }],
    outputs: [],
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
];

// Contract interaction functions
export async function submitPrediction(
  text: string,
  stake: string,
  signer: ethers.Signer
) {
  return retryWithCircuitBreakerHandling(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Convert stake to wei
      const stakeWei = ethers.parseEther(stake);

      const tx = await contract.submitPrediction(text, {
        value: stakeWei,
      });

      await tx.wait();
      return tx;
    },
    () => {
      console.log(
        "Circuit breaker detected during prediction submission, retrying..."
      );
    }
  );
}

// Get all predictions
export async function getAllPredictions(provider: ethers.Provider) {
  return retryWeb3Operation(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      const predictions = await contract.getAllPredictions();

      return predictions.map((pred: any) => ({
        id: pred.id,
        user: pred.user,
        predictor: pred.user, // Alias for backward compatibility
        text: pred.text,
        predictionText: pred.text, // Alias for backward compatibility
        timestamp: pred.timestamp,
        stake: pred.stake,
        status: Number(pred.status) as PredictionStatus,
      }));
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
    }
  );
}

// Contract interaction functions - legacy format for compatibility
export const contractFunctions = {
  // Submit a new prediction
  submitPrediction: async (
    signer: ethers.Signer,
    predictionText: string,
    stakeAmount: string = "0.01"
  ): Promise<ethers.ContractTransactionResponse> => {
    const stakeValue = ethers.parseEther(stakeAmount);
    return await submitPrediction(predictionText, stakeAmount, signer);
  },

  // Get all predictions
  getAllPredictions: async (
    provider: ethers.Provider
  ): Promise<Prediction[]> => {
    return await getAllPredictions(provider);
  },

  // Mark prediction outcome (admin only)
  markOutcome: async (
    signer: ethers.Signer,
    predictionId: number,
    outcome: PredictionStatus
  ): Promise<ethers.ContractTransactionResponse> => {
    const correct = outcome === PredictionStatus.CORRECT;
    return await markOutcome(predictionId, correct, signer);
  },

  // Distribute reward (admin only)
  distributeReward: async (
    signer: ethers.Signer,
    predictionId: number
  ): Promise<ethers.ContractTransactionResponse> => {
    return retryWithCircuitBreakerHandling(
      async () => {
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        const tx = await contract.distributeReward(predictionId);
        await tx.wait();
        return tx;
      },
      () => {
        console.log(
          "Circuit breaker detected during reward distribution, retrying..."
        );
      }
    );
  },

  // Get contract owner
  getOwner: async (provider: ethers.Provider): Promise<Address> => {
    return retryWeb3Operation(
      async () => {
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );
        return await contract.owner();
      },
      {
        maxAttempts: 2,
        baseDelay: 500,
      }
    );
  },
};

// Helper functions
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEther = (wei: bigint): string => {
  return parseFloat(ethers.formatEther(wei)).toFixed(4);
};

export const formatTimestamp = (timestamp: bigint): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
};

export const getStatusText = (status: PredictionStatus): string => {
  switch (status) {
    case PredictionStatus.PENDING:
      return "Pending";
    case PredictionStatus.CORRECT:
      return "Correct";
    case PredictionStatus.INCORRECT:
      return "Incorrect";
    default:
      return "Unknown";
  }
};

export const getStatusColor = (status: PredictionStatus): string => {
  switch (status) {
    case PredictionStatus.PENDING:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case PredictionStatus.CORRECT:
      return "bg-green-100 text-green-800 border-green-200";
    case PredictionStatus.INCORRECT:
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Get user predictions
export async function getUserPredictions(
  userAddress: string,
  provider: ethers.Provider
) {
  return retryWeb3Operation(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      const predictions = await contract.getUserPredictions(userAddress);
      return predictions;
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
    }
  );
}

// Get contract statistics
export async function getContractStats(provider: ethers.Provider) {
  return retryWeb3Operation(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      const stats = await contract.getContractStats();
      return {
        totalPredictions: stats[0].toString(),
        totalUsers: stats[1].toString(),
        contractBalance: ethers.formatEther(stats[2]),
        totalStake: ethers.formatEther(stats[3]),
        totalRewards: ethers.formatEther(stats[4]),
      };
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
    }
  );
}

// Admin function - mark prediction outcome
export async function markOutcome(
  predictionId: number,
  correct: boolean,
  signer: ethers.Signer
) {
  return retryWithCircuitBreakerHandling(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      const tx = await contract.markOutcome(predictionId, correct);
      await tx.wait();
      return tx;
    },
    () => {
      console.log(
        "Circuit breaker detected during outcome marking, retrying..."
      );
    }
  );
}

// Get minimum stake requirement
export async function getMinStake(provider: ethers.Provider) {
  return retryWeb3Operation(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      const minStake = await contract.MIN_STAKE();
      return ethers.formatEther(minStake);
    },
    {
      maxAttempts: 2,
      baseDelay: 500,
    }
  );
}

// Check if contract is paused
export async function isPaused(provider: ethers.Provider) {
  return retryWeb3Operation(
    async () => {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      return await contract.paused();
    },
    {
      maxAttempts: 2,
      baseDelay: 500,
    }
  );
}
