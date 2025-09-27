import { ethers } from 'ethers';
import logger from '../utils/logger';

interface BlockchainConfig {
  provider: ethers.JsonRpcProvider;
  wallet?: ethers.Wallet;
  contractAddress?: string;
}

const config: BlockchainConfig = {
  provider: new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545')
};

// Initialize blockchain connection
export const initializeBlockchain = async (): Promise<void> => {
  try {
    // Test provider connection
    const network = await config.provider.getNetwork();
    logger.info(`Connected to blockchain network: ${network.name} (chainId: ${network.chainId})`);

    // Initialize wallet if private key is provided
    if (process.env.PRIVATE_KEY) {
      config.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, config.provider);
      logger.info(`Wallet initialized: ${config.wallet.address}`);
    }

    // Set contract address if provided
    if (process.env.CONTRACT_ADDRESS) {
      config.contractAddress = process.env.CONTRACT_ADDRESS;
      logger.info(`Contract address configured: ${config.contractAddress}`);
    }

  } catch (error: any) {
    logger.error('Failed to initialize blockchain connection:', error);
    throw error;
  }
};

// Get provider instance
export const getProvider = (): ethers.JsonRpcProvider => {
  return config.provider;
};

// Get wallet instance
export const getWallet = (): ethers.Wallet => {
  if (!config.wallet) {
    throw new Error('Wallet not initialized. Make sure PRIVATE_KEY is set in environment.');
  }
  return config.wallet;
};

// Get contract address
export const getContractAddress = (): string => {
  if (!config.contractAddress) {
    throw new Error('Contract address not set. Make sure CONTRACT_ADDRESS is set in environment.');
  }
  return config.contractAddress;
};

// Verify transaction receipt
export const verifyTransaction = async (txHash: string): Promise<ethers.TransactionReceipt | null> => {
  try {
    const receipt = await config.provider.getTransactionReceipt(txHash);
    return receipt;
  } catch (error: any) {
    logger.error(`Error verifying transaction ${txHash}:`, error);
    throw error;
  }
};

// Get current gas price
export const getCurrentGasPrice = async (): Promise<bigint> => {
  try {
    return await config.provider.getFeeData().then(feeData => feeData.gasPrice || BigInt(0));
  } catch (error: any) {
    logger.error('Error getting gas price:', error);
    throw error;
  }
};

// Export configuration for external access
export const getBlockchainConfig = (): Readonly<BlockchainConfig> => {
  return Object.freeze({ ...config });
};