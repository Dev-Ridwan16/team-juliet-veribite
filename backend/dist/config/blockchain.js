"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockchainConfig = exports.getCurrentGasPrice = exports.verifyTransaction = exports.getContractAddress = exports.getWallet = exports.getProvider = exports.initializeBlockchain = void 0;
const ethers_1 = require("ethers");
const logger_1 = __importDefault(require("../utils/logger"));
const config = {
    provider: new ethers_1.ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545')
};
const initializeBlockchain = async () => {
    try {
        const network = await config.provider.getNetwork();
        logger_1.default.info(`Connected to blockchain network: ${network.name} (chainId: ${network.chainId})`);
        if (process.env.PRIVATE_KEY) {
            config.wallet = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY, config.provider);
            logger_1.default.info(`Wallet initialized: ${config.wallet.address}`);
        }
        if (process.env.CONTRACT_ADDRESS) {
            config.contractAddress = process.env.CONTRACT_ADDRESS;
            logger_1.default.info(`Contract address configured: ${config.contractAddress}`);
        }
    }
    catch (error) {
        logger_1.default.error('Failed to initialize blockchain connection:', error);
        throw error;
    }
};
exports.initializeBlockchain = initializeBlockchain;
const getProvider = () => {
    return config.provider;
};
exports.getProvider = getProvider;
const getWallet = () => {
    if (!config.wallet) {
        throw new Error('Wallet not initialized. Make sure PRIVATE_KEY is set in environment.');
    }
    return config.wallet;
};
exports.getWallet = getWallet;
const getContractAddress = () => {
    if (!config.contractAddress) {
        throw new Error('Contract address not set. Make sure CONTRACT_ADDRESS is set in environment.');
    }
    return config.contractAddress;
};
exports.getContractAddress = getContractAddress;
const verifyTransaction = async (txHash) => {
    try {
        const receipt = await config.provider.getTransactionReceipt(txHash);
        return receipt;
    }
    catch (error) {
        logger_1.default.error(`Error verifying transaction ${txHash}:`, error);
        throw error;
    }
};
exports.verifyTransaction = verifyTransaction;
const getCurrentGasPrice = async () => {
    try {
        return await config.provider.getFeeData().then(feeData => feeData.gasPrice || BigInt(0));
    }
    catch (error) {
        logger_1.default.error('Error getting gas price:', error);
        throw error;
    }
};
exports.getCurrentGasPrice = getCurrentGasPrice;
const getBlockchainConfig = () => {
    return Object.freeze({ ...config });
};
exports.getBlockchainConfig = getBlockchainConfig;
//# sourceMappingURL=blockchain.js.map