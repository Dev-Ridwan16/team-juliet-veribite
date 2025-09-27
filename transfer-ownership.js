const hre = require("hardhat");

async function main() {
  console.log("=== VeriBite Contract Ownership Transfer ===");
  console.log("");

  try {
    // Get the contract instance
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    console.log("📄 Contract Address:", contractAddress);
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 Current Owner (Deployer):", deployer.address);
    
    const contract = await hre.ethers.getContractAt("VeriBitePredictor", contractAddress);
    
    // Verify current ownership
    const currentOwner = await contract.owner();
    console.log("👑 Contract Owner (from contract):", currentOwner);
    console.log("✅ Owner verification:", currentOwner.toLowerCase() === deployer.address.toLowerCase());
    console.log("");
    
    // New owner address (your MetaMask wallet)
    const newOwner = "0x816e672c70ca1978d1910d104c6f7f34009e7435";
    console.log("🎯 New Owner Address:", newOwner);
    console.log("");
    
    // Transfer ownership
    console.log("🔄 Transferring ownership...");
    const tx = await contract.transferOwnership(newOwner);
    console.log("📝 Transaction Hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("⛏️  Transaction confirmed in block:", receipt.blockNumber);
    console.log("");
    
    // Verify the transfer
    const updatedOwner = await contract.owner();
    console.log("🎉 New Contract Owner:", updatedOwner);
    console.log("✅ Transfer successful:", updatedOwner.toLowerCase() === newOwner.toLowerCase());
    console.log("");
    
    console.log("🎯 RESULT:");
    console.log(`   Your account (${newOwner}) now has admin privileges!`);
    console.log("   You can now access the admin panel with your current MetaMask account.");
    console.log("");
    console.log("📋 Summary:");
    console.log(`   Old Owner: ${currentOwner}`);
    console.log(`   New Owner: ${updatedOwner}`);
    console.log(`   Contract: ${contractAddress}`);
    
  } catch (error) {
    console.error("❌ Ownership transfer failed:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("");
      console.log("💡 This error means you're not the current owner.");
      console.log("   Only the current owner can transfer ownership.");
      console.log("   Make sure you're using the correct account in MetaMask.");
    }
  }
}

main().catch(console.error);