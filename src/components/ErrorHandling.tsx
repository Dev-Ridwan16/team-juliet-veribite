"use client";

import React from "react";
import { Web3ErrorType } from "../lib/error-handling";
import { useWeb3ErrorHandling } from "../hooks/useWeb3ErrorHandling";

interface ErrorAlertProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  const { handleWeb3Operation } = useWeb3ErrorHandling();

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case Web3ErrorType.CIRCUIT_BREAKER:
        return "⚠️";
      case Web3ErrorType.NETWORK_ERROR:
        return "🌐";
      case Web3ErrorType.USER_REJECTED:
        return "👤";
      case Web3ErrorType.INSUFFICIENT_FUNDS:
        return "💰";
      case Web3ErrorType.CONTRACT_ERROR:
        return "⚡";
      case Web3ErrorType.TIMEOUT_ERROR:
        return "⏱️";
      default:
        return "❌";
    }
  };

  const getErrorStyles = () => {
    switch (error.type) {
      case Web3ErrorType.CIRCUIT_BREAKER:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case Web3ErrorType.NETWORK_ERROR:
        return "bg-blue-50 border-blue-200 text-blue-800";
      case Web3ErrorType.USER_REJECTED:
        return "bg-gray-50 border-gray-200 text-gray-800";
      case Web3ErrorType.INSUFFICIENT_FUNDS:
        return "bg-orange-50 border-orange-200 text-orange-800";
      case Web3ErrorType.CONTRACT_ERROR:
        return "bg-red-50 border-red-200 text-red-800";
      case Web3ErrorType.TIMEOUT_ERROR:
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-red-50 border-red-200 text-red-800";
    }
  };

  const getRetryButtonText = () => {
    switch (error.type) {
      case Web3ErrorType.CIRCUIT_BREAKER:
        return "Try Again";
      case Web3ErrorType.NETWORK_ERROR:
        return "Retry Connection";
      case Web3ErrorType.TIMEOUT_ERROR:
        return "Retry Request";
      default:
        return "Retry";
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getErrorStyles()} ${className}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{getErrorIcon()}</span>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium mb-1">
                {error.type === Web3ErrorType.CIRCUIT_BREAKER &&
                  "MetaMask Circuit Breaker Active"}
                {error.type === Web3ErrorType.NETWORK_ERROR &&
                  "Network Connection Issue"}
                {error.type === Web3ErrorType.USER_REJECTED &&
                  "Transaction Cancelled"}
                {error.type === Web3ErrorType.INSUFFICIENT_FUNDS &&
                  "Insufficient Funds"}
                {error.type === Web3ErrorType.CONTRACT_ERROR &&
                  "Smart Contract Error"}
                {error.type === Web3ErrorType.TIMEOUT_ERROR &&
                  "Request Timeout"}
                {error.type === Web3ErrorType.UNKNOWN_ERROR &&
                  "Unexpected Error"}
              </p>
              <p className="text-sm opacity-90">{error.message}</p>
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-4 text-lg hover:opacity-70 transition-opacity"
                aria-label="Dismiss error"
              >
                ×
              </button>
            )}
          </div>

          {error.retryable && onRetry && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm font-medium hover:bg-opacity-30 transition-all"
              >
                {getRetryButtonText()}
              </button>
            </div>
          )}

          {error.type === Web3ErrorType.CIRCUIT_BREAKER && (
            <div className="mt-2 text-xs opacity-75">
              <p>
                💡 Tip: Wait 30-60 seconds before retrying. The circuit breaker
                protects against network overload.
              </p>
            </div>
          )}

          {error.type === Web3ErrorType.INSUFFICIENT_FUNDS && (
            <div className="mt-2 text-xs opacity-75">
              <p>
                💡 Tip: Make sure you have enough ETH for both the transaction
                and gas fees.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  isCircuitBreakerRetry?: boolean;
}

export function LoadingOverlay({
  isLoading,
  message = "Processing...",
  isCircuitBreakerRetry = false,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <p className="font-medium text-gray-900">{message}</p>
            {isCircuitBreakerRetry && (
              <p className="text-sm text-gray-500 mt-1">
                Waiting for MetaMask circuit breaker to reset...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Success message component
interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessAlert({
  message,
  onDismiss,
  className = "",
}: SuccessAlertProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 bg-green-50 border-green-200 text-green-800 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-xl">✅</span>
          <p className="font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-lg hover:opacity-70 transition-opacity"
            aria-label="Dismiss success message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
