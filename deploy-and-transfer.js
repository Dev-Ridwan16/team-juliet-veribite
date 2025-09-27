const hre = require("hardhat");

async function main() {
  console.log("=== VeriBite Contract: Deploy & Transfer Ownership ===");
  console.log("");

  try {
    // Get accounts
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 Deployer account:", deployer.address);
    console.log("");

    // Deploy the contract
    console.log("📦 Deploying fresh VeriBitePredictor contract...");
    const VeriBitePredictor = await hre.ethers.getContractFactory("VeriBitePredictor");
    const contract = await VeriBitePredictor.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    console.log("");

    // Verify initial ownership
    const initialOwner = await contract.owner();
    console.log("👑 Initial Owner:", initialOwner);
    console.log("");
    
    // Your MetaMask wallet address
    const newOwner = "0x816e672c70ca1978d1910d104c6f7f34009e7435";
    console.log("🎯 Transferring ownership to:", newOwner);
    console.log("");
    
    // Transfer ownership
    console.log("🔄 Executing ownership transfer...");
    const tx = await contract.transferOwnership(newOwner);
    console.log("📝 Transaction Hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("⛏️  Confirmed in block:", receipt.blockNumber);
    console.log("");
    
    // Verify the transfer
    const updatedOwner = await contract.owner();
    console.log("🎉 New Contract Owner:", updatedOwner);
    console.log("✅ Transfer successful:", updatedOwner.toLowerCase() === newOwner.toLowerCase());
    console.log("");
    
    // Save updated contract info with new ownership
    const fs = require("fs");
    const path = require("path");
    
    const contractInfo = {
      address: contractAddress,
      abi: contract.interface.formatJson(),
      network: hre.network.name,
      deployer: deployer.address,
      owner: updatedOwner,
      timestamp: new Date().toISOString(),
    };

    // Update contract files
    const contractsDir = path.join(__dirname, "src", "contracts");
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(contractsDir, "VeriBitePredictor.json"),
      JSON.stringify(contractInfo, null, 2)
    );

    const backendContractsDir = path.join(__dirname, "backend", "src", "contracts");
    if (!fs.existsSync(backendContractsDir)) {
      fs.mkdirSync(backendContractsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(backendContractsDir, "VeriBitePredictor.json"),
      JSON.stringify(contractInfo, null, 2)
    );
    
    console.log("💾 Contract info updated in:");
    console.log("   - src/contracts/VeriBitePredictor.json");
    console.log("   - backend/src/contracts/VeriBitePredictor.json");
    console.log("");
    
    console.log("🎯 FINAL RESULT:");
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Your Account: ${newOwner}`);
    console.log("   Status: ✅ You now have admin privileges!");
    console.log("");
    console.log("📋 Next Steps:");
    console.log("   1. Make sure your MetaMask is connected to the Hardhat network");
    console.log("   2. Update your frontend to use the new contract address");
    console.log("   3. You can now access admin functions with your current wallet!");
    
  } catch (error) {
    console.error("❌ Process failed:", error.message);
  }
}

main().catch(console.error);