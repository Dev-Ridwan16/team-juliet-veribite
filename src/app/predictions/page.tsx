"use client";

import PredictionForm from "../components/PredictionForm";
import PredictionsFeed from "../components/PredictionsFeed";

export default function PredictionsPage() {
  return (
    <div className="min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-float shadow-lg">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Community Predictions
          </h1>
          <p className="text-xl text-gray-600">
            Make predictions, stake ETH, and earn rewards
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Prediction Form */}
          <PredictionForm />

          {/* Predictions Feed */}
          <PredictionsFeed />
        </div>
      </div>
    </div>
  );
}
