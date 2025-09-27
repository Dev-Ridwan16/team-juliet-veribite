// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VeriBitePredictor
 * @dev Smart contract for food consumption predictions with staking mechanism
 * @notice Users can submit predictions with ETH stakes and earn rewards for correct predictions
 */
contract VeriBitePredictor is Ownable, ReentrancyGuard, Pausable {
    
    // Minimum stake required to submit a prediction
    uint256 public constant MIN_STAKE = 0.01 ether;
    
    // Maximum prediction text length
    uint256 public constant MAX_TEXT_LENGTH = 500;
    
    // Prediction status enumeration
    enum Status {
        Pending,    // 0 - Awaiting outcome
        Correct,    // 1 - Marked as correct
        Incorrect   // 2 - Marked as incorrect
    }
    
    // Prediction structure
    struct Prediction {
        uint256 id;
        address user;
        string text;
        uint256 timestamp;
        uint256 stake;
        Status status;
    }
    
    // State variables
    uint256 private _predictionIdCounter;
    mapping(uint256 => Prediction) public predictions;
    uint256[] public predictionIds;
    
    // User-related mappings
    mapping(address => uint256[]) public userPredictions;
    mapping(address => uint256) public userRewards;
    
    // Contract balance tracking
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    
    // Events
    event PredictionSubmitted(
        address indexed user,
        uint256 indexed id,
        string text,
        uint256 stake
    );
    
    event OutcomeResolved(
        uint256 indexed id,
        bool correct,
        address indexed user
    );
    
    event RewardDistributed(
        address indexed user,
        uint256 indexed predictionId,
        uint256 amount
    );
    
    event StakeWithdrawn(
        address indexed user,
        uint256 indexed predictionId,
        uint256 amount
    );
    
    // Custom errors
    error InsufficientStake();
    error TextTooLong();
    error PredictionNotFound();
    error PredictionAlreadyResolved();
    error OnlyPredictionOwner();
    error NoRewardsAvailable();
    error TransferFailed();
    error InvalidStatus();
    
    /**
     * @dev Constructor sets the deployer as the initial owner
     */
    constructor() Ownable(msg.sender) {
        _predictionIdCounter = 1;
    }
    
    /**
     * @dev Submit a new prediction with ETH stake
     * @param text The prediction text
     */
    function submitPrediction(string calldata text) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        if (msg.value < MIN_STAKE) {
            revert InsufficientStake();
        }
        
        if (bytes(text).length > MAX_TEXT_LENGTH) {
            revert TextTooLong();
        }
        
        uint256 predictionId = _predictionIdCounter++;
        
        predictions[predictionId] = Prediction({
            id: predictionId,
            user: msg.sender,
            text: text,
            timestamp: block.timestamp,
            stake: msg.value,
            status: Status.Pending
        });
        
        predictionIds.push(predictionId);
        userPredictions[msg.sender].push(predictionId);
        totalStaked += msg.value;
        
        emit PredictionSubmitted(msg.sender, predictionId, text, msg.value);
    }
    
    /**
     * @dev Mark a prediction outcome (only owner)
     * @param id The prediction ID
     * @param correct Whether the prediction was correct
     */
    function markOutcome(uint256 id, bool correct) 
        external 
        onlyOwner 
        nonReentrant 
    {
        Prediction storage prediction = predictions[id];
        
        if (prediction.id == 0) {
            revert PredictionNotFound();
        }
        
        if (prediction.status != Status.Pending) {
            revert PredictionAlreadyResolved();
        }
        
        prediction.status = correct ? Status.Correct : Status.Incorrect;
        
        emit OutcomeResolved(id, correct, prediction.user);
    }
    
    /**
     * @dev Distribute reward to a correct prediction (only owner)
     * @param id The prediction ID
     */
    function distributeReward(uint256 id) 
        external 
        onlyOwner 
        nonReentrant 
    {
        Prediction storage prediction = predictions[id];
        
        if (prediction.id == 0) {
            revert PredictionNotFound();
        }
        
        if (prediction.status != Status.Correct) {
            revert InvalidStatus();
        }
        
        // Calculate reward (2x the stake)
        uint256 rewardAmount = prediction.stake * 2;
        
        // Ensure contract has enough balance
        require(address(this).balance >= rewardAmount, "Insufficient contract balance");
        
        // Add to user rewards
        userRewards[prediction.user] += rewardAmount;
        totalRewardsDistributed += rewardAmount;
        
        // Transfer reward
        (bool success, ) = payable(prediction.user).call{value: rewardAmount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit RewardDistributed(prediction.user, id, rewardAmount);
    }
    
    /**
     * @dev Get all predictions
     * @return Array of all predictions
     */
    function getAllPredictions() external view returns (Prediction[] memory) {
        Prediction[] memory allPredictions = new Prediction[](predictionIds.length);
        
        for (uint256 i = 0; i < predictionIds.length; i++) {
            allPredictions[i] = predictions[predictionIds[i]];
        }
        
        return allPredictions;
    }
    
    /**
     * @dev Get predictions by user
     * @param user The user address
     * @return Array of user's predictions
     */
    function getUserPredictions(address user) external view returns (Prediction[] memory) {
        uint256[] memory userIds = userPredictions[user];
        Prediction[] memory userPreds = new Prediction[](userIds.length);
        
        for (uint256 i = 0; i < userIds.length; i++) {
            userPreds[i] = predictions[userIds[i]];
        }
        
        return userPreds;
    }
    
    /**
     * @dev Get total number of predictions
     * @return Total prediction count
     */
    function getTotalPredictions() external view returns (uint256) {
        return predictionIds.length;
    }
    
    /**
     * @dev Get predictions by status
     * @param status The status to filter by
     * @return Array of predictions with the specified status
     */
    function getPredictionsByStatus(Status status) external view returns (Prediction[] memory) {
        // First, count predictions with the status
        uint256 count = 0;
        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (predictions[predictionIds[i]].status == status) {
                count++;
            }
        }
        
        // Create array and populate
        Prediction[] memory statusPredictions = new Prediction[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < predictionIds.length; i++) {
            if (predictions[predictionIds[i]].status == status) {
                statusPredictions[index] = predictions[predictionIds[i]];
                index++;
            }
        }
        
        return statusPredictions;
    }
    
    /**
     * @dev Withdraw incorrect prediction stakes (only owner)
     * @param id The prediction ID
     */
    function withdrawIncorrectStake(uint256 id) 
        external 
        onlyOwner 
        nonReentrant 
    {
        Prediction storage prediction = predictions[id];
        
        if (prediction.id == 0) {
            revert PredictionNotFound();
        }
        
        if (prediction.status != Status.Incorrect) {
            revert InvalidStatus();
        }
        
        uint256 stakeAmount = prediction.stake;
        prediction.stake = 0; // Prevent re-entrancy
        
        totalStaked -= stakeAmount;
        
        // Transfer stake to contract owner
        (bool success, ) = payable(owner()).call{value: stakeAmount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit StakeWithdrawn(prediction.user, id, stakeAmount);
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }
    
    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract statistics
     * @return totalPredictions Total number of predictions
     * @return totalUsers Number of unique users
     * @return contractBalance Current contract balance
     * @return totalStake Total amount staked
     * @return totalRewards Total rewards distributed
     */
    function getContractStats() external view returns (
        uint256 totalPredictions,
        uint256 totalUsers,
        uint256 contractBalance,
        uint256 totalStake,
        uint256 totalRewards
    ) {
        // Count unique users
        uint256 userCount = 0;
        address[] memory seenUsers = new address[](predictionIds.length);
        
        for (uint256 i = 0; i < predictionIds.length; i++) {
            address user = predictions[predictionIds[i]].user;
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
        
        return (
            predictionIds.length,
            userCount,
            address(this).balance,
            totalStaked,
            totalRewardsDistributed
        );
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Allow contract to receive ETH
    }
}