const hre = require('hardhat');

async function main() {
  try {
    const contract = await hre.ethers.getContractAt(
      'VeriBitePredictor', 
      '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    );
    
    const owner = await contract.owner();
    console.log('Contract owner:', owner);
    
    const accounts = await hre.ethers.getSigners();
    console.log('Available accounts:');
    accounts.slice(0, 5).forEach((account, i) => {
      console.log(`Account ${i}: ${account.address}`);
    });
    
    // Check if any account is the owner
    const ownerAccount = accounts.find(acc => acc.address.toLowerCase() === owner.toLowerCase());
    if (ownerAccount) {
      console.log(`Owner found in accounts at index: ${accounts.indexOf(ownerAccount)}`);
    } else {
      console.log('Owner not found in available accounts');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);