import { expect } from "chai";
import { ethers } from "hardhat";
import { VeriBitePredictor } from "../typechain-types";

describe("VeriBitePredictor", function () {
  let contract: VeriBitePredictor;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const VeriBitePredictor = await ethers.getContractFactory(
      "VeriBitePredictor"
    );
    contract = await VeriBitePredictor.deploy();
    await contract.waitForDeployment();
  });

  describe("Prediction Submission", function () {
    it("Should allow users to submit predictions with stake", async function () {
      const predictionText = "Bitcoin will reach $100k by end of 2024";
      const stakeAmount = ethers.parseEther("0.1");

      await expect(
        contract.connect(user1).submitPrediction(predictionText, {
          value: stakeAmount,
        })
      )
        .to.emit(contract, "PredictionSubmitted")
        .withArgs(user1.address, 1, predictionText, stakeAmount);

      const predictions = await contract.getAllPredictions();
      expect(predictions.length).to.equal(1);
      expect(predictions[0].text).to.equal(predictionText);
      expect(predictions[0].stake).to.equal(stakeAmount);
      expect(predictions[0].status).to.equal(0); // PENDING
    });

    it("Should reject predictions below minimum stake", async function () {
      const predictionText = "Test prediction";
      const belowMinStake = ethers.parseEther("0.001"); // Below 0.01 ETH

      await expect(
        contract.connect(user1).submitPrediction(predictionText, {
          value: belowMinStake,
        })
      ).to.be.revertedWithCustomError(contract, "InsufficientStake");
    });

    it("Should reject predictions with text too long", async function () {
      const longText = "a".repeat(501); // Exceeds MAX_TEXT_LENGTH
      const stakeAmount = ethers.parseEther("0.1");

      await expect(
        contract.connect(user1).submitPrediction(longText, {
          value: stakeAmount,
        })
      ).to.be.revertedWithCustomError(contract, "TextTooLong");
    });
  });

  describe("Admin Functions", function () {
    let predictionId: number;

    beforeEach(async function () {
      const predictionText = "Test prediction for admin";
      const stakeAmount = ethers.parseEther("0.1");

      await contract.connect(user1).submitPrediction(predictionText, {
        value: stakeAmount,
      });
      predictionId = 1;
    });

    it("Should allow owner to mark outcome as correct", async function () {
      await expect(contract.markOutcome(predictionId, true))
        .to.emit(contract, "OutcomeResolved")
        .withArgs(predictionId, true, user1.address);

      const prediction = await contract.predictions(predictionId);
      expect(prediction.status).to.equal(1); // CORRECT
    });

    it("Should allow owner to mark outcome as incorrect", async function () {
      await expect(contract.markOutcome(predictionId, false))
        .to.emit(contract, "OutcomeResolved")
        .withArgs(predictionId, false, user1.address);

      const prediction = await contract.predictions(predictionId);
      expect(prediction.status).to.equal(2); // INCORRECT
    });

    it("Should reject non-owner from marking outcomes", async function () {
      await expect(
        contract.connect(user1).markOutcome(predictionId, true)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  describe("Reward Distribution", function () {
    it("Should distribute rewards for correct predictions", async function () {
      // Submit multiple predictions
      await contract.connect(user1).submitPrediction("Prediction 1", {
        value: ethers.parseEther("0.1"),
      });
      await contract.connect(user2).submitPrediction("Prediction 2", {
        value: ethers.parseEther("0.1"),
      });

      // Mark first as correct, second as incorrect
      await contract.markOutcome(1, true);
      await contract.markOutcome(2, false);

      // Check balances before reward distribution
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      // Distribute reward
      await expect(contract.distributeReward(1)).to.emit(
        contract,
        "RewardDistributed"
      );

      // Check user1 received reward
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Contract Stats", function () {
    it("Should return correct contract statistics", async function () {
      // Submit some predictions
      await contract.connect(user1).submitPrediction("Test 1", {
        value: ethers.parseEther("0.1"),
      });
      await contract.connect(user2).submitPrediction("Test 2", {
        value: ethers.parseEther("0.2"),
      });

      const stats = await contract.getContractStats();
      expect(stats.totalPredictions).to.equal(2);
      expect(stats.totalUsers).to.equal(2);
      expect(stats.totalStake).to.equal(ethers.parseEther("0.3"));
    });
  });
});
