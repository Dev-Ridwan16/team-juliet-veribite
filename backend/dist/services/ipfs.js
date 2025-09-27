"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3StorageProvider = exports.PinataProvider = exports.IPFSService = void 0;
exports.createIPFSService = createIPFSService;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const logger_1 = __importDefault(require("../utils/logger"));
class PinataProvider {
    constructor(apiKey, secretKey) {
        this.name = "pinata";
        this.baseURL = "https://api.pinata.cloud";
        if (!apiKey || !secretKey) {
            throw new Error("Pinata API key and secret are required");
        }
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }
    async pin(data) {
        try {
            logger_1.default.info("Pinning data to IPFS via Pinata");
            const response = await axios_1.default.post(`${this.baseURL}/pinning/pinJSONToIPFS`, {
                pinataContent: data,
                pinataMetadata: {
                    name: `veribite-prediction-${Date.now()}`,
                    keyvalues: {
                        service: "veribite",
                        type: "food-prediction",
                        timestamp: new Date().toISOString(),
                    },
                },
                pinataOptions: {
                    cidVersion: 1,
                },
            }, {
                headers: {
                    "Content-Type": "application/json",
                    pinata_api_key: this.apiKey,
                    pinata_secret_api_key: this.secretKey,
                },
                timeout: 30000,
            });
            if (!response.data || !response.data.IpfsHash) {
                throw new Error("Invalid response from Pinata");
            }
            const cid = response.data.IpfsHash;
            const dataString = JSON.stringify(data);
            const hash = (0, crypto_1.createHash)("sha256").update(dataString).digest("hex");
            logger_1.default.info(`Successfully pinned to IPFS: ${cid}`);
            return {
                cid,
                hash: `0x${hash}`,
                size: response.data.PinSize || dataString.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.default.error("Failed to pin to Pinata:", error);
            throw new Error(`Pinata pinning failed: ${error.message}`);
        }
    }
    async unpin(cid) {
        try {
            await axios_1.default.delete(`${this.baseURL}/pinning/unpin/${cid}`, {
                headers: {
                    pinata_api_key: this.apiKey,
                    pinata_secret_api_key: this.secretKey,
                },
            });
            logger_1.default.info(`Successfully unpinned from Pinata: ${cid}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to unpin from Pinata: ${cid}`, error);
            return false;
        }
    }
}
exports.PinataProvider = PinataProvider;
class Web3StorageProvider {
    constructor(token) {
        this.name = "web3storage";
        this.baseURL = "https://api.web3.storage";
        if (!token) {
            throw new Error("Web3.Storage token is required");
        }
        this.token = token;
    }
    async pin(data) {
        try {
            logger_1.default.info("Pinning data to IPFS via Web3.Storage");
            const dataString = JSON.stringify(data);
            const blob = new Blob([dataString], { type: "application/json" });
            const formData = new FormData();
            formData.append("file", blob, `veribite-prediction-${Date.now()}.json`);
            const response = await axios_1.default.post(`${this.baseURL}/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "multipart/form-data",
                },
                timeout: 30000,
            });
            if (!response.data || !response.data.cid) {
                throw new Error("Invalid response from Web3.Storage");
            }
            const cid = response.data.cid;
            const hash = (0, crypto_1.createHash)("sha256").update(dataString).digest("hex");
            logger_1.default.info(`Successfully pinned to IPFS: ${cid}`);
            return {
                cid,
                hash: `0x${hash}`,
                size: dataString.length,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.default.error("Failed to pin to Web3.Storage:", error);
            throw new Error(`Web3.Storage pinning failed: ${error.message}`);
        }
    }
    async unpin(cid) {
        try {
            logger_1.default.info(`Web3.Storage doesn't support direct unpinning: ${cid}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Web3.Storage unpin operation failed: ${cid}`, error);
            return false;
        }
    }
}
exports.Web3StorageProvider = Web3StorageProvider;
class IPFSService {
    constructor(provider) {
        this.maxRetries = 2;
        this.retryDelay = 1000;
        this.provider = provider;
    }
    async pinJSON(data) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
            try {
                logger_1.default.info(`IPFS pin attempt ${attempt}/${this.maxRetries + 1} using ${this.provider.name}`);
                this.validatePredictionData(data);
                const result = await this.provider.pin(data);
                if (!result.cid || !result.hash) {
                    throw new Error("Invalid pin result: missing CID or hash");
                }
                logger_1.default.info(`Successfully pinned data on attempt ${attempt}: ${result.cid}`);
                return result;
            }
            catch (error) {
                lastError = error;
                logger_1.default.warn(`IPFS pin attempt ${attempt} failed:`, error.message);
                if (attempt <= this.maxRetries) {
                    logger_1.default.info(`Retrying in ${this.retryDelay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
                    this.retryDelay *= 2;
                }
            }
        }
        logger_1.default.error(`All IPFS pin attempts failed. Last error:`, lastError);
        const errorMessage = lastError?.message || "Unknown error";
        throw new Error(`Failed to pin to IPFS after ${this.maxRetries + 1} attempts: ${errorMessage}`);
    }
    async unpinContent(cid) {
        try {
            if (this.provider.unpin) {
                return await this.provider.unpin(cid);
            }
            logger_1.default.info(`Provider ${this.provider.name} does not support unpinning`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to unpin content: ${cid}`, error);
            return false;
        }
    }
    validatePredictionData(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Data must be a valid object");
        }
        const requiredFields = ["title", "description", "category"];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        const validCategories = [
            "Ingredient",
            "Dish",
            "Diet",
            "Restaurant",
            "Consumption",
            "FoodPolicy",
            "Other",
        ];
        if (!validCategories.includes(data.category)) {
            throw new Error(`Invalid category: ${data.category}. Must be one of: ${validCategories.join(", ")}`);
        }
        const dataString = JSON.stringify(data);
        if (dataString.length > 1024 * 1024) {
            throw new Error("Prediction data too large (max 1MB)");
        }
    }
    static computeDataHash(data) {
        const dataString = JSON.stringify(data);
        const hash = (0, crypto_1.createHash)("sha256").update(dataString).digest("hex");
        return `0x${hash}`;
    }
    getProviderName() {
        return this.provider.name;
    }
}
exports.IPFSService = IPFSService;
function createIPFSService() {
    const provider = process.env.IPFS_PROVIDER?.toLowerCase() || "pinata";
    let ipfsProvider;
    switch (provider) {
        case "pinata":
            const pinataApiKey = process.env.PINATA_API_KEY;
            const pinataSecret = process.env.PINATA_API_SECRET;
            if (!pinataApiKey || !pinataSecret) {
                throw new Error("Pinata API key and secret must be configured");
            }
            ipfsProvider = new PinataProvider(pinataApiKey, pinataSecret);
            break;
        case "web3storage":
            const web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
            if (!web3StorageToken) {
                throw new Error("Web3.Storage token must be configured");
            }
            ipfsProvider = new Web3StorageProvider(web3StorageToken);
            break;
        default:
            throw new Error(`Unsupported IPFS provider: ${provider}. Supported: pinata, web3storage`);
    }
    logger_1.default.info(`Initialized IPFS service with provider: ${provider}`);
    return new IPFSService(ipfsProvider);
}
//# sourceMappingURL=ipfs.js.map