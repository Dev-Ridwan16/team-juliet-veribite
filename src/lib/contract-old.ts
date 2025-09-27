import { ethers } from "ethers";
import { Address } from "viem";

// TODO: Replace with actual contract address and ABI
export const CONTRACT_ADDRESS: Address =
  "0x0000000000000000000000000000000000000000";

// TODO: Replace with actual contract ABI
export const CONTRACT_ABI = [
  // Prediction submission
  {
    inputs: [
      { internalType: "string", name: "predictionText", type: "string" },
    ],
    name: "submitPrediction",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Get all predictions
  {
    inputs: [],
    name: "getAllPredictions",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "predictor", type: "address" },
          { internalType: "string", name: "predictionText", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "stake", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
        ],
        internalType: "struct VeriBite.Prediction[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Mark prediction outcome (admin only)
  {
    inputs: [
      { internalType: "uint256", name: "predictionId", type: "uint256" },
      { internalType: "uint8", name: "outcome", type: "uint8" },
    ],
    name: "markOutcome",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Distribute reward (admin only)
  {
    inputs: [
      { internalType: "uint256", name: "predictionId", type: "uint256" },
    ],
    name: "distributeReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Get contract owner
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: true,
        internalType: "address",
        name: "predictor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "predictionText",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "stake",
        type: "uint256",
      },
    ],
    name: "PredictionSubmitted",
    type: "event",
  },
];

// Prediction status enum
export enum PredictionStatus {
  PENDING = 0,
  CORRECT = 1,
  INCORRECT = 2,
}

// Prediction interface
export interface Prediction {
  id: bigint;
  predictor: Address;
  predictionText: string;
  timestamp: bigint;
  stake: bigint;
  status: PredictionStatus;
}

// Contract interaction functions
export const contractFunctions = {
  // Submit a new prediction
  submitPrediction: async (
    signer: ethers.Signer,
    predictionText: string,
    stakeAmount: string = "0.01"
  ): Promise<ethers.ContractTransactionResponse> => {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    const stakeValue = ethers.parseEther(stakeAmount);

    return await contract.submitPrediction(predictionText, {
      value: stakeValue,
    });
  },

  // Get all predictions
  getAllPredictions: async (
    provider: ethers.Provider
  ): Promise<Prediction[]> => {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );
    const predictions = await contract.getAllPredictions();

    return predictions.map((pred: any) => ({
      id: pred.id,
      predictor: pred.predictor,
      predictionText: pred.predictionText,
      timestamp: pred.timestamp,
      stake: pred.stake,
      status: pred.status as PredictionStatus,
    }));
  },

  // Mark prediction outcome (admin only)
  markOutcome: async (
    signer: ethers.Signer,
    predictionId: number,
    outcome: PredictionStatus
  ): Promise<ethers.ContractTransactionResponse> => {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    return await contract.markOutcome(predictionId, outcome);
  },

  // Distribute reward (admin only)
  distributeReward: async (
    signer: ethers.Signer,
    predictionId: number
  ): Promise<ethers.ContractTransactionResponse> => {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    return await contract.distributeReward(predictionId);
  },

  // Get contract owner
  getOwner: async (provider: ethers.Provider): Promise<Address> => {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );
    return await contract.owner();
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
