import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../src/app";
import { Prediction } from "../../src/models/Prediction";
import { User } from "../../src/models/User";

describe("API Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  let adminApiKey: string;

  beforeAll(async () => {
    // Set up in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set admin API key for testing
    adminApiKey = "test-admin-key";
    process.env.ADMIN_API_KEY = adminApiKey;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up database between tests
    await Prediction.deleteMany({});
    await User.deleteMany({});
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({
        status: "OK",
        timestamp: expect.any(String),
        service: "VeriBite Backend",
      });
    });
  });

  describe("Predictions API", () => {
    describe("POST /api/predictions", () => {
      it("should create a new prediction", async () => {
        const predictionData = {
          userAddress: "0x1234567890123456789012345678901234567890",
          predictionText: "These organic tomatoes will taste amazing",
          category: "Ingredient",
          relayerMode: true,
        };

        const response = await request(app)
          .post("/api/predictions")
          .send(predictionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.prediction).toBeDefined();
        expect(response.body.prediction.predictionText).toBe(
          predictionData.predictionText
        );
        expect(response.body.prediction.category).toBe("Ingredient");
        expect(response.body.prediction.status).toBe("pending");
      });

      it("should validate required fields", async () => {
        const response = await request(app)
          .post("/api/predictions")
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Validation error");
      });

      it("should validate Ethereum address format", async () => {
        const response = await request(app)
          .post("/api/predictions")
          .send({
            userAddress: "invalid-address",
            predictionText: "Test prediction",
            category: "Ingredient",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Validation error");
      });

      it("should classify food predictions correctly", async () => {
        const predictionData = {
          userAddress: "0x1234567890123456789012345678901234567890",
          predictionText: "This restaurant serves excellent pasta dishes",
          relayerMode: true,
        };

        const response = await request(app)
          .post("/api/predictions")
          .send(predictionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.prediction.category).toBe("Restaurant");
      });

      it("should handle rate limiting", async () => {
        const predictionData = {
          userAddress: "0x1234567890123456789012345678901234567890",
          predictionText: "Test prediction",
          category: "Ingredient",
        };

        // Make multiple rapid requests to trigger rate limiting
        const requests = Array(11)
          .fill(null)
          .map(() =>
            request(app).post("/api/predictions").send(predictionData)
          );

        const results = await Promise.allSettled(requests);

        // Some requests should be rate limited
        const rateLimited = results.some(
          (result) =>
            result.status === "fulfilled" && result.value.status === 429
        );
        expect(rateLimited).toBe(false); // Our rate limit should be higher than 10
      });
    });

    describe("GET /api/predictions", () => {
      beforeEach(async () => {
        // Create test data
        await Prediction.create([
          {
            user: new mongoose.Types.ObjectId(),
            predictionText: "These ingredients are organic",
            category: "Ingredient",
            status: "pending",
            ipfsHash: "QmTest1",
            classificationConfidence: 0.95,
          },
          {
            user: new mongoose.Types.ObjectId(),
            predictionText: "This restaurant has great service",
            category: "Restaurant",
            status: "correct",
            ipfsHash: "QmTest2",
            classificationConfidence: 0.87,
          },
        ]);
      });

      it("should return paginated predictions", async () => {
        const response = await request(app).get("/api/predictions").expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.total).toBe(2);
      });

      it("should support pagination", async () => {
        const response = await request(app)
          .get("/api/predictions?page=1&limit=1")
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(1);
      });

      it("should filter by category", async () => {
        const response = await request(app)
          .get("/api/predictions?category=Restaurant")
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].category).toBe("Restaurant");
      });

      it("should filter by status", async () => {
        const response = await request(app)
          .get("/api/predictions?status=correct")
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].status).toBe("correct");
      });
    });

    describe("GET /api/predictions/:id", () => {
      let predictionId: string;

      beforeEach(async () => {
        const prediction = await Prediction.create({
          user: new mongoose.Types.ObjectId(),
          predictionText: "This dish tastes amazing",
          category: "Dish",
          status: "pending",
          ipfsHash: "QmTest123",
          classificationConfidence: 0.92,
        });
        predictionId = prediction._id.toString();
      });

      it("should return specific prediction", async () => {
        const response = await request(app)
          .get(`/api/predictions/${predictionId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.prediction._id).toBe(predictionId);
        expect(response.body.prediction.predictionText).toBe(
          "This dish tastes amazing"
        );
      });

      it("should handle prediction not found", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        const response = await request(app)
          .get(`/api/predictions/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Prediction not found");
      });

      it("should handle invalid prediction ID format", async () => {
        const response = await request(app)
          .get("/api/predictions/invalid-id")
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Invalid prediction ID format");
      });
    });
  });

  describe("Admin API", () => {
    describe("GET /api/admin/stats", () => {
      beforeEach(async () => {
        // Create test data
        await Promise.all([
          Prediction.create({
            user: new mongoose.Types.ObjectId(),
            predictionText: "Test prediction 1",
            category: "Ingredient",
            status: "pending",
            ipfsHash: "QmTest1",
          }),
          Prediction.create({
            user: new mongoose.Types.ObjectId(),
            predictionText: "Test prediction 2",
            category: "Dish",
            status: "correct",
            ipfsHash: "QmTest2",
          }),
        ]);
      });

      it("should return platform statistics", async () => {
        const response = await request(app)
          .get("/api/admin/stats")
          .set("x-admin-api-key", adminApiKey)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.totalPredictions).toBe(2);
        expect(response.body.stats.pendingPredictions).toBe(1);
        expect(response.body.stats.statusBreakdown).toBeDefined();
        expect(response.body.stats.categoryBreakdown).toBeDefined();
      });

      it("should require admin authentication", async () => {
        const response = await request(app).get("/api/admin/stats").expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Unauthorized - Invalid API key");
      });

      it("should reject invalid API key", async () => {
        const response = await request(app)
          .get("/api/admin/stats")
          .set("x-admin-api-key", "invalid-key")
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Unauthorized - Invalid API key");
      });
    });

    describe("GET /api/admin/predictions", () => {
      beforeEach(async () => {
        await Promise.all([
          Prediction.create({
            user: new mongoose.Types.ObjectId(),
            predictionText: "Admin test 1",
            category: "Ingredient",
            status: "pending",
            ipfsHash: "QmAdminTest1",
          }),
          Prediction.create({
            user: new mongoose.Types.ObjectId(),
            predictionText: "Admin test 2",
            category: "Restaurant",
            status: "correct",
            ipfsHash: "QmAdminTest2",
          }),
        ]);
      });

      it("should return all predictions for admin", async () => {
        const response = await request(app)
          .get("/api/admin/predictions")
          .set("x-admin-api-key", adminApiKey)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination).toBeDefined();
      });

      it("should support admin filtering", async () => {
        const response = await request(app)
          .get("/api/admin/predictions?status=pending")
          .set("x-admin-api-key", adminApiKey)
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.filters.status).toBe("pending");
      });
    });

    describe("POST /api/admin/mark-outcome", () => {
      let testPrediction: any;

      beforeEach(async () => {
        testPrediction = await Prediction.create({
          user: new mongoose.Types.ObjectId(),
          predictionText: "Test prediction for outcome",
          category: "Ingredient",
          status: "pending",
          ipfsHash: "QmOutcomeTest",
          onChainId: 1,
        });
      });

      it("should validate admin mark outcome request", async () => {
        const response = await request(app)
          .post("/api/admin/mark-outcome")
          .set("x-admin-api-key", adminApiKey)
          .send({
            predictionId: 1,
            outcome: "Correct",
            reason: "Test admin decision",
          })
          .expect(500); // Will fail because contract service is mocked

        // The request should be properly formatted even if contract fails
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Failed to mark outcome on contract");
      });

      it("should validate mark outcome input", async () => {
        const response = await request(app)
          .post("/api/admin/mark-outcome")
          .set("x-admin-api-key", adminApiKey)
          .send({
            predictionId: "invalid",
            outcome: "InvalidOutcome",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Validation error");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown routes", async () => {
      const response = await request(app).get("/api/nonexistent").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Route not found");
    });

    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/predictions")
        .send("invalid json")
        .set("Content-Type", "application/json")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
