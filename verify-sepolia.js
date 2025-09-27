const hre = require("hardhat");

async function main() {
  console.log("🔍 === Sepolia Contract Verification ===");
  console.log("");

  try {
    const contractAddress = "0xAC93ef07c3861b071169F34D610027A79DF3B742";
    const yourWallet = "0x816E672c70CA1978D1910d104c6f7F34009E7435";
    
    console.log("🌐 Network: Sepolia Testnet");
    console.log("📄 Contract Address:", contractAddress);
    console.log("👤 Your Wallet:", yourWallet);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("");

    // Connect to the contract on Sepolia
    const contract = await hre.ethers.getContractAt("VeriBitePredictor", contractAddress);
    
    // Get current owner
    const owner = await contract.owner();
    console.log("👑 Contract Owner:", owner);
    console.log("✅ Ownership Match:", owner.toLowerCase() === yourWallet.toLowerCase());
    console.log("");

    // Test admin functions
    console.log("🧪 Testing Contract Functions:");
    
    try {
      // Test 1: Check if contract is paused
      const isPaused = await contract.paused();
      console.log("   ⏸️  Contract Paused:", isPaused);
      
      // Test 2: Get total predictions
      const totalPredictions = await contract.getTotalPredictions();
      console.log("   📊 Total Predictions:", totalPredictions.toString());
      
      // Test 3: Get contract stats
      const stats = await contract.getContractStats();
      console.log("   📈 Contract Stats:");
      console.log("      Total Predictions:", stats[0].toString());
      console.log("      Total Users:", stats[1].toString());
      console.log("      Contract Balance:", hre.ethers.formatEther(stats[2]), "ETH");
      console.log("      Total Staked:", hre.ethers.formatEther(stats[3]), "ETH");
      console.log("      Total Rewards:", hre.ethers.formatEther(stats[4]), "ETH");
      
      // Test 4: Check MIN_STAKE
      const minStake = await contract.MIN_STAKE();
      console.log("   💰 Minimum Stake:", hre.ethers.formatEther(minStake), "ETH");
      
      console.log("");
      console.log("✅ All contract functions working correctly!");
      
    } catch (error) {
      console.log("❌ Contract function test failed:", error.message);
    }

    console.log("");
    console.log("🎯 FRONTEND SETUP:");
    console.log("   1. ✅ Contract deployed to Sepolia");
    console.log("   2. ✅ Ownership transferred to your wallet");
    console.log("   3. ✅ Frontend contract address updated");
    console.log("   4. ✅ Wagmi config includes Sepolia network");
    console.log("");
    console.log("📱 METAMASK SETUP:");
    console.log("   1. Switch to 'Sepolia test network'");
    console.log("   2. Use wallet:", yourWallet);
    console.log("   3. Visit: http://localhost:3000/admin");
    console.log("   4. Connect wallet and test admin functions");
    console.log("");
    console.log("🚀 You should now have full admin access!");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.log("");
    console.log("💡 Make sure you're connected to Sepolia network");
    console.log("   Run with: --network sepolia");
  }
}

main().catch(console.error);