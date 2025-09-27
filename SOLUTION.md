# 🔧 Complete Solution: Fix "Access Denied" Issue

## Problem

You're getting "Access Denied" because your frontend is not connecting to the correct network where your contract is deployed.

## ✅ Solution Steps

### 1. **Add Hardhat Network to MetaMask**

- Open MetaMask
- Click "Network" dropdown (top center)
- Click "Add Network"
- Click "Add a network manually"
- Enter these details:
  ```
  Network Name: Hardhat Local
  New RPC URL: http://127.0.0.1:8545
  Chain ID: 1337
  Currency Symbol: ETH
  Block Explorer URL: (leave blank)
  ```
- Click "Save"

### 2. **Start Hardhat Network (KEEP RUNNING)**

```bash
npx hardhat node
```

⚠️ **Important**: Keep this terminal running - don't close it!

### 3. **Deploy Contract to the Running Network**

In a NEW terminal window:

```bash
npx hardhat run deploy-and-transfer.js --network localhost
```

### 4. **Switch MetaMask Network**

- In MetaMask, select "Hardhat Local" network
- Make sure you're using wallet: `0x816e672c70ca1978d1910d104c6f7f34009e7435`

### 5. **Restart Your Frontend**

```bash
npm run dev
```

## ✅ Your Contract Details

- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Owner (You)**: `0x816e672c70ca1978d1910d104c6f7f34009e7435`
- **Network**: Hardhat Local (Chain ID: 1337)

## 🔍 Verification

After completing these steps:

1. Open your admin panel
2. Check if you can see admin functions
3. You should no longer see "Access Denied"

## ⚠️ Important Notes

- The Hardhat network must be running for the contract to work
- Make sure MetaMask is on "Hardhat Local" network
- Your wallet address must match the contract owner

## 🚨 If Still Having Issues

Run this verification script:

```bash
npx hardhat run verify-ownership.js --network localhost
```

The wagmi configuration has been updated to include the Hardhat network, so your frontend should now be able to connect to it properly.
