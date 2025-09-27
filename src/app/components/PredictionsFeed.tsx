"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { ethers } from "ethers";
import {
  contractFunctions,
  Prediction,
  formatAddress,
  formatEther,
  formatTimestamp,
  getStatusText,
  getStatusColor,
} from "@/lib/contract";

export default function PredictionsFeed() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!publicClient) return;

      try {
        setIsLoading(true);
        setError(null);

        // Convert viem public client to ethers provider
        const provider = new ethers.JsonRpcProvider(publicClient.transport.url);
        const predictions = await contractFunctions.getAllPredictions(provider);

        // Sort by timestamp (newest first)
        const sortedPredictions = predictions.sort(
          (a, b) => Number(b.timestamp) - Number(a.timestamp)
        );

        setPredictions(sortedPredictions);
      } catch (err: any) {
        console.error("Error fetching predictions:", err);
        setError("Failed to load predictions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, [publicClient]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Community Predictions
          </h2>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-xl shadow-lg p-6 animate-pulse"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex space-x-4">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Community Predictions
        </h2>
        <div className="text-sm text-gray-500">
          {predictions.length} prediction{predictions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-12">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No predictions yet
          </h3>
          <p className="text-gray-600">Be the first to make a prediction!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <PredictionCard
              key={`${prediction.id}-${index}`}
              prediction={prediction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  return (
    <div className="glass rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-100/50">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-medium text-sm">
            {prediction.predictor.slice(2, 4).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900">
                {formatAddress(prediction.predictor)}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  prediction.status
                )}`}
              >
                {getStatusText(prediction.status)}
              </span>
            </div>
            <time className="text-xs text-gray-500">
              {formatTimestamp(prediction.timestamp)}
            </time>
          </div>

          {/* Prediction Text */}
          <p className="text-gray-800 mb-4 leading-relaxed">
            {prediction.predictionText}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-500">
              <div className="flex items-center space-x-1">
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
                <span>{formatEther(prediction.stake)} ETH</span>
              </div>
              <div className="flex items-center space-x-1">
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span>ID: {prediction.id.toString()}</span>
              </div>
            </div>

            {/* Action buttons could go here for admin functionality */}
          </div>
        </div>
      </div>
    </div>
  );
}
