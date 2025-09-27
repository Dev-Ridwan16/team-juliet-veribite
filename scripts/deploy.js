const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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
    abi: contract.interface.formatJson(),
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  // Create contracts directory if it doesn't exist
  const contractsDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Write contract info to file
  fs.writeFileSync(
    path.join(contractsDir, "VeriBitePredictor.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("Contract info saved to src/contracts/VeriBitePredictor.json");

  // Also save to backend if it exists
  const backendContractsDir = path.join(__dirname, "..", "backend", "src", "contracts");
  if (fs.existsSync(path.join(__dirname, "..", "backend"))) {
    if (!fs.existsSync(backendContractsDir)) {
      fs.mkdirSync(backendContractsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(backendContractsDir, "VeriBitePredictor.json"),
      JSON.stringify(contractInfo, null, 2)
    );
    console.log("Contract info saved to backend/src/contracts/VeriBitePredictor.json");
  }

  // Verify contract on network explorer (if configured)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Contract verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });