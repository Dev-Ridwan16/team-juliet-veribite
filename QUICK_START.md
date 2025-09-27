# VeriBite Quick Setup Guide 🚀

## 1. Prerequisites Setup (5 minutes)

### Install MetaMask

1. Go to https://metamask.io/
2. Install MetaMask browser extension
3. Create a wallet or import existing one

### Add Hardhat Test Network to MetaMask

1. Open MetaMask → Click network dropdown → Add Network
2. Fill in these details:
   ```
   Network Name: Hardhat Local
   RPC URL: http://localhost:8545
   Chain ID: 31337
   Currency Symbol: ETH
   ```

### Import Test Accounts

Add these test accounts to MetaMask (Account → Import Account → Private Key):

**Admin Account (Has 10,000 ETH):**

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**User Account 1 (Has 10,000 ETH):**

```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

## 2. Start All Services (2 minutes)

Open 4 separate PowerShell terminals and run:

**Terminal 1 - Blockchain:**

```powershell
cd C:\Users\Dell\web3\veribite
npx hardhat node
```

✅ Wait for "Started HTTP and WebSocket JSON-RPC server"

**Terminal 2 - Database:**

```powershell
mongod
```

✅ Wait for "Waiting for connections on port 27017"

**Terminal 3 - Backend:**

```powershell
cd C:\Users\Dell\web3\veribite\backend
npm run dev
```

✅ Wait for "Server running on port 3002"

**Terminal 4 - Frontend:**

```powershell
cd C:\Users\Dell\web3\veribite
npm run dev
```

✅ Wait for "Ready on http://localhost:3001"

## 3. Start Using VeriBite (30 seconds)

1. **Open VeriBite:** Visit http://localhost:3001
2. **Connect Wallet:** Click "Connect Wallet" → Select MetaMask account
3. **Make Prediction:**
   - Enter: `"Bitcoin will exceed $50,000 by end of 2024"`
   - Stake: `0.05`
   - Click "Submit Prediction"
   - Approve in MetaMask

🎉 **You're all set!** Your prediction is now live on the blockchain.

## 4. Quick Test Admin Functions

1. **Switch to Admin Account** in MetaMask
2. **Visit Admin Panel:** http://localhost:3001/admin
3. **Mark Outcome:** Click "Mark Correct" or "Mark Incorrect" on any prediction
4. **Distribute Rewards:** Click "Distribute Reward" for correct predictions

## Common Issues & Quick Fixes

❌ **"Connect Wallet" not working?**
→ Refresh page, ensure MetaMask is unlocked

❌ **Transaction failing?**
→ Switch to Hardhat Local network in MetaMask

❌ **Backend not connecting?**
→ Check MongoDB is running with `mongod`

❌ **Page not loading?**
→ Ensure all 4 terminals are running without errors

## URLs to Bookmark

- **VeriBite App:** http://localhost:3001
- **Admin Panel:** http://localhost:3001/admin
- **View All Predictions:** http://localhost:3001/predictions
- **Backend API:** http://localhost:3002/api/predictions

**Need the full guide?** See `USER_GUIDE.md` for detailed instructions!
