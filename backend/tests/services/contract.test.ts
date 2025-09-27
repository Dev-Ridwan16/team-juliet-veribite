import {
  ContractService,
  createContractService,
  ContractOutcome,
} from "../../src/services/contract";

// Mock ethers
jest.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 31337 }),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      address: "0x1234567890123456789012345678901234567890",
    })),
    Contract: jest.fn().mockImplementation(() => ({
      submitFoodPrediction: jest.fn(),
      markOutcome: jest.fn(),
      distributeReward: jest.fn(),
      batchDistributeReward: jest.fn(),
      getFoodPrediction: jest.fn(),
      totalPredictions: jest.fn().mockResolvedValue(BigInt(10)),
    })),
    parseEther: jest.fn((value) => BigInt(value) * BigInt(10 ** 18)),
    formatEther: jest.fn((value) => (Number(value) / 10 ** 18).toString()),
  },
}));

describe("Contract Service", () => {
  let contractService: ContractService;

  beforeEach(() => {
    // Reset environment variables
    process.env.BLOCKCHAIN_NETWORK = "hardhat";
    process.env.PRIVATE_KEY =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    process.env.CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    process.env.RPC_URL = "http://127.0.0.1:8545";

    contractService = createContractService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("submitPrediction", () => {
    it("should successfully submit a prediction", async () => {
      const mockTx = {
        hash: "0xabc123",
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: "0xabc123",
          gasUsed: BigInt(100000),
        }),
      };

      const mockContract = {
        submitFoodPrediction: jest.fn().mockResolvedValue(mockTx),
      };

      // Mock the contract instance
      (contractService as any).contract = mockContract;

      const predictionData = {
        category: "Ingredient",
        predictionText: "These tomatoes will be fresh",
        ipfsHash: "QmTest123",
        stakeAmount: "0.1",
      };

      const result = await contractService.submitPrediction(predictionData);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe("0xabc123");
      expect(result.onChainId).toBeDefined();
      expect(mockContract.submitFoodPrediction).toHaveBeenCalledWith(
        0, // Category enum index
        predictionData.predictionText,
        predictionData.ipfsHash,
        { value: expect.any(BigInt) }
      );
    });

    it("should handle submission failure", async () => {
      const mockContract = {
        submitFoodPrediction: jest
          .fn()
          .mockRejectedValue(new Error("Gas estimation failed")),
      };

      (contractService as any).contract = mockContract;

      const predictionData = {
        category: "Dish",
        predictionText: "This pizza is delicious",
        ipfsHash: "QmTest456",
        stakeAmount: "0.05",
      };

      const result = await contractService.submitPrediction(predictionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gas estimation failed");
    });
  });

  describe("markOutcome", () => {
    it("should successfully mark prediction outcome", async () => {
      const mockTx = {
        hash: "0xdef456",
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: "0xdef456",
        }),
      };

      const mockContract = {
        markOutcome: jest.fn().mockResolvedValue(mockTx),
      };

      (contractService as any).contract = mockContract;

      const result = await contractService.markOutcome(
        1,
        ContractOutcome.Correct
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe("0xdef456");
      expect(mockContract.markOutcome).toHaveBeenCalledWith(
        1,
        ContractOutcome.Correct
      );
    });

    it("should handle marking failure", async () => {
      const mockContract = {
        markOutcome: jest.fn().mockRejectedValue(new Error("Unauthorized")),
      };

      (contractService as any).contract = mockContract;

      const result = await contractService.markOutcome(
        999,
        ContractOutcome.Incorrect
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("distributeReward", () => {
    it("should successfully distribute reward", async () => {
      const mockTx = {
        hash: "0xghi789",
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: "0xghi789",
        }),
      };

      const mockContract = {
        distributeReward: jest.fn().mockResolvedValue(mockTx),
      };

      (contractService as any).contract = mockContract;

      const result = await contractService.distributeReward(1);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe("0xghi789");
      expect(mockContract.distributeReward).toHaveBeenCalledWith(1);
    });
  });

  describe("batchDistributeReward", () => {
    it("should successfully batch distribute rewards", async () => {
      const mockTx = {
        hash: "0xjkl012",
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: "0xjkl012",
        }),
      };

      const mockContract = {
        batchDistributeReward: jest.fn().mockResolvedValue(mockTx),
      };

      (contractService as any).contract = mockContract;

      const predictionIds = [1, 2, 3];
      const result = await contractService.batchDistributeReward(predictionIds);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe("0xjkl012");
      expect(mockContract.batchDistributeReward).toHaveBeenCalledWith(
        predictionIds
      );
    });
  });

  describe("getPrediction", () => {
    it("should successfully retrieve prediction", async () => {
      const mockPrediction = [
        "0x1234567890123456789012345678901234567890", // predictor
        "These ingredients are organic", // predictionText
        "QmPredictionHash", // ipfsHash
        BigInt(Date.now()), // timestamp
        0, // category (Ingredient)
        BigInt("100000000000000000"), // stakeAmount
        0, // outcome (Pending)
        false, // rewardDistributed
      ];

      const mockContract = {
        getFoodPrediction: jest.fn().mockResolvedValue(mockPrediction),
      };

      (contractService as any).contract = mockContract;

      const result = await contractService.getPrediction(1);

      expect(result.success).toBe(true);
      expect(result.prediction).toBeDefined();
      expect(result.prediction?.predictor).toBe(
        "0x1234567890123456789012345678901234567890"
      );
      expect(result.prediction?.predictionText).toBe(
        "These ingredients are organic"
      );
      expect(result.prediction?.category).toBe("Ingredient");
    });

    it("should handle prediction not found", async () => {
      const mockContract = {
        getFoodPrediction: jest
          .fn()
          .mockRejectedValue(new Error("Prediction not found")),
      };

      (contractService as any).contract = mockContract;

      const result = await contractService.getPrediction(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Prediction not found");
    });
  });

  describe("factory function", () => {
    it("should create contract service with default configuration", () => {
      const service = createContractService();
      expect(service).toBeInstanceOf(ContractService);
    });

    it("should handle missing environment variables", () => {
      delete process.env.PRIVATE_KEY;
      delete process.env.CONTRACT_ADDRESS;

      expect(() => createContractService()).toThrow();
    });
  });

  describe("network configuration", () => {
    it("should support different blockchain networks", () => {
      const networks = ["hardhat", "localhost", "sepolia", "mainnet"];

      networks.forEach((network) => {
        process.env.BLOCKCHAIN_NETWORK = network;
        const service = createContractService();
        expect(service).toBeInstanceOf(ContractService);
      });
    });
  });
});
