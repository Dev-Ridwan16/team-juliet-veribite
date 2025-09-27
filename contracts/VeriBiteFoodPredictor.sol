// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VeriBiteFoodPredictor
 * @dev Smart contract for food-only predictions with staking mechanism
 * @notice Users can submit food-related predictions with ETH stakes and earn rewards for correct predictions
 * @dev Integrates with IPFS for detailed prediction metadata storage
 */
contract VeriBiteFoodPredictor is Ownable, ReentrancyGuard, Pausable {
    
    // Food prediction categories - strictly food-related only
    enum Category {
        Ingredient,    // 0 - Ingredient trends, pricing, availability
        Dish,          // 1 - Dish popularity, seasonal trends
        Diet,          // 2 - Dietary shifts, nutrition trends  
        Restaurant,    // 3 - Restaurant/menu changes, closures
        Consumption,   // 4 - Food consumption patterns, demand
        FoodPolicy,    // 5 - Food policy, regulations, standards
        Other          // 6 - Other food-related predictions
    }
    
    // Prediction outcome status
    enum Outcome {
        Pending,    // 0 - Awaiting resolution
        Correct,    // 1 - Prediction proven correct
        Incorrect,  // 2 - Prediction proven incorrect
        Disputed,   // 3 - Outcome under dispute
        Settled     // 4 - Dispute resolved
    }
    
    // Core prediction structure - minimal on-chain storage
    struct FoodPrediction {
        uint256 id;                    // Unique prediction identifier
        address payable predictor;      // Address of the predictor
        Category category;             // Food prediction category
        string shortText;              // Brief prediction text (max 256 bytes)
        string ipfsCid;               // IPFS CID for full metadata JSON
        bytes32 resultHash;           // keccak256 hash of metadata for integrity
        uint256 stake;                // Amount staked in wei
        Outcome outcome;              // Current prediction outcome
        uint256 createdAt;            // Timestamp of creation
    }
    
    // Configuration parameters
    uint256 public minStake;           // Minimum stake required (in wei)
    uint256 public platformFeeBps;    // Platform fee in basis points (100 = 1%)
    
    // Contract state
    uint256 private _predictionIdCounter;
    mapping(uint256 => FoodPrediction) public predictions;
    uint256[] public predictionIds;
    
    // User tracking
    mapping(address => uint256[]) public userPredictionIds;
    mapping(address => uint256) public userTotalStaked;
    mapping(address => uint256) public userTotalRewards;
    
    // Contract statistics
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public totalPlatformFees;
    
    // Events for frontend/backend indexing
    event FoodPredictionSubmitted(
        uint256 indexed id,
        address indexed predictor,
        Category category,
        bytes32 resultHash,
        uint256 stake,
        string ipfsCid
    );
    
    event PredictionOutcomeResolved(
        uint256 indexed id,
        Outcome outcome
    );
    
    event RewardPaid(
        uint256 indexed id,
        address indexed to,
        uint256 amount
    );
    
    event PlatformFeeUpdated(uint256 newFeeBps);
    event MinStakeUpdated(uint256 newMinStake);
    event ContractWithdrawal(address indexed to, uint256 amount);
    
    // Custom errors for gas efficiency
    error InsufficientStake(uint256 provided, uint256 required);
    error InvalidTextLength();
    error InvalidIPFSCid();
    error InvalidResultHash();
    error PredictionNotFound(uint256 id);
    error PredictionAlreadyResolved(uint256 id);
    error InvalidOutcomeTransition(Outcome from, Outcome to);
    error InsufficientContractBalance();
    error TransferFailed();
    error InvalidFeeBps(uint256 feeBps);
    error ArrayLengthMismatch();
    error InvalidCategory();
    
    /**
     * @dev Constructor - initializes with reasonable defaults
     * @param _minStake Initial minimum stake (in wei)
     * @param _platformFeeBps Initial platform fee in basis points
     */
    constructor(uint256 _minStake, uint256 _platformFeeBps) Ownable(msg.sender) {
        if (_platformFeeBps > 2000) revert InvalidFeeBps(_platformFeeBps); // Max 20%
        
        minStake = _minStake;
        platformFeeBps = _platformFeeBps;
        _predictionIdCounter = 1;
        
        emit MinStakeUpdated(_minStake);
        emit PlatformFeeUpdated(_platformFeeBps);
    }
    
    /**
     * @dev Submit a new food prediction with stake
     * @param category Food prediction category
     * @param shortText Brief prediction text (max 256 bytes)
     * @param ipfsCid IPFS CID containing full prediction metadata
     * @param resultHash keccak256 hash of the metadata JSON for integrity verification
     */
    function submitFoodPrediction(
        Category category,
        string calldata shortText,
        string calldata ipfsCid,
        bytes32 resultHash
    ) external payable nonReentrant whenNotPaused {
        // Validate inputs
        if (msg.value < minStake) {
            revert InsufficientStake(msg.value, minStake);
        }
        
        if (bytes(shortText).length == 0 || bytes(shortText).length > 256) {
            revert InvalidTextLength();
        }
        
        if (bytes(ipfsCid).length == 0) {
            revert InvalidIPFSCid();
        }
        
        if (resultHash == bytes32(0)) {
            revert InvalidResultHash();
        }
        
        if (uint8(category) > uint8(Category.Other)) {
            revert InvalidCategory();
        }
        
        // Create prediction
        uint256 predictionId = _predictionIdCounter++;
        
        predictions[predictionId] = FoodPrediction({
            id: predictionId,
            predictor: payable(msg.sender),
            category: category,
            shortText: shortText,
            ipfsCid: ipfsCid,
            resultHash: resultHash,
            stake: msg.value,
            outcome: Outcome.Pending,
            createdAt: block.timestamp
        });
        
        // Update state
        predictionIds.push(predictionId);
        userPredictionIds[msg.sender].push(predictionId);
        userTotalStaked[msg.sender] += msg.value;
        totalStaked += msg.value;
        
        emit FoodPredictionSubmitted(
            predictionId,
            msg.sender,
            category,
            resultHash,
            msg.value,
            ipfsCid
        );
    }
    
    /**
     * @dev Mark prediction outcome (admin only)
     * @param id Prediction ID
     * @param outcome New outcome status
     */
    function markOutcome(uint256 id, Outcome outcome) external onlyOwner nonReentrant {
        FoodPrediction storage prediction = predictions[id];
        
        if (prediction.id == 0) {
            revert PredictionNotFound(id);
        }
        
        Outcome currentOutcome = prediction.outcome;
        
        // Validate state transitions
        if (currentOutcome == Outcome.Pending) {
            if (outcome != Outcome.Correct && outcome != Outcome.Incorrect && outcome != Outcome.Disputed) {
                revert InvalidOutcomeTransition(currentOutcome, outcome);
            }
        } else if (currentOutcome == Outcome.Disputed) {
            if (outcome != Outcome.Settled) {
                revert InvalidOutcomeTransition(currentOutcome, outcome);
            }
        } else {
            // Cannot change final outcomes (Correct, Incorrect, Settled)
            revert PredictionAlreadyResolved(id);
        }
        
        prediction.outcome = outcome;
        
        emit PredictionOutcomeResolved(id, outcome);
    }
    
    /**
     * @dev Distribute reward to correct prediction (admin only)
     * @param id Prediction ID to reward
     */
    function distributeReward(uint256 id) external onlyOwner nonReentrant {
        FoodPrediction storage prediction = predictions[id];
        
        if (prediction.id == 0) {
            revert PredictionNotFound(id);
        }
        
        if (prediction.outcome != Outcome.Correct && prediction.outcome != Outcome.Settled) {
            revert InvalidOutcomeTransition(prediction.outcome, Outcome.Correct);
        }
        
        uint256 stakeAmount = prediction.stake;
        if (stakeAmount == 0) {
            return; // Already paid out
        }
        
        // Calculate platform fee and reward
        uint256 platformFee = (stakeAmount * platformFeeBps) / 10000;
        uint256 rewardAmount = stakeAmount - platformFee;
        
        if (address(this).balance < rewardAmount) {
            revert InsufficientContractBalance();
        }
        
        // Mark as paid out
        prediction.stake = 0;
        
        // Update tracking
        userTotalRewards[prediction.predictor] += rewardAmount;
        totalRewardsDistributed += rewardAmount;
        totalPlatformFees += platformFee;
        
        // Transfer reward
        (bool success, ) = prediction.predictor.call{value: rewardAmount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit RewardPaid(id, prediction.predictor, rewardAmount);
    }
    
    /**
     * @dev Batch distribute rewards for multiple correct predictions
     * @param ids Array of prediction IDs to reward
     */
    function batchDistributeRewards(uint256[] calldata ids) external onlyOwner nonReentrant {
        for (uint256 i = 0; i < ids.length; i++) {
            // Call internal distribute logic without external modifier overhead
            _distributeSingleReward(ids[i]);
        }
    }
    
    /**
     * @dev Internal reward distribution logic
     */
    function _distributeSingleReward(uint256 id) internal {
        FoodPrediction storage prediction = predictions[id];
        
        if (prediction.id == 0) return; // Skip invalid predictions
        if (prediction.outcome != Outcome.Correct && prediction.outcome != Outcome.Settled) return;
        if (prediction.stake == 0) return; // Already paid
        
        uint256 stakeAmount = prediction.stake;
        uint256 platformFee = (stakeAmount * platformFeeBps) / 10000;
        uint256 rewardAmount = stakeAmount - platformFee;
        
        if (address(this).balance < rewardAmount) return; // Skip if insufficient balance
        
        prediction.stake = 0;
        userTotalRewards[prediction.predictor] += rewardAmount;
        totalRewardsDistributed += rewardAmount;
        totalPlatformFees += platformFee;
        
        (bool success, ) = prediction.predictor.call{value: rewardAmount}("");
        if (success) {
            emit RewardPaid(id, prediction.predictor, rewardAmount);
        }
    }
    
    // View functions for frontend integration
    
    /**
     * @dev Get single prediction details
     */
    function getPrediction(uint256 id) external view returns (FoodPrediction memory) {
        if (predictions[id].id == 0) {
            revert PredictionNotFound(id);
        }
        return predictions[id];
    }
    
    /**
     * @dev Get all prediction IDs (for indexing)
     */
    function getPredictionIds() external view returns (uint256[] memory) {
        return predictionIds;
    }
    
    /**
     * @dev Get paginated prediction IDs
     * @param offset Starting index
     * @param limit Maximum number of IDs to return
     */
    function getPredictionIdsPaginated(uint256 offset, uint256 limit) 
        external view returns (uint256[] memory) {
        uint256 total = predictionIds.length;
        if (offset >= total) {
            return new uint256[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = predictionIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get user's prediction IDs
     */
    function getUserPredictionIds(address user) external view returns (uint256[] memory) {
        return userPredictionIds[user];
    }
    
    /**
     * @dev Get predictions by category
     */
    function getPredictionsByCategory(Category category) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count matching predictions
        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (predictions[predictionIds[i]].category == category) {
                count++;
            }
        }
        
        // Build result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (predictions[predictionIds[i]].category == category) {
                result[index] = predictionIds[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get predictions by outcome status
     */
    function getPredictionsByOutcome(Outcome outcome) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (predictions[predictionIds[i]].outcome == outcome) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (predictions[predictionIds[i]].outcome == outcome) {
                result[index] = predictionIds[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalPredictions,
        uint256 totalUsers,
        uint256 contractBalance,
        uint256 totalStake,
        uint256 totalRewards,
        uint256 totalFees
    ) {
        // Count unique users (gas-intensive, consider caching in production)
        uint256 userCount = 0;
        if (predictionIds.length > 0) {
            address[] memory seenUsers = new address[](predictionIds.length);
            
            for (uint256 i = 0; i < predictionIds.length; i++) {
                address user = predictions[predictionIds[i]].predictor;
                bool isNewUser = true;
                
                for (uint256 j = 0; j < userCount; j++) {
                    if (seenUsers[j] == user) {
                        isNewUser = false;
                        break;
                    }
                }
                
                if (isNewUser) {
                    seenUsers[userCount] = user;
                    userCount++;
                }
            }
        }
        
        return (
            predictionIds.length,
            userCount,
            address(this).balance,
            totalStaked,
            totalRewardsDistributed,
            totalPlatformFees
        );
    }
    
    // Admin functions
    
    /**
     * @dev Update minimum stake requirement
     */
    function updateMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
        emit MinStakeUpdated(_minStake);
    }
    
    /**
     * @dev Update platform fee (max 20%)
     */
    function updatePlatformFeeBps(uint256 _platformFeeBps) external onlyOwner {
        if (_platformFeeBps > 2000) revert InvalidFeeBps(_platformFeeBps);
        platformFeeBps = _platformFeeBps;
        emit PlatformFeeUpdated(_platformFeeBps);
    }
    
    /**
     * @dev Withdraw platform fees and unclaimed incorrect stakes
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        if (amount > address(this).balance) {
            revert InsufficientContractBalance();
        }
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit ContractWithdrawal(owner(), amount);
    }
    
    /**
     * @dev Emergency pause (stops new predictions)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {
        // Contract can receive ETH for reward pool funding
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}