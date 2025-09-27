const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌐 === VeriBite Sepolia Deployment ===");
  console.log("");

  try {
    // Check network
    console.log("🔗 Network:", hre.network.name);
    console.log("🌍 Chain ID:", hre.network.config.chainId);
    console.log("");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 Deployer account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.log("");
      console.log("❌ No ETH balance! You need Sepolia testnet ETH.");
      console.log("🚰 Get testnet ETH from: https://sepoliafaucet.com/");
      console.log("💳 Send to your address:", deployer.address);
      return;
    }
    console.log("");

    // Deploy the contract
    console.log("📦 Deploying VeriBitePredictor to Sepolia...");
    const VeriBitePredictor = await hre.ethers.getContractFactory("VeriBitePredictor");
    
    console.log("⏳ Deploying contract...");
    const contract = await VeriBitePredictor.deploy();
    
    console.log("⏳ Waiting for deployment confirmation...");
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
    console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/tx/" + tx.hash);
    
    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("⛏️  Confirmed in block:", receipt.blockNumber);
    console.log("");
    
    // Verify the transfer
    const updatedOwner = await contract.owner();
    console.log("🎉 New Contract Owner:", updatedOwner);
    console.log("✅ Transfer successful:", updatedOwner.toLowerCase() === newOwner.toLowerCase());
    console.log("");
    
    // Save updated contract info
    const contractInfo = {
      address: contractAddress,
      abi: contract.interface.formatJson(),
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      owner: updatedOwner,
      deploymentTransaction: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      etherscanUrl: `https://sepolia.etherscan.io/address/${contractAddress}`,
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
    
    console.log("🎯 === DEPLOYMENT SUCCESSFUL ===");
    console.log(`📄 Contract Address: ${contractAddress}`);
    console.log(`👤 Your Account: ${newOwner}`);
    console.log(`🌐 Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId})`);
    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log(`📝 Transaction: https://sepolia.etherscan.io/tx/${receipt.hash}`);
    console.log("");
    
    console.log("📋 Next Steps:");
    console.log("   1. ✅ Your contract is now deployed to Sepolia!");
    console.log("   2. 🦊 Switch MetaMask to Sepolia Test Network");
    console.log("   3. 🌐 Visit your frontend and connect wallet");
    console.log("   4. 🔧 You should now have admin privileges!");
    console.log("");
    console.log("⚡ No more localhost connection issues!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("");
      console.log("💡 You need Sepolia testnet ETH to deploy.");
      console.log("🚰 Get free testnet ETH: https://sepoliafaucet.com/");
      console.log("💳 Your address:", (await hre.ethers.getSigners())[0].address);
    }
  }
}

main().catch(console.error);