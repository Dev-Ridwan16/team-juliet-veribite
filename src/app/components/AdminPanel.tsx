"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import {
  contractFunctions,
  Prediction,
  PredictionStatus,
  formatAddress,
  formatEther,
  formatTimestamp,
  getStatusText,
} from "@/lib/contract";

export default function AdminPanel() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const checkOwnerAndFetchPredictions = async () => {
      if (!publicClient || !address) return;

      try {
        setIsLoading(true);
        setError(null);

        // Convert viem public client to ethers provider
        const provider = new ethers.JsonRpcProvider(publicClient.transport.url);

        // Check if current user is owner
        const owner = await contractFunctions.getOwner(provider);
        setIsOwner(owner.toLowerCase() === address.toLowerCase());

        // Fetch predictions
        const predictions = await contractFunctions.getAllPredictions(provider);

        console.log("Debug: Raw predictions from contract:", predictions);

        // Sort by timestamp (newest first)
        const sortedPredictions = predictions.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp)
        );

        console.log("Debug: Sorted predictions:", sortedPredictions);

        setPredictions(sortedPredictions);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnerAndFetchPredictions();
  }, [publicClient, address]);

  const handleMarkOutcome = async (
    predictionId: bigint,
    outcome: PredictionStatus
  ) => {
    if (!walletClient) {
      setError("Please connect your wallet");
      return;
    }

    const idString = predictionId.toString();
    setProcessingIds((prev) => new Set(prev).add(idString));
    setError(null);

    try {
      // Convert viem wallet client to ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await contractFunctions.markOutcome(
        signer,
        Number(predictionId),
        outcome
      );
      await tx.wait();

      // Refresh predictions
      const ethersProvider = new ethers.JsonRpcProvider(
        publicClient!.transport.url
      );
      const updatedPredictions = await contractFunctions.getAllPredictions(
        ethersProvider
      );
      const sortedPredictions = updatedPredictions.sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp)
      );
      setPredictions(sortedPredictions);
    } catch (err: any) {
      console.error("Error marking outcome:", err);
      setError(`Failed to mark outcome: ${err.message}`);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(idString);
        return newSet;
      });
    }
  };

  const handleDistributeReward = async (predictionId: bigint) => {
    if (!walletClient) {
      setError("Please connect your wallet");
      return;
    }

    const idString = predictionId.toString();
    setProcessingIds((prev) => new Set(prev).add(`reward-${idString}`));
    setError(null);

    try {
      // Convert viem wallet client to ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await contractFunctions.distributeReward(
        signer,
        Number(predictionId)
      );
      await tx.wait();

      // Refresh predictions
      const ethersProvider = new ethers.JsonRpcProvider(
        publicClient!.transport.url
      );
      const updatedPredictions = await contractFunctions.getAllPredictions(
        ethersProvider
      );
      const sortedPredictions = updatedPredictions.sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp)
      );
      setPredictions(sortedPredictions);
    } catch (err: any) {
      console.error("Error distributing reward:", err);
      setError(`Failed to distribute reward: ${err.message}`);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`reward-${idString}`);
        return newSet;
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h2>
          <p className="text-gray-600 mb-4">
            Connect your wallet to access admin functions
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have admin privileges for this contract
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">
          Manage predictions and distribute rewards
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-800 w-500 overflow-hidden">{error.split(":")[0] + ":" + error.split(":")[1]}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No predictions to manage
            </h3>
            <p className="text-gray-600">
              Predictions will appear here once users submit them
            </p>
          </div>
        ) : (
          predictions.map((prediction) => (
            <AdminPredictionCard
              key={prediction.id.toString()}
              prediction={prediction}
              onMarkOutcome={handleMarkOutcome}
              onDistributeReward={handleDistributeReward}
              isProcessing={processingIds.has(prediction.id.toString())}
              isRewardProcessing={processingIds.has(
                `reward-${prediction.id.toString()}`
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AdminPredictionCard({
  prediction,
  onMarkOutcome,
  onDistributeReward,
  isProcessing,
  isRewardProcessing,
}: {
  prediction: Prediction;
  onMarkOutcome: (id: bigint, outcome: PredictionStatus) => void;
  onDistributeReward: (id: bigint) => void;
  isProcessing: boolean;
  isRewardProcessing: boolean;
}) {
  // Convert status to enum if it comes as a number
  const predictionStatus =
    typeof prediction.status === "number"
      ? (prediction.status as PredictionStatus)
      : prediction.status;

  const canDistributeReward = predictionStatus === PredictionStatus.CORRECT;

  console.log(
    "Debug: Prediction status:",
    prediction.status,
    "Type:",
    typeof prediction.status
  );
  console.log("Debug: PredictionStatus.PENDING:", PredictionStatus.PENDING);
  console.log("Debug: canDistributeReward:", canDistributeReward);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="font-medium text-gray-900">
              {formatAddress(prediction.predictor)}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                predictionStatus === PredictionStatus.PENDING
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : predictionStatus === PredictionStatus.CORRECT
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {getStatusText(predictionStatus)}
            </span>
          </div>
          <p className="text-gray-800 mb-2">{prediction.predictionText}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Stake: {formatEther(prediction.stake)} ETH</span>
            <span>ID: {prediction.id.toString()}</span>
            <span>{formatTimestamp(prediction.timestamp)}</span>
          </div>
        </div>
      </div>

      {predictionStatus === PredictionStatus.PENDING && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Mark Outcome:
          </h4>
          <div className="flex space-x-3">
            <button
              onClick={() =>
                onMarkOutcome(prediction.id, PredictionStatus.CORRECT)
              }
              disabled={isProcessing}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Mark Correct
                </>
              )}
            </button>
            <button
              onClick={() =>
                onMarkOutcome(prediction.id, PredictionStatus.INCORRECT)
              }
              disabled={isProcessing}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Mark Incorrect
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {canDistributeReward && (
        <div className="border-t pt-4 mt-4">
          <button
            onClick={() => onDistributeReward(prediction.id)}
            disabled={isRewardProcessing}
            className="w-full bg-neutral-700 cursor-pointer hover:bg-primary-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isRewardProcessing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4  text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Distributing Reward...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Distribute Reward
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
