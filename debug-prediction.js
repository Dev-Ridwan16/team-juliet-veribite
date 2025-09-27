const hre = require("hardhat");

async function main() {
  console.log("🔍 === Debugging Prediction Submission Error ===");
  console.log("");

  try {
    const contractAddress = "0xAC93ef07c3861b071169F34D610027A79DF3B742";
    const yourWallet = "0x816E672c70CA1978D1910d104c6f7F34009E7435";
    
    console.log("📄 Contract Address:", contractAddress);
    console.log("👤 Your Wallet:", yourWallet);
    console.log("");

    // Connect to the contract
    const contract = await hre.ethers.getContractAt("VeriBitePredictor", contractAddress);
    
    // Check contract state
    console.log("🔍 Contract State Check:");
    
    const isPaused = await contract.paused();
    console.log("   ⏸️  Contract Paused:", isPaused);
    
    const minStake = await contract.MIN_STAKE();
    console.log("   💰 Minimum Stake Required:", hre.ethers.formatEther(minStake), "ETH");
    
    const maxTextLength = await contract.MAX_TEXT_LENGTH();
    console.log("   📝 Max Text Length:", maxTextLength.toString(), "characters");
    
    // Test prediction text
    const testText = "Tomato prices in Abuja will push household tomato consumption down 8% in the next 6 weeks";
    console.log("");
    console.log("📝 Your Prediction Text:");
    console.log(`   "${testText}"`);
    console.log("   Length:", testText.length, "characters");
    console.log("   ✅ Length OK:", testText.length <= maxTextLength);
    
    // Check your balance
    const [signer] = await hre.ethers.getSigners();
    const balance = await signer.provider.getBalance(signer.address);
    console.log("");
    console.log("💰 Your Wallet Balance:", hre.ethers.formatEther(balance), "ETH");
    console.log("   ✅ Sufficient for min stake:", balance >= minStake);
    
    console.log("");
    console.log("🔍 DIAGNOSIS:");
    
    if (isPaused) {
      console.log("❌ ISSUE FOUND: Contract is paused!");
      console.log("💡 SOLUTION: Contact admin to unpause contract");
    } else if (testText.length > maxTextLength) {
      console.log("❌ ISSUE FOUND: Text too long!");
      console.log("💡 SOLUTION: Shorten your prediction to under", maxTextLength, "characters");
    } else if (balance < minStake) {
      console.log("❌ ISSUE FOUND: Insufficient balance!");
      console.log("💡 SOLUTION: You need at least", hre.ethers.formatEther(minStake), "ETH");
    } else {
      console.log("✅ All checks passed - contract should accept your prediction");
      console.log("");
      console.log("🧪 TESTING PREDICTION SUBMISSION:");
      
      try {
        // Test the transaction (dry run)
        const tx = await contract.submitPrediction.staticCall(testText, {
          value: minStake,
          from: signer.address
        });
        console.log("✅ Static call successful - transaction should work");
      } catch (staticError) {
        console.log("❌ Static call failed:", staticError.message);
        
        // Decode the error
        if (staticError.message.includes("InsufficientStake")) {
          console.log("💡 SOLUTION: Send at least", hre.ethers.formatEther(minStake), "ETH with transaction");
        } else if (staticError.message.includes("TextTooLong")) {
          console.log("💡 SOLUTION: Reduce text length to under", maxTextLength, "characters");
        } else if (staticError.message.includes("Pausable: paused")) {
          console.log("💡 SOLUTION: Contract is paused - contact admin");
        } else {
          console.log("💡 Unknown error - check contract state");
        }
      }
    }
    
    console.log("");
    console.log("🔧 FRONTEND DEBUGGING:");
    console.log("   1. Make sure MetaMask is on Sepolia network");
    console.log("   2. Ensure you're sending at least 0.01 ETH with the prediction");
    console.log("   3. Check that prediction text is under 500 characters");
    console.log("   4. Verify contract is not paused");

  } catch (error) {
    console.error("❌ Debugging failed:", error.message);
  }
}

main().catch(console.error);