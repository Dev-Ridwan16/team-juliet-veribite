// Simple contract owner checker without Hardhat dependencies
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

console.log('=== VERiBITE CONTRACT OWNER CHECK ===');
console.log('Contract Address:', contractAddress);
console.log('Your Current Wallet:', '0x816e672c70ca1978d1910d104c6f7f34009e7435');
console.log('');

console.log('Available Hardhat Test Accounts:');
const accounts = [
  { index: 0, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', key: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' },
  { index: 1, address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', key: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' },
  { index: 2, address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', key: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' },
  { index: 3, address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', key: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' },
  { index: 4, address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', key: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' }
];

accounts.forEach(account => {
  console.log(`Account #${account.index}: ${account.address}`);
  console.log(`Private Key: ${account.key}`);
  console.log('');
});

console.log('=== SOLUTION ===');
console.log('The contract was likely deployed by Account #0 (the first Hardhat account).');
console.log('To access the admin panel, you need to:');
console.log('');
console.log('1. In MetaMask, click "Import Account"');
console.log('2. Use this private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
console.log('3. This will import Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
console.log('4. Switch to this account in MetaMask');
console.log('5. Refresh your admin page');
console.log('');
console.log('⚠️  WARNING: These are test accounts only! Never use on mainnet!');