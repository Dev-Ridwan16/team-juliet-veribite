// Mock environment variables for testing
(process.env as any).NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.ADMIN_API_KEY = "test-admin-key";
process.env.BLOCKCHAIN_NETWORK = "hardhat";
process.env.CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
process.env.IPFS_PROVIDER = "mock";
process.env.FOOD_CLASSIFIER = "keyword";

// Mock console methods in test environment to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
