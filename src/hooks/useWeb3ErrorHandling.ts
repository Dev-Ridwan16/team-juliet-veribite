import { useState, useCallback } from "react";
import {
  parseWeb3Error,
  getUserFriendlyErrorMessage,
  logWeb3Error,
  Web3Error,
  Web3ErrorType,
} from "../lib/error-handling";

interface UseWeb3ErrorHandlingReturn {
  error: Web3Error | null;
  isLoading: boolean;
  clearError: () => void;
  handleWeb3Operation: <T>(
    operation: () => Promise<T>,
    context?: string
  ) => Promise<T | null>;
  getUserFriendlyMessage: () => string;
  isCircuitBreakerError: () => boolean;
  isRetryableError: () => boolean;
}

export function useWeb3ErrorHandling(): UseWeb3ErrorHandlingReturn {
  const [error, setError] = useState<Web3Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleWeb3Operation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await operation();
        return result;
      } catch (err: any) {
        const web3Error = parseWeb3Error(err);
        setError(web3Error);
        logWeb3Error(web3Error, context);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getUserFriendlyMessage = useCallback(() => {
    return error ? getUserFriendlyErrorMessage(error) : "";
  }, [error]);

  const isCircuitBreakerError = useCallback(() => {
    return error?.type === Web3ErrorType.CIRCUIT_BREAKER;
  }, [error]);

  const isRetryableError = useCallback(() => {
    return error?.retryable === true;
  }, [error]);

  return {
    error,
    isLoading,
    clearError,
    handleWeb3Operation,
    getUserFriendlyMessage,
    isCircuitBreakerError,
    isRetryableError,
  };
}

// Toast notification hook for errors
export function useWeb3ErrorToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"error" | "warning" | "info">(
    "error"
  );

  const showErrorToast = useCallback((error: Web3Error) => {
    const message = getUserFriendlyErrorMessage(error);

    if (error.type === Web3ErrorType.CIRCUIT_BREAKER) {
      setToastType("warning");
    } else if (error.retryable) {
      setToastType("info");
    } else {
      setToastType("error");
    }

    setToastMessage(message);

    // Auto hide after 5 seconds for retryable errors, 8 seconds for others
    const timeout = error.retryable ? 5000 : 8000;
    setTimeout(() => setToastMessage(null), timeout);
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    toastMessage,
    toastType,
    showErrorToast,
    hideToast,
  };
}
