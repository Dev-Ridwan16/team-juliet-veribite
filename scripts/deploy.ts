const hre = require("hardhat");
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying VeriBitePredictor...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Deploy the contract
  const VeriBitePredictor = await hre.ethers.getContractFactory(
    "VeriBitePredictor"
  );
  const contract = await VeriBitePredictor.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("VeriBitePredictor deployed to:", contractAddress);

  // Save contract address and ABI to JSON file
  const contractInfo = {
    address: contractAddress,
    abi: JSON.parse(contract.interface.formatJson()),
    network: (await hre.ethers.provider.getNetwork()).name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Create addresses directory if it doesn't exist
  const addressesDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }

  // Save to deployments directory
  fs.writeFileSync(
    path.join(addressesDir, `VeriBitePredictor-${contractInfo.network}.json`),
    JSON.stringify(contractInfo, null, 2)
  );

  // Also save to src/lib for frontend integration
  const frontendDir = path.join(__dirname, "../src/lib");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  // Update contract.ts with the real address and ABI
  const contractTsPath = path.join(frontendDir, "contract.ts");
  if (fs.existsSync(contractTsPath)) {
    let contractTsContent = fs.readFileSync(contractTsPath, "utf8");

    // Replace the placeholder address
    contractTsContent = contractTsContent.replace(
      /export const CONTRACT_ADDRESS: Address = '0x[0-9a-fA-F]*';/,
      `export const CONTRACT_ADDRESS: Address = '${contractAddress}';`
    );

    // Replace the placeholder ABI
    contractTsContent = contractTsContent.replace(
      /export const CONTRACT_ABI = \[[\s\S]*?\];/,
      `export const CONTRACT_ABI = ${JSON.stringify(
        contractInfo.abi,
        null,
        2
      )};`
    );

    fs.writeFileSync(contractTsPath, contractTsContent);
    console.log("Updated frontend contract.ts with deployed contract info");
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${contractInfo.network}`);
  console.log(`Chain ID: ${contractInfo.chainId}`);
  console.log(
    `Gas Used: ${
      contract.deploymentTransaction()?.gasLimit?.toString() || "N/A"
    }`
  );
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Deployment saved to: deployments/VeriBitePredictor-${contractInfo.network}.json`
  );

  // Verify contract info
  console.log("\n=== Contract Verification ===");
  try {
    const minStake = await contract.MIN_STAKE();
    const totalPredictions = await contract.getTotalPredictions();
    console.log(`Minimum Stake: ${hre.ethers.formatEther(minStake)} ETH`);
    console.log(`Total Predictions: ${totalPredictions.toString()}`);
    console.log("Contract deployed successfully! ✅");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
