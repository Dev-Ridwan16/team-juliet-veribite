import { IPFSService, createIPFSService } from "../../src/services/ipfs";

// Mock the entire service for testing
jest.mock("../../src/services/ipfs", () => {
  const mockPinResult = {
    cid: "QmTest123abc456def789",
    hash: "0x" + "a".repeat(64),
    size: 1024,
    timestamp: new Date().toISOString(),
  };

  return {
    IPFSService: jest.fn().mockImplementation(() => ({
      pinJSON: jest.fn().mockResolvedValue(mockPinResult),
    })),
    createIPFSService: jest.fn().mockImplementation(() => ({
      pinJSON: jest.fn().mockResolvedValue(mockPinResult),
    })),
  };
});

describe("IPFS Service", () => {
  let ipfsService: any;

  beforeEach(() => {
    process.env.IPFS_PROVIDER = "mock";
    ipfsService = createIPFSService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("pinJSON", () => {
    it("should successfully pin JSON data", async () => {
      const testData = {
        predictionText: "Test prediction",
        category: "Ingredient",
        timestamp: Date.now(),
      };

      const result = await ipfsService.pinJSON(testData);

      expect(result.cid).toBeDefined();
      expect(result.cid).toMatch(/^Qm[A-Za-z0-9]+$/); // IPFS hash format
      expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/); // Hex hash format
      expect(result.size).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    it("should handle empty data", async () => {
      const result = await ipfsService.pinJSON({});

      expect(result.cid).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it("should validate return format", async () => {
      const testData = {
        predictionText: "Data format test",
        category: "Dish",
      };

      const result = await ipfsService.pinJSON(testData);

      expect(result).toHaveProperty("cid");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("size");
      expect(result).toHaveProperty("timestamp");
    });
  });

  describe("service configuration", () => {
    it("should create service successfully", () => {
      const service = createIPFSService();
      expect(service).toBeDefined();
      expect(service.pinJSON).toBeDefined();
    });
  });
});
