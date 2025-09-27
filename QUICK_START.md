# VeriBite Food Prediction Platform - Quick Start 🍽️

## 1. Production Setup (2 minutes) - Recommended

### Install Web3 Wallet

1. Install MetaMask: https://metamask.io/
2. Create wallet or import existing one
3. Secure your seed phrase safely

### Add Sepolia Testnet to MetaMask

1. Open MetaMask → Networks → Add Network
2. Configure Sepolia:
   ```
   Network Name: Sepolia Testnet
   RPC URL: https://rpc.sepolia.org
   Chain ID: 11155111
   Currency Symbol: ETH
   Block Explorer: https://sepolia.etherscan.io
   ```

### Get Test ETH

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Receive test ETH for making food predictions

## 2. Start Predicting Food Trends (30 seconds)

1. **Visit VeriBite:** Go to the deployed platform URL
2. **Connect Wallet:** Click "Connect Wallet" → Choose MetaMask
3. **Make Food Prediction:**
   - Category: Select "🥘 Food Trends"
   - Prediction: `"Korean corn dogs will become the top viral street food in major US cities by Q2 2025"`
   - Stake: `0.01 ETH`
   - Click "Submit Prediction"
   - Approve transaction in MetaMask

🎉 **You're making food predictions!** Your insight is now on the blockchain.

## 3. Explore Food Categories

### 🥘 Food Trends Examples:

- "Plant-based seafood will capture 20% of the seafood market by 2025"
- "Korean corn dogs will appear in 1000+ US restaurants within 6 months"

### 🍕 Restaurant Success Examples:

- "Ghost kitchens will represent 40% of delivery orders in NYC by year-end"
- "The new sushi chain will expand to 50+ locations within 12 months"

### 🛒 Consumption Patterns Examples:

- "Oat milk sales will surpass almond milk in coffee shops by summer 2025"
- "Meal kit subscriptions will grow 50% as remote work continues"

### � Health & Nutrition Examples:

- "Functional mushrooms will appear in 500+ new products this year"
- "Intermittent fasting apps will gain 10M+ new users by 2025"

## 4. For Contract Owners - Admin Functions

1. **Access Admin Panel:** Visit `/admin` page (owner address only)
2. **Review Predictions:** View all community food predictions
3. **Verify Outcomes:** Mark predictions as correct/incorrect with evidence
4. **Distribute Rewards:** Send ETH rewards to accurate predictors

## Platform URLs & Information

- **Smart Contract:** `0xAC93ef07c3861b071169F34D610027A79DF3B742` (Sepolia)
- **Backend API:** `https://team-juliet-veribite-production.up.railway.app`
- **Network:** Ethereum Sepolia Testnet
- **Etherscan:** [View Contract](https://sepolia.etherscan.io/address/0xAC93ef07c3861b071169F34D610027A79DF3B742)

## Local Development (Optional)

For developers wanting to run locally:

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
