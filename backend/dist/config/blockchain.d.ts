import { ethers } from 'ethers';
interface BlockchainConfig {
    provider: ethers.JsonRpcProvider;
    wallet?: ethers.Wallet;
    contractAddress?: string;
}
export declare const initializeBlockchain: () => Promise<void>;
export declare const getProvider: () => ethers.JsonRpcProvider;
export declare const getWallet: () => ethers.Wallet;
export declare const getContractAddress: () => string;
export declare const verifyTransaction: (txHash: string) => Promise<ethers.TransactionReceipt | null>;
export declare const getCurrentGasPrice: () => Promise<bigint>;
export declare const getBlockchainConfig: () => Readonly<BlockchainConfig>;
export {};
//# sourceMappingURL=blockchain.d.ts.map