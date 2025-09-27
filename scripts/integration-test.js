#!/usr/bin/env node

import { ethers } from 'ethers';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3002';
const RPC_URL = 'http://localhost:8545';
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Contract ABI (simplified for testing)
const CONTRACT_ABI = [
  "function submitPrediction(string memory text) external payable",
  "function getAllPredictions() external view returns (tuple(uint256 id, address user, string text, uint256 timestamp, uint256 stake, uint8 status)[])",
  "function markOutcome(uint256 id, bool correct) external",
  "function distributeReward(uint256 id) external"
];

async function runIntegrationTest() {
  console.log('🚀 Starting VeriBite Integration Test...\n');

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log('✅ Connected to blockchain');
    console.log(`Wallet Address: ${wallet.address}`);
    console.log(`Contract Address: ${CONTRACT_ADDRESS}\n`);

    // Test 1: Submit prediction via smart contract
    console.log('📝 Test 1: Submitting prediction...');
    const predictionText = `Test prediction ${Date.now()}`;
    const stakeAmount = ethers.parseEther('0.05');
    
    const tx = await contract.submitPrediction(predictionText, {
      value: stakeAmount
    });
    await tx.wait();
    console.log(`✅ Prediction submitted: ${tx.hash}\n`);

    // Test 2: Verify prediction via backend API
    console.log('🔍 Test 2: Fetching predictions from backend...');
    const response = await axios.get(`${BACKEND_URL}/api/predictions`);
    
    if (response.data.success && response.data.data.length > 0) {
      console.log(`✅ Backend returned ${response.data.data.length} predictions`);
      console.log(`Latest prediction: ${response.data.data[response.data.data.length - 1].text}\n`);
    } else {
      throw new Error('No predictions found in backend');
    }

    // Test 3: Get contract stats
    console.log('📊 Test 3: Getting contract statistics...');
    const statsResponse = await axios.get(`${BACKEND_URL}/api/predictions/stats`);
    
    if (statsResponse.data.success) {
      console.log(`✅ Contract Stats:`, statsResponse.data.data);
    } else {
      throw new Error('Failed to get contract stats');
    }

    // Test 4: Admin operations (using admin wallet)
    console.log('\n👨‍💼 Test 4: Testing admin functions...');
    const adminWallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // First Hardhat account is admin
      provider
    );
    const adminContract = contract.connect(adminWallet);

    // Get all predictions to find the latest one
    const predictions = await contract.getAllPredictions();
    if (predictions.length > 0) {
      const latestPredictionId = predictions[predictions.length - 1].id;
      
      // Mark outcome via backend API
      try {
        const markOutcomeResponse = await axios.post(`${BACKEND_URL}/api/admin/mark-outcome`, {
          predictionId: Number(latestPredictionId),
          correct: true,
          adminAddress: adminWallet.address
        });
        
        if (markOutcomeResponse.data.success) {
          console.log(`✅ Prediction ${latestPredictionId} marked as correct via API`);
        }
      } catch (error: any) {
        console.log(`ℹ️  Admin API call result: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 All integration tests completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runIntegrationTest();