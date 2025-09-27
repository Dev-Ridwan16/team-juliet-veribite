import hre from "hardhat";
import { VeriBiteFoodPredictor } from "../typechain-types";

const { ethers } = hre;

async function main() {
  console.log("Deploying VeriBiteFoodPredictor contract...");

  // Get deployment parameters from environment or use defaults
  const minStakeWei =
    process.env.MIN_STAKE_WEI || ethers.parseEther("0.01").toString();
  const platformFeeBps = process.env.PLATFORM_FEE_BPS || "200"; // 2%

  console.log(`Min stake: ${ethers.formatEther(minStakeWei)} ETH`);
  console.log(`Platform fee: ${Number(platformFeeBps) / 100}%`);

  // Get contract factory
  const VeriBiteFoodPredictor = await ethers.getContractFactory(
    "VeriBiteFoodPredictor"
  );

  // Deploy contract
  const contract = await VeriBiteFoodPredictor.deploy(
    minStakeWei,
    platformFeeBps
  );
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`VeriBiteFoodPredictor deployed to: ${contractAddress}`);

  // Get deployer address
  const [deployer] = await ethers.getSigners();
  console.log(`Deployed by: ${deployer.address}`);
  console.log(
    `Deployer balance: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH`
  );

  // Verify contract configuration
  const deployedMinStake = await contract.minStake();
  const deployedPlatformFee = await contract.platformFeeBps();
  const owner = await contract.owner();

  console.log("\n--- Contract Configuration ---");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner: ${owner}`);
  console.log(`Min Stake: ${ethers.formatEther(deployedMinStake)} ETH`);
  console.log(
    `Platform Fee: ${deployedPlatformFee} BPS (${
      Number(deployedPlatformFee) / 100
    }%)`
  );

  // Save deployment info for backend
  const deploymentInfo = {
    address: contractAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    minStakeWei: deployedMinStake.toString(),
    platformFeeBps: deployedPlatformFee.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n--- Deployment Info for Backend ---");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contract on Etherscan (if on testnet/mainnet)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== BigInt(31337)) {
    // Not local hardhat network
    console.log("\n--- Etherscan Verification ---");
    console.log("Run the following command to verify on Etherscan:");
    console.log(
      `npx hardhat verify --network ${network.name} ${contractAddress} "${minStakeWei}" "${platformFeeBps}"`
    );
  }

  return {
    contract,
    address: contractAddress,
    deploymentInfo,
  };
}

// Handle direct execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as deployVeriBiteFoodPredictor };
