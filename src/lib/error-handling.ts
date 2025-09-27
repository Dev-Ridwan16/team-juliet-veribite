import { ethers } from "ethers";

// Error types for better error handling
export enum Web3ErrorType {
  CIRCUIT_BREAKER = "CIRCUIT_BREAKER",
  NETWORK_ERROR = "NETWORK_ERROR",
  USER_REJECTED = "USER_REJECTED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface Web3Error {
  type: Web3ErrorType;
  message: string;
  originalError: any;
  retryable: boolean;
}

// Circuit breaker detection patterns
const CIRCUIT_BREAKER_PATTERNS = [
  "circuit breaker is open",
  "execution prevented because the circuit breaker is open",
  "isBrokenCircuitError",
];

const NETWORK_ERROR_PATTERNS = [
  "network error",
  "connection timeout",
  "network request failed",
  "fetch is not defined",
  "could not detect network",
];

const USER_REJECTION_PATTERNS = [
  "user rejected",
  "user denied",
  "user cancelled",
  "action_rejected",
];

const INSUFFICIENT_FUNDS_PATTERNS = [
  "insufficient funds",
  "insufficient balance",
  "not enough ether",
];

// Parse and categorize errors
export function parseWeb3Error(error: any): Web3Error {
  const errorMessage =
    error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || "";
  const errorCode = error?.code;
  const errorData = error?.data;

  // Circuit breaker error
  if (
    CIRCUIT_BREAKER_PATTERNS.some((pattern) => errorMessage.includes(pattern))
  ) {
    return {
      type: Web3ErrorType.CIRCUIT_BREAKER,
      message:
        "MetaMask circuit breaker is active. Please wait a moment and try again.",
      originalError: error,
      retryable: true,
    };
  }

  // Network errors
  if (
    NETWORK_ERROR_PATTERNS.some((pattern) => errorMessage.includes(pattern)) ||
    errorCode === "NETWORK_ERROR" ||
    errorCode === -32603
  ) {
    return {
      type: Web3ErrorType.NETWORK_ERROR,
      message:
        "Network connection issue. Please check your internet connection and try again.",
      originalError: error,
      retryable: true,
    };
  }

  // User rejection
  if (
    USER_REJECTION_PATTERNS.some((pattern) => errorMessage.includes(pattern)) ||
    errorCode === 4001 ||
    errorCode === "ACTION_REJECTED"
  ) {
    return {
      type: Web3ErrorType.USER_REJECTED,
      message: "Transaction was cancelled by user.",
      originalError: error,
      retryable: false,
    };
  }

  // Insufficient funds
  if (
    INSUFFICIENT_FUNDS_PATTERNS.some((pattern) =>
      errorMessage.includes(pattern)
    ) ||
    errorCode === "INSUFFICIENT_FUNDS"
  ) {
    return {
      type: Web3ErrorType.INSUFFICIENT_FUNDS,
      message:
        "Insufficient funds to complete transaction. Please check your balance.",
      originalError: error,
      retryable: false,
    };
  }

  // Contract execution errors
  if (
    errorData ||
    errorMessage.includes("revert") ||
    errorMessage.includes("execution reverted")
  ) {
    return {
      type: Web3ErrorType.CONTRACT_ERROR,
      message:
        errorData?.message ||
        error?.reason ||
        "Smart contract execution failed.",
      originalError: error,
      retryable: false,
    };
  }

  // Timeout errors
  if (errorMessage.includes("timeout") || errorCode === "TIMEOUT") {
    return {
      type: Web3ErrorType.TIMEOUT_ERROR,
      message: "Request timeout. Please try again.",
      originalError: error,
      retryable: true,
    };
  }

  // Unknown error
  return {
    type: Web3ErrorType.UNKNOWN_ERROR,
    message:
      error?.message || error?.toString() || "An unknown error occurred.",
    originalError: error,
    retryable: true,
  };
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Exponential backoff delay calculation
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper for Web3 operations
export async function retryWeb3Operation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: Web3Error) => void
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Web3Error | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseWeb3Error(error);

      // Don't retry if error is not retryable or if this is the last attempt
      if (!lastError.retryable || attempt === retryConfig.maxAttempts) {
        throw lastError;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error("Maximum retry attempts reached");
}

// Specialized retry function for circuit breaker errors
export async function retryWithCircuitBreakerHandling<T>(
  operation: () => Promise<T>,
  onCircuitBreakerDetected?: () => void
): Promise<T> {
  return retryWeb3Operation(
    operation,
    {
      maxAttempts: 5, // More attempts for circuit breaker
      baseDelay: 2000, // Longer initial delay
      maxDelay: 30000, // Up to 30 seconds
      backoffMultiplier: 1.5, // Gentler backoff
    },
    (attempt, error) => {
      if (
        error.type === Web3ErrorType.CIRCUIT_BREAKER &&
        onCircuitBreakerDetected
      ) {
        onCircuitBreakerDetected();
      }
      console.warn(`Retry attempt ${attempt} after error:`, error.message);
    }
  );
}

// User-friendly error messages for UI
export function getUserFriendlyErrorMessage(error: Web3Error): string {
  switch (error.type) {
    case Web3ErrorType.CIRCUIT_BREAKER:
      return "MetaMask is temporarily overloaded. Please wait 30 seconds and try again.";
    case Web3ErrorType.NETWORK_ERROR:
      return "Connection issue detected. Please check your internet and try again.";
    case Web3ErrorType.USER_REJECTED:
      return "Transaction was cancelled. You can try again when ready.";
    case Web3ErrorType.INSUFFICIENT_FUNDS:
      return "Not enough ETH in your wallet. Please add funds and try again.";
    case Web3ErrorType.CONTRACT_ERROR:
      return `Smart contract error: ${error.message}`;
    case Web3ErrorType.TIMEOUT_ERROR:
      return "Request timed out. The network might be busy, please try again.";
    default:
      return "Something went wrong. Please try again or contact support if the issue persists.";
  }
}

// Error logging utility
export function logWeb3Error(error: Web3Error, context?: string): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || "Unknown",
    errorType: error.type,
    message: error.message,
    retryable: error.retryable,
    originalError: error.originalError,
  };

  console.error("Web3 Error:", logData);

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
}
