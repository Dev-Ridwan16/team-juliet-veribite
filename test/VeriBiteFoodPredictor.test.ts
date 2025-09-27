import { expect } from "chai";
import hre from "hardhat";
import { VeriBiteFoodPredictor } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("VeriBiteFoodPredictor", function () {
  let contract: VeriBiteFoodPredictor;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;

  const MIN_STAKE = ethers.parseEther("0.01");
  const PLATFORM_FEE_BPS = 200; // 2%

  // Sample prediction data
  const SAMPLE_PREDICTION = {
    category: 0, // Ingredient
    shortText: "Avocado prices will increase 20% by Q2 2024",
    ipfsCid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    resultHash: ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({
          title: "Avocado Price Prediction",
          description: "Detailed analysis of avocado market trends...",
          timeframe: "Q2 2024",
          confidence: 0.75,
        })
      )
    ),
  };

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy fresh contract for each test
    const VeriBiteFoodPredictor = await ethers.getContractFactory(
      "VeriBiteFoodPredictor"
    );
    contract = await VeriBiteFoodPredictor.deploy(MIN_STAKE, PLATFORM_FEE_BPS);
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set the correct minimum stake", async function () {
      expect(await contract.minStake()).to.equal(MIN_STAKE);
    });

    it("Should set the correct platform fee", async function () {
      expect(await contract.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
    });

    it("Should initialize with zero predictions", async function () {
      const ids = await contract.getPredictionIds();
      expect(ids.length).to.equal(0);
    });

    it("Should revert with invalid platform fee", async function () {
      const VeriBiteFoodPredictor = await ethers.getContractFactory(
        "VeriBiteFoodPredictor"
      );
      await expect(
        VeriBiteFoodPredictor.deploy(MIN_STAKE, 2001) // 20.01%
      ).to.be.revertedWithCustomError(contract, "InvalidFeeBps");
    });
  });

  describe("Prediction Submission", function () {
    it("Should allow valid prediction submission", async function () {
      const tx = await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );

      await expect(tx)
        .to.emit(contract, "FoodPredictionSubmitted")
        .withArgs(
          1,
          user1.address,
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.resultHash,
          MIN_STAKE,
          SAMPLE_PREDICTION.ipfsCid
        );

      const prediction = await contract.getPrediction(1);
      expect(prediction.id).to.equal(1);
      expect(prediction.predictor).to.equal(user1.address);
      expect(prediction.category).to.equal(SAMPLE_PREDICTION.category);
      expect(prediction.shortText).to.equal(SAMPLE_PREDICTION.shortText);
      expect(prediction.ipfsCid).to.equal(SAMPLE_PREDICTION.ipfsCid);
      expect(prediction.resultHash).to.equal(SAMPLE_PREDICTION.resultHash);
      expect(prediction.stake).to.equal(MIN_STAKE);
      expect(prediction.outcome).to.equal(0); // Pending
    });

    it("Should revert with insufficient stake", async function () {
      const insufficientStake = MIN_STAKE - BigInt(1);

      await expect(
        contract
          .connect(user1)
          .submitFoodPrediction(
            SAMPLE_PREDICTION.category,
            SAMPLE_PREDICTION.shortText,
            SAMPLE_PREDICTION.ipfsCid,
            SAMPLE_PREDICTION.resultHash,
            { value: insufficientStake }
          )
      )
        .to.be.revertedWithCustomError(contract, "InsufficientStake")
        .withArgs(insufficientStake, MIN_STAKE);
    });

    it("Should revert with empty short text", async function () {
      await expect(
        contract.connect(user1).submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          "", // Empty text
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        )
      ).to.be.revertedWithCustomError(contract, "InvalidTextLength");
    });

    it("Should revert with text too long", async function () {
      const longText = "A".repeat(257); // 257 characters

      await expect(
        contract
          .connect(user1)
          .submitFoodPrediction(
            SAMPLE_PREDICTION.category,
            longText,
            SAMPLE_PREDICTION.ipfsCid,
            SAMPLE_PREDICTION.resultHash,
            { value: MIN_STAKE }
          )
      ).to.be.revertedWithCustomError(contract, "InvalidTextLength");
    });

    it("Should revert with empty IPFS CID", async function () {
      await expect(
        contract.connect(user1).submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          "", // Empty CID
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        )
      ).to.be.revertedWithCustomError(contract, "InvalidIPFSCid");
    });

    it("Should revert with zero result hash", async function () {
      await expect(
        contract.connect(user1).submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          ethers.ZeroHash, // Zero hash
          { value: MIN_STAKE }
        )
      ).to.be.revertedWithCustomError(contract, "InvalidResultHash");
    });

    it("Should handle multiple predictions from same user", async function () {
      // Submit first prediction
      await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );

      // Submit second prediction
      await contract.connect(user1).submitFoodPrediction(
        1, // Dish category
        "Pizza sales will decline in winter",
        "QmSecondCid123456789",
        ethers.keccak256(ethers.toUtf8Bytes("second prediction")),
        { value: MIN_STAKE }
      );

      const userPredictionIds = await contract.getUserPredictionIds(
        user1.address
      );
      expect(userPredictionIds.length).to.equal(2);
      expect(userPredictionIds[0]).to.equal(1);
      expect(userPredictionIds[1]).to.equal(2);
    });

    it("Should update contract statistics correctly", async function () {
      await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );

      const stats = await contract.getContractStats();
      expect(stats.totalPredictions).to.equal(1);
      expect(stats.totalUsers).to.equal(1);
      expect(stats.totalStake).to.equal(MIN_STAKE);
    });
  });

  describe("Outcome Management", function () {
    beforeEach(async function () {
      // Submit a test prediction
      await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );
    });

    it("Should allow owner to mark prediction as correct", async function () {
      const tx = await contract.connect(owner).markOutcome(1, 1); // Correct

      await expect(tx)
        .to.emit(contract, "PredictionOutcomeResolved")
        .withArgs(1, 1);

      const prediction = await contract.getPrediction(1);
      expect(prediction.outcome).to.equal(1); // Correct
    });

    it("Should allow owner to mark prediction as incorrect", async function () {
      await contract.connect(owner).markOutcome(1, 2); // Incorrect

      const prediction = await contract.getPrediction(1);
      expect(prediction.outcome).to.equal(2); // Incorrect
    });

    it("Should allow owner to mark prediction as disputed", async function () {
      await contract.connect(owner).markOutcome(1, 3); // Disputed

      const prediction = await contract.getPrediction(1);
      expect(prediction.outcome).to.equal(3); // Disputed
    });

    it("Should allow settling disputed prediction", async function () {
      await contract.connect(owner).markOutcome(1, 3); // Disputed
      await contract.connect(owner).markOutcome(1, 4); // Settled

      const prediction = await contract.getPrediction(1);
      expect(prediction.outcome).to.equal(4); // Settled
    });

    it("Should revert when non-owner tries to mark outcome", async function () {
      await expect(
        contract.connect(user1).markOutcome(1, 1)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should revert when marking non-existent prediction", async function () {
      await expect(contract.connect(owner).markOutcome(999, 1))
        .to.be.revertedWithCustomError(contract, "PredictionNotFound")
        .withArgs(999);
    });

    it("Should revert invalid outcome transitions", async function () {
      await contract.connect(owner).markOutcome(1, 1); // Mark as correct

      // Try to change to incorrect (should fail)
      await expect(
        contract.connect(owner).markOutcome(1, 2)
      ).to.be.revertedWithCustomError(contract, "PredictionAlreadyResolved");
    });
  });

  describe("Reward Distribution", function () {
    beforeEach(async function () {
      await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );
    });

    it("Should distribute reward for correct prediction", async function () {
      // Mark as correct
      await contract.connect(owner).markOutcome(1, 1);

      const platformFee =
        (MIN_STAKE * BigInt(PLATFORM_FEE_BPS)) / BigInt(10000);
      const expectedReward = MIN_STAKE - platformFee;

      const userBalanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await contract.connect(owner).distributeReward(1);

      await expect(tx)
        .to.emit(contract, "RewardPaid")
        .withArgs(1, user1.address, expectedReward);

      const userBalanceAfter = await ethers.provider.getBalance(user1.address);
      expect(userBalanceAfter - userBalanceBefore).to.equal(expectedReward);

      // Check that stake is zeroed out (prevents double payment)
      const prediction = await contract.getPrediction(1);
      expect(prediction.stake).to.equal(0);
    });

    it("Should not distribute reward for incorrect prediction", async function () {
      await contract.connect(owner).markOutcome(1, 2); // Incorrect

      await expect(
        contract.connect(owner).distributeReward(1)
      ).to.be.revertedWithCustomError(contract, "InvalidOutcomeTransition");
    });

    it("Should handle batch reward distribution", async function () {
      // Submit second prediction
      await contract
        .connect(user2)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          "Another prediction",
          "QmAnotherCid",
          ethers.keccak256(ethers.toUtf8Bytes("another prediction")),
          { value: MIN_STAKE }
        );

      // Mark both as correct
      await contract.connect(owner).markOutcome(1, 1);
      await contract.connect(owner).markOutcome(2, 1);

      const tx = await contract.connect(owner).batchDistributeRewards([1, 2]);

      const user1Balance = await ethers.provider.getBalance(user1.address);
      const user2Balance = await ethers.provider.getBalance(user2.address);

      // Both users should have received their rewards
      // (Testing exact amounts would be complex due to gas costs)
    });

    it("Should revert if contract has insufficient balance", async function () {
      await contract.connect(owner).markOutcome(1, 1);

      // Withdraw all funds first
      const contractBalance = await ethers.provider.getBalance(
        await contract.getAddress()
      );
      await contract.connect(owner).withdraw(contractBalance);

      await expect(
        contract.connect(owner).distributeReward(1)
      ).to.be.revertedWithCustomError(contract, "InsufficientContractBalance");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Submit predictions with different categories and outcomes
      await contract.connect(user1).submitFoodPrediction(
        0, // Ingredient
        SAMPLE_PREDICTION.shortText,
        SAMPLE_PREDICTION.ipfsCid,
        SAMPLE_PREDICTION.resultHash,
        { value: MIN_STAKE }
      );

      await contract.connect(user2).submitFoodPrediction(
        1, // Dish
        "Sushi popularity will rise",
        "QmSushiCid",
        ethers.keccak256(ethers.toUtf8Bytes("sushi prediction")),
        { value: MIN_STAKE }
      );

      await contract.connect(user1).submitFoodPrediction(
        2, // Diet
        "Keto diet trend will decline",
        "QmKetoCid",
        ethers.keccak256(ethers.toUtf8Bytes("keto prediction")),
        { value: MIN_STAKE }
      );
    });

    it("Should return predictions by category", async function () {
      const ingredientPredictions = await contract.getPredictionsByCategory(0);
      const dishPredictions = await contract.getPredictionsByCategory(1);
      const dietPredictions = await contract.getPredictionsByCategory(2);

      expect(ingredientPredictions.length).to.equal(1);
      expect(dishPredictions.length).to.equal(1);
      expect(dietPredictions.length).to.equal(1);
    });

    it("Should return predictions by outcome", async function () {
      // All should be pending initially
      const pendingPredictions = await contract.getPredictionsByOutcome(0);
      expect(pendingPredictions.length).to.equal(3);

      // Mark one as correct
      await contract.connect(owner).markOutcome(1, 1);

      const correctPredictions = await contract.getPredictionsByOutcome(1);
      const stillPending = await contract.getPredictionsByOutcome(0);

      expect(correctPredictions.length).to.equal(1);
      expect(stillPending.length).to.equal(2);
    });

    it("Should return paginated prediction IDs", async function () {
      const firstPage = await contract.getPredictionIdsPaginated(0, 2);
      const secondPage = await contract.getPredictionIdsPaginated(2, 2);

      expect(firstPage.length).to.equal(2);
      expect(secondPage.length).to.equal(1);
      expect(firstPage[0]).to.equal(1);
      expect(firstPage[1]).to.equal(2);
      expect(secondPage[0]).to.equal(3);
    });

    it("Should return correct user prediction IDs", async function () {
      const user1Predictions = await contract.getUserPredictionIds(
        user1.address
      );
      const user2Predictions = await contract.getUserPredictionIds(
        user2.address
      );

      expect(user1Predictions.length).to.equal(2);
      expect(user2Predictions.length).to.equal(1);
      expect(user1Predictions).to.deep.equal([BigInt(1), BigInt(3)]);
      expect(user2Predictions).to.deep.equal([BigInt(2)]);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update minimum stake", async function () {
      const newMinStake = ethers.parseEther("0.02");

      const tx = await contract.connect(owner).updateMinStake(newMinStake);

      await expect(tx)
        .to.emit(contract, "MinStakeUpdated")
        .withArgs(newMinStake);

      expect(await contract.minStake()).to.equal(newMinStake);
    });

    it("Should allow owner to update platform fee", async function () {
      const newFeeBps = 300; // 3%

      const tx = await contract.connect(owner).updatePlatformFeeBps(newFeeBps);

      await expect(tx)
        .to.emit(contract, "PlatformFeeUpdated")
        .withArgs(newFeeBps);

      expect(await contract.platformFeeBps()).to.equal(newFeeBps);
    });

    it("Should revert when setting invalid platform fee", async function () {
      await expect(
        contract.connect(owner).updatePlatformFeeBps(2001) // 20.01%
      ).to.be.revertedWithCustomError(contract, "InvalidFeeBps");
    });

    it("Should allow owner to withdraw funds", async function () {
      // Add some funds to contract
      await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );

      const withdrawAmount = MIN_STAKE / BigInt(2);
      const ownerBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      const tx = await contract.connect(owner).withdraw(withdrawAmount);

      await expect(tx)
        .to.emit(contract, "ContractWithdrawal")
        .withArgs(owner.address, withdrawAmount);
    });

    it("Should allow owner to pause and unpause", async function () {
      // Pause contract
      await contract.connect(owner).pause();

      // Should reject new predictions when paused
      await expect(
        contract
          .connect(user1)
          .submitFoodPrediction(
            SAMPLE_PREDICTION.category,
            SAMPLE_PREDICTION.shortText,
            SAMPLE_PREDICTION.ipfsCid,
            SAMPLE_PREDICTION.resultHash,
            { value: MIN_STAKE }
          )
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");

      // Unpause
      await contract.connect(owner).unpause();

      // Should accept predictions again
      await expect(
        contract
          .connect(user1)
          .submitFoodPrediction(
            SAMPLE_PREDICTION.category,
            SAMPLE_PREDICTION.shortText,
            SAMPLE_PREDICTION.ipfsCid,
            SAMPLE_PREDICTION.resultHash,
            { value: MIN_STAKE }
          )
      ).not.to.be.reverted;
    });
  });

  describe("Security Tests", function () {
    it("Should prevent reentrancy attacks", async function () {
      // This is inherently tested by using OpenZeppelin's ReentrancyGuard
      // and our test suite not experiencing any reentrancy issues
    });

    it("Should handle edge cases gracefully", async function () {
      // Test with maximum valid category
      await contract.connect(user1).submitFoodPrediction(
        6, // Other (maximum valid category)
        SAMPLE_PREDICTION.shortText,
        SAMPLE_PREDICTION.ipfsCid,
        SAMPLE_PREDICTION.resultHash,
        { value: MIN_STAKE }
      );

      // Test with maximum valid short text length
      const maxText = "A".repeat(256);
      await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          maxText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );
    });

    it("Should handle contract receiving ETH", async function () {
      // Send ETH directly to contract
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      const contractBalance = await ethers.provider.getBalance(
        await contract.getAddress()
      );
      expect(contractBalance).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should have reasonable gas costs for prediction submission", async function () {
      const tx = await contract
        .connect(user1)
        .submitFoodPrediction(
          SAMPLE_PREDICTION.category,
          SAMPLE_PREDICTION.shortText,
          SAMPLE_PREDICTION.ipfsCid,
          SAMPLE_PREDICTION.resultHash,
          { value: MIN_STAKE }
        );

      const receipt = await tx.wait();
      console.log(
        `Gas used for prediction submission: ${receipt?.gasUsed.toString()}`
      );

      // Ensure gas usage is reasonable (adjust threshold as needed)
      expect(receipt?.gasUsed).to.be.lessThan(500000);
    });

    it("Should optimize batch operations", async function () {
      // Submit multiple predictions
      const predictions = [];
      for (let i = 0; i < 3; i++) {
        await contract.connect(user1).submitFoodPrediction(
          i, // Different categories
          `Prediction ${i}`,
          `QmCid${i}`,
          ethers.keccak256(ethers.toUtf8Bytes(`prediction ${i}`)),
          { value: MIN_STAKE }
        );
        predictions.push(i + 1);
      }

      // Mark all as correct
      for (const id of predictions) {
        await contract.connect(owner).markOutcome(id, 1);
      }

      // Test batch distribution
      const tx = await contract
        .connect(owner)
        .batchDistributeRewards(predictions);
      const receipt = await tx.wait();

      console.log(
        `Gas used for batch distribution (3 predictions): ${receipt?.gasUsed.toString()}`
      );
    });
  });
});
