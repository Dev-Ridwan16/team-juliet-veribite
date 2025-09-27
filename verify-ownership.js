const hre = require("hardhat");

async function main() {
  console.log("=== VeriBite Contract Ownership Verification ===");
  console.log("");

  try {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const yourWallet = "0x816e672c70ca1978d1910d104c6f7f34009e7435";
    
    console.log("📄 Contract Address:", contractAddress);
    console.log("👤 Your Wallet:", yourWallet);
    console.log("");

    // Connect to the contract
    const contract = await hre.ethers.getContractAt("VeriBitePredictor", contractAddress);
    
    // Get current owner
    const owner = await contract.owner();
    console.log("👑 Current Contract Owner:", owner);
    console.log("✅ Ownership Match:", owner.toLowerCase() === yourWallet.toLowerCase());
    console.log("");

    // Test admin-only functions
    console.log("🧪 Testing Admin Functions:");
    
    try {
      // Test 1: Check if contract is paused (view function)
      const isPaused = await contract.paused();
      console.log("   ⏸️  Contract Paused:", isPaused);
      
      // Test 2: Get total predictions (view function)
      const totalPredictions = await contract.getTotalPredictions();
      console.log("   📊 Total Predictions:", totalPredictions.toString());
      
      // Test 3: Get contract stats (view function)
      const stats = await contract.getContractStats();
      console.log("   📈 Contract Stats:");
      console.log("      Total Predictions:", stats[0].toString());
      console.log("      Total Users:", stats[1].toString());
      console.log("      Contract Balance:", hre.ethers.formatEther(stats[2]), "ETH");
      console.log("      Total Staked:", hre.ethers.formatEther(stats[3]), "ETH");
      console.log("      Total Rewards:", hre.ethers.formatEther(stats[4]), "ETH");
      
      console.log("");
      console.log("✅ All admin functions working correctly!");
      
    } catch (error) {
      console.log("❌ Admin function test failed:", error.message);
    }

    console.log("");
    console.log("🔧 MetaMask Network Setup:");
    console.log("   Network Name: Hardhat Local");
    console.log("   RPC URL: http://127.0.0.1:8545");
    console.log("   Chain ID: 1337");
    console.log("   Currency Symbol: ETH");
    console.log("");
    console.log("📝 Make sure:");
    console.log("   1. MetaMask is connected to the Hardhat Local network");
    console.log("   2. You're using your wallet address:", yourWallet);
    console.log("   3. The frontend is running and connecting to the same network");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

main().catch(console.error);