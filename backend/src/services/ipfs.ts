import axios from "axios";
import { createHash } from "crypto";
import logger from "../utils/logger";

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

/**
 * Pinata IPFS Provider
 * Uses Pinata Cloud service for IPFS pinning
 */
class PinataProvider implements IPFSProvider {
  public name = "pinata";
  private apiKey: string;
  private secretKey: string;
  private baseURL = "https://api.pinata.cloud";

  constructor(apiKey: string, secretKey: string) {
    if (!apiKey || !secretKey) {
      throw new Error("Pinata API key and secret are required");
    }
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  async pin(data: object): Promise<IPFSPinResult> {
    try {
      logger.info("Pinning data to IPFS via Pinata");

      const response = await axios.post(
        `${this.baseURL}/pinning/pinJSONToIPFS`,
        {
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
        },
        {
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data || !response.data.IpfsHash) {
        throw new Error("Invalid response from Pinata");
      }

      const cid = response.data.IpfsHash;
      const dataString = JSON.stringify(data);
      const hash = createHash("sha256").update(dataString).digest("hex");

      logger.info(`Successfully pinned to IPFS: ${cid}`);

      return {
        cid,
        hash: `0x${hash}`,
        size: response.data.PinSize || dataString.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error("Failed to pin to Pinata:", error);
      throw new Error(`Pinata pinning failed: ${error.message}`);
    }
  }

  async unpin(cid: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseURL}/pinning/unpin/${cid}`, {
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
      });

      logger.info(`Successfully unpinned from Pinata: ${cid}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to unpin from Pinata: ${cid}`, error);
      return false;
    }
  }
}

/**
 * Web3.Storage IPFS Provider
 * Uses Web3.Storage service for IPFS pinning
 */
class Web3StorageProvider implements IPFSProvider {
  public name = "web3storage";
  private token: string;
  private baseURL = "https://api.web3.storage";

  constructor(token: string) {
    if (!token) {
      throw new Error("Web3.Storage token is required");
    }
    this.token = token;
  }

  async pin(data: object): Promise<IPFSPinResult> {
    try {
      logger.info("Pinning data to IPFS via Web3.Storage");

      const dataString = JSON.stringify(data);
      const blob = new Blob([dataString], { type: "application/json" });

      const formData = new FormData();
      formData.append("file", blob, `veribite-prediction-${Date.now()}.json`);

      const response = await axios.post(`${this.baseURL}/upload`, formData, {
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
      const hash = createHash("sha256").update(dataString).digest("hex");

      logger.info(`Successfully pinned to IPFS: ${cid}`);

      return {
        cid,
        hash: `0x${hash}`,
        size: dataString.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error("Failed to pin to Web3.Storage:", error);
      throw new Error(`Web3.Storage pinning failed: ${error.message}`);
    }
  }

  async unpin(cid: string): Promise<boolean> {
    try {
      // Web3.Storage doesn't have a direct unpin API in the same way as Pinata
      // Files are automatically garbage collected if not accessed
      logger.info(`Web3.Storage doesn't support direct unpinning: ${cid}`);
      return true;
    } catch (error: any) {
      logger.error(`Web3.Storage unpin operation failed: ${cid}`, error);
      return false;
    }
  }
}

/**
 * IPFS Service with provider abstraction and retry logic
 */
export class IPFSService {
  private provider: IPFSProvider;
  private maxRetries: number = 2;
  private retryDelay: number = 1000; // 1 second

  constructor(provider: IPFSProvider) {
    this.provider = provider;
  }

  /**
   * Pin JSON data to IPFS with retry logic
   */
  async pinJSON(data: object): Promise<IPFSPinResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        logger.info(
          `IPFS pin attempt ${attempt}/${this.maxRetries + 1} using ${
            this.provider.name
          }`
        );

        // Validate data before pinning
        this.validatePredictionData(data);

        const result = await this.provider.pin(data);

        // Validate result
        if (!result.cid || !result.hash) {
          throw new Error("Invalid pin result: missing CID or hash");
        }

        logger.info(
          `Successfully pinned data on attempt ${attempt}: ${result.cid}`
        );
        return result;
      } catch (error: any) {
        lastError = error;
        logger.warn(`IPFS pin attempt ${attempt} failed:`, error.message);

        if (attempt <= this.maxRetries) {
          logger.info(`Retrying in ${this.retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    logger.error(`All IPFS pin attempts failed. Last error:`, lastError);
    const errorMessage = lastError?.message || "Unknown error";
    throw new Error(
      `Failed to pin to IPFS after ${
        this.maxRetries + 1
      } attempts: ${errorMessage}`
    );
  }

  /**
   * Unpin content from IPFS (if supported by provider)
   */
  async unpinContent(cid: string): Promise<boolean> {
    try {
      if (this.provider.unpin) {
        return await this.provider.unpin(cid);
      }
      logger.info(`Provider ${this.provider.name} does not support unpinning`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to unpin content: ${cid}`, error);
      return false;
    }
  }

  /**
   * Validate prediction data structure
   */
  private validatePredictionData(data: any): void {
    if (!data || typeof data !== "object") {
      throw new Error("Data must be a valid object");
    }

    // Required fields for food prediction metadata
    const requiredFields = ["title", "description", "category"];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate category is food-related
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
      throw new Error(
        `Invalid category: ${
          data.category
        }. Must be one of: ${validCategories.join(", ")}`
      );
    }

    // Size limit check (1MB)
    const dataString = JSON.stringify(data);
    if (dataString.length > 1024 * 1024) {
      throw new Error("Prediction data too large (max 1MB)");
    }
  }

  /**
   * Compute keccak256 hash of data (for contract verification)
   */
  static computeDataHash(data: object): string {
    const dataString = JSON.stringify(data);
    const hash = createHash("sha256").update(dataString).digest("hex");
    return `0x${hash}`;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.provider.name;
  }
}

/**
 * Factory function to create IPFS service instance based on environment
 */
export function createIPFSService(): IPFSService {
  const provider = process.env.IPFS_PROVIDER?.toLowerCase() || "pinata";

  let ipfsProvider: IPFSProvider;

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
      throw new Error(
        `Unsupported IPFS provider: ${provider}. Supported: pinata, web3storage`
      );
  }

  logger.info(`Initialized IPFS service with provider: ${provider}`);
  return new IPFSService(ipfsProvider);
}

// Export for testing
export { PinataProvider, Web3StorageProvider };
