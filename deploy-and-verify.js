const hre = require("hardhat");

async function main() {
  console.log("=== VeriBite Contract Deployment & Verification ===");
  console.log("");

  try {
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 Deployer account:", deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    console.log("");

    // Deploy the contract
    console.log("📦 Deploying VeriBitePredictor...");
    const VeriBitePredictor = await hre.ethers.getContractFactory("VeriBitePredictor");
    const contract = await VeriBitePredictor.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    console.log("");

    // Verify ownership immediately after deployment
    console.log("🔍 Verifying contract ownership...");
    const owner = await contract.owner();
    console.log("👑 Contract owner:", owner);
    console.log("🤝 Deployer matches owner:", owner.toLowerCase() === deployer.address.toLowerCase());
    console.log("");

    // Test admin functions
    console.log("🧪 Testing admin functions...");
    try {
      const isPaused = await contract.paused();
      console.log("⏸️  Contract paused:", isPaused);
      
      // Test ownership-only function
      const totalPredictions = await contract.getTotalPredictions();
      console.log("📊 Total predictions:", totalPredictions.toString());
      
      console.log("✅ Admin access confirmed!");
      console.log("");
    } catch (error) {
      console.log("❌ Admin access test failed:", error.message);
    }

    // Show available test accounts
    console.log("🔧 Available Test Accounts:");
    const accounts = await hre.ethers.getSigners();
    accounts.slice(0, 5).forEach((account, i) => {
      console.log(`   Account ${i}: ${account.address}`);
    });
    console.log("");

    console.log("🎯 SOLUTION FOR ACCESS DENIED:");
    console.log("   To access admin functions, use this account in MetaMask:");
    console.log(`   Address: ${owner}`);
    console.log("   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    console.log("");
    console.log("⚠️  WARNING: This is a test account only - never use on mainnet!");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch(console.error);