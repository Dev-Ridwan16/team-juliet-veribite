"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { contractFunctions } from "@/lib/contract";

export default function PredictionForm() {
  const [predictionText, setPredictionText] = useState("");
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !walletClient) {
      setError("Please connect your wallet first");
      return;
    }

    if (!predictionText.trim()) {
      setError("Please enter a prediction");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTransactionHash(null);

    try {
      // Convert viem wallet client to ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await contractFunctions.submitPrediction(
        signer,
        predictionText.trim(),
        stakeAmount
      );

      setTransactionHash(tx.hash);

      // Reset form
      setPredictionText("");
      setStakeAmount("0.01");

      // Wait for confirmation
      await tx.wait();
    } catch (err: any) {
      console.error("Error submitting prediction:", err);
      setError(err.message || "Failed to submit prediction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Make a Prediction
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
            <svg
              className="w-8 h-8 text-white"
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
          <p className="text-gray-600 mb-4">
            Connect your wallet to make predictions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Make a Prediction
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prediction Text */}
        <div>
          <label
            htmlFor="prediction"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Prediction
          </label>
          <textarea
            id="prediction"
            rows={4}
            value={predictionText}
            onChange={(e) => setPredictionText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Enter your food consumption prediction..."
            disabled={isSubmitting}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {predictionText.length}/500 characters
          </div>
        </div>

        {/* Stake Amount */}
        <div>
          <label
            htmlFor="stake"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Stake Amount (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              id="stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.01"
              step="0.001"
              min="0.001"
              disabled={isSubmitting}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              ETH
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Minimum stake: 0.001 ETH
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-green-400 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <div className="text-sm text-green-800 font-medium">
                  Prediction submitted successfully!
                </div>
                <div className="text-xs text-green-600 mt-1 break-all">
                  Transaction: {transactionHash}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !predictionText.trim()}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Submitting Prediction...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Submit Prediction
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-primary-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary-800 mb-2">
          How it works:
        </h3>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• Make a prediction about food consumption</li>
          <li>• Stake ETH to show confidence in your prediction</li>
          <li>• Earn rewards if your prediction is marked correct</li>
          <li>• All predictions are verified by the community</li>
        </ul>
      </div>
    </div>
  );
}
