# Web3 Error Handling System

## Overview

This system provides robust error handling for Web3 operations, specifically designed to handle common issues like MetaMask circuit breaker errors, network problems, and user rejections.

## Key Features

### 1. **Automatic Circuit Breaker Detection & Handling**

- Automatically detects MetaMask circuit breaker errors
- Implements exponential backoff retry strategy
- User-friendly messages explaining the situation

### 2. **Comprehensive Error Classification**

- `CIRCUIT_BREAKER`: MetaMask circuit breaker active
- `NETWORK_ERROR`: Connection/network issues
- `USER_REJECTED`: User cancelled transaction
- `INSUFFICIENT_FUNDS`: Not enough ETH for transaction
- `CONTRACT_ERROR`: Smart contract execution failed
- `TIMEOUT_ERROR`: Request timeout
- `UNKNOWN_ERROR`: Fallback for other errors

### 3. **Smart Retry Logic**

- Different retry strategies for different error types
- Circuit breaker errors get special handling (5 retries, longer delays)
- Non-retryable errors (like user rejection) don't trigger retries

## Usage

### In Contract Functions

All contract interaction functions now automatically use error handling:

```typescript
// Example: Submitting a prediction
const result = await submitPrediction(text, stake, signer);
// Automatically handles circuit breaker, network errors, etc.
```

### In React Components

Use the `useWeb3ErrorHandling` hook:

```typescript
import { useWeb3ErrorHandling } from "@/hooks/useWeb3ErrorHandling";

function MyComponent() {
  const {
    error,
    isLoading,
    clearError,
    handleWeb3Operation,
    isCircuitBreakerError,
  } = useWeb3ErrorHandling();

  const handleTransaction = async () => {
    const result = await handleWeb3Operation(async () => {
      return await someWeb3Operation();
    }, "Transaction Context");

    if (result) {
      // Success handling
    }
  };
}
```

### Error Display Components

Use the pre-built error components:

```tsx
import { ErrorAlert, LoadingOverlay, SuccessAlert } from "@/components/ErrorHandling";

// Display errors with automatic retry buttons
<ErrorAlert
  error={error}
  onRetry={error?.retryable ? handleRetry : undefined}
  onDismiss={clearError}
/>

// Loading overlay with circuit breaker awareness
<LoadingOverlay
  isLoading={isLoading}
  isCircuitBreakerRetry={isCircuitBreakerError()}
/>

// Success messages
<SuccessAlert message="Transaction successful!" />
```

## Circuit Breaker Specific Handling

When MetaMask's circuit breaker is active:

1. **Automatic Detection**: The system detects circuit breaker errors from error messages
2. **Specialized Retry Logic**: Uses gentler backoff (5 attempts, 2-30 second delays)
3. **User Communication**: Shows specific circuit breaker messages
4. **Visual Indicators**: Special loading states and icons

## Best Practices

1. **Always use the error handling system** for Web3 operations
2. **Provide context** when calling `handleWeb3Operation`
3. **Show appropriate UI** for loading and error states
4. **Don't retry non-retryable errors** (user rejection, insufficient funds)
5. **Log errors** for debugging and monitoring

## Configuration

You can customize retry behavior:

```typescript
await retryWeb3Operation(operation, {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
});
```

## Error Messages

The system provides user-friendly error messages:

- Circuit breaker: "MetaMask is temporarily overloaded. Please wait 30 seconds and try again."
- Network error: "Connection issue detected. Please check your internet and try again."
- User rejection: "Transaction was cancelled. You can try again when ready."
- Insufficient funds: "Not enough ETH in your wallet. Please add funds and try again."

## Production Considerations

- Error logging can be integrated with services like Sentry
- Circuit breaker detection patterns can be updated as needed
- Retry delays can be adjusted based on network conditions
- Consider implementing user notifications for persistent issues

## Testing the Circuit Breaker

To test the circuit breaker handling:

1. Make multiple rapid Web3 requests
2. Or wait for a natural circuit breaker occurrence
3. Observe the automatic retry behavior
4. Check that user sees appropriate messaging

The system will automatically handle the error and provide a better user experience than the raw error you encountered.
