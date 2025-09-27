import request from "supertest";
import { expect } from "chai";
import app from "../src/app";

describe("VeriBite Backend API", () => {
  describe("GET /api/predictions", () => {
    it("should return all predictions", async () => {
      const response = await request(app).get("/api/predictions").expect(200);

      expect(response.body).to.have.property("success", true);
      expect(response.body).to.have.property("data");
      expect(Array.isArray(response.body.data)).to.be.true;
    });
  });

  describe("GET /api/predictions/stats", () => {
    it("should return contract statistics", async () => {
      const response = await request(app)
        .get("/api/predictions/stats")
        .expect(200);

      expect(response.body).to.have.property("success", true);
      expect(response.body.data).to.have.property("totalPredictions");
      expect(response.body.data).to.have.property("totalUsers");
      expect(response.body.data).to.have.property("contractBalance");
    });
  });

  describe("POST /api/admin/mark-outcome", () => {
    it("should mark prediction outcome", async () => {
      const requestBody = {
        predictionId: 1,
        correct: true,
        adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      };

      const response = await request(app)
        .post("/api/admin/mark-outcome")
        .send(requestBody)
        .expect(200);

      expect(response.body).to.have.property("success", true);
    });

    it("should reject invalid admin address", async () => {
      const requestBody = {
        predictionId: 1,
        correct: true,
        adminAddress: "0x1234567890123456789012345678901234567890",
      };

      const response = await request(app)
        .post("/api/admin/mark-outcome")
        .send(requestBody)
        .expect(403);

      expect(response.body).to.have.property("success", false);
    });
  });

  describe("GET /api/predictions/user/:address", () => {
    it("should return user predictions", async () => {
      const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

      const response = await request(app)
        .get(`/api/predictions/user/${userAddress}`)
        .expect(200);

      expect(response.body).to.have.property("success", true);
      expect(response.body).to.have.property("data");
      expect(Array.isArray(response.body.data)).to.be.true;
    });

    it("should reject invalid address format", async () => {
      const invalidAddress = "invalid-address";

      const response = await request(app)
        .get(`/api/predictions/user/${invalidAddress}`)
        .expect(400);

      expect(response.body).to.have.property("success", false);
    });
  });
});
