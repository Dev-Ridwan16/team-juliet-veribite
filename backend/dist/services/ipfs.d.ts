export interface IPFSPinResult {
    cid: string;
    hash: string;
    size: number;
    timestamp: string;
}
export interface IPFSProvider {
    name: string;
    pin(data: object): Promise<IPFSPinResult>;
    unpin?(cid: string): Promise<boolean>;
}
declare class PinataProvider implements IPFSProvider {
    name: string;
    private apiKey;
    private secretKey;
    private baseURL;
    constructor(apiKey: string, secretKey: string);
    pin(data: object): Promise<IPFSPinResult>;
    unpin(cid: string): Promise<boolean>;
}
declare class Web3StorageProvider implements IPFSProvider {
    name: string;
    private token;
    private baseURL;
    constructor(token: string);
    pin(data: object): Promise<IPFSPinResult>;
    unpin(cid: string): Promise<boolean>;
}
export declare class IPFSService {
    private provider;
    private maxRetries;
    private retryDelay;
    constructor(provider: IPFSProvider);
    pinJSON(data: object): Promise<IPFSPinResult>;
    unpinContent(cid: string): Promise<boolean>;
    private validatePredictionData;
    static computeDataHash(data: object): string;
    getProviderName(): string;
}
export declare function createIPFSService(): IPFSService;
export { PinataProvider, Web3StorageProvider };
//# sourceMappingURL=ipfs.d.ts.map