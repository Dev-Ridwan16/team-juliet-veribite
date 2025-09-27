# VeriBite Food Prediction Platform - User Guide 🍽️

## Welcome to VeriBite - Decentralized Food Predictions

VeriBite is the premier blockchain-powered platform for food industry predictions. Make informed predictions about food trends, restaurant success, consumption patterns, and culinary outcomes while earning ETH rewards for accurate insights.

---

## 🚀 Quick Start Guide

### What You'll Need

- Web browser with MetaMask or compatible Web3 wallet
- ETH for staking on predictions (Sepolia testnet ETH for testing)
- Passion for food trends and industry insights!

### Getting Started in 3 Steps

1. **Visit VeriBite**: Go to the deployed platform or `http://localhost:3000` (development)
2. **Connect Your Wallet**: Click "Connect Wallet" and approve the connection
3. **Start Predicting**: Browse food categories and make your first prediction!

---

## 🍽️ Food Prediction Categories

### 🥘 Food Trends & Viral Foods

Predict the next big food trend, viral recipe, or ingredient that will dominate social media and restaurants.

**Example Predictions:**

- "Korean corn dogs will be the top street food trend in US cities by Q2 2025"
- "Plant-based seafood will capture 15% of the seafood market within 12 months"
- "Oat milk will surpass almond milk in coffee shop adoption by summer 2025"

### 🍕 Restaurant Success Predictions

Forecast restaurant performance, new location success, or chain expansion outcomes.

**Example Predictions:**

- "The new Italian restaurant on Main Street will receive 4+ stars within 60 days"
- "Fast-casual Mediterranean chains will expand to 500+ locations this year"
- "Ghost kitchens will represent 30% of delivery orders in major cities by 2025"

### 🛒 Consumption & Market Predictions

Predict food sales, dietary shifts, market demand, and consumer behavior changes.

**Example Predictions:**

- "Organic food sales will increase 25% during the next holiday season"
- "Meal kit subscriptions will grow 40% as remote work continues"
- "Plant-based protein sales will exceed $2B globally by year-end"

### 🍎 Health & Nutrition Forecasts

Forecast health food trends, supplement popularity, and wellness movement adoption.

**Example Predictions:**

- "Ashwagandha will become mainstream in 50+ consumer products"
- "Intermittent fasting will be practiced by 100M+ people worldwide"
- "Functional mushrooms will appear in 200+ new food products"

---

## 🔧 Platform Setup

### For Production Use (Recommended)

#### 1. MetaMask Sepolia Network Setup

**Add Sepolia Testnet:**

- Open MetaMask → Networks → Add Network
- **Network Name:** `Sepolia Testnet`
- **RPC URL:** `https://sepolia.infura.io/v3/YOUR_KEY` or `https://rpc.sepolia.org`
- **Chain ID:** `11155111`
- **Currency Symbol:** `ETH`
- **Block Explorer:** `https://sepolia.etherscan.io`

**Get Test ETH:**

- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address to receive test ETH
- Use test ETH to make food predictions on the platform

#### 2. Contract Information

- **VeriBite Food Predictor Contract:** `0xAC93ef07c3861b071169F34D610027A79DF3B742`
- **Network:** Ethereum Sepolia Testnet
- **Backend API:** `https://team-juliet-veribite-production.up.railway.app`

### For Local Development

Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

```

#### 2. Local Development Setup (Optional)

For developers who want to run the platform locally:

**Add Hardhat Test Network:**
- **Network Name:** `Hardhat Local`
- **RPC URL:** `http://localhost:8545`
- **Chain ID:** `31337`
- **Currency Symbol:** `ETH`

---

## 📱 How to Use VeriBite Food Predictions

### 1. Connecting Your Wallet 🔗

1. **Visit the Platform**
   - Go to the deployed VeriBite URL or http://localhost:3000 (development)
   - You'll see the food prediction homepage

2. **Connect Your Web3 Wallet**
   - Click the "Connect Wallet" button in the navigation
   - Choose your preferred wallet (MetaMask, WalletConnect, etc.)
   - Approve the connection request
   - Ensure you're on Sepolia testnet

3. **Verify Connection**
   - Your wallet address will appear in the header
   - You'll see your ETH balance
   - The food prediction forms will become available

### 2. Making Food Predictions 🍽️

1. **Navigate to Predictions Page**
   - Click "Make Predictions" in the navigation
   - Or scroll to the prediction form on the homepage

2. **Choose Your Food Prediction Category**
   - **🥘 Food Trends**: Viral foods, ingredient popularity, cooking methods
   - **🍕 Restaurant Success**: New openings, chain expansion, ratings
   - **🛒 Consumption Patterns**: Sales forecasts, dietary shifts, market demand
   - **🍎 Health & Nutrition**: Wellness trends, supplement adoption, diet popularity

3. **Write Your Detailed Prediction**
   - Be specific about timeframes (e.g., "within 6 months", "by Q2 2025")
   - Include measurable outcomes (e.g., "25% market share", "500+ locations")
   - Provide reasoning for your prediction
   - Keep it under 500 characters

4. **Set Your Confidence Stake**
   - Choose how much ETH to stake (minimum 0.001 ETH)
   - Higher stakes show more confidence and earn bigger rewards
   - Consider your prediction confidence when staking

5. **Submit Your Prediction**
   - Review your prediction details
   - Click "Submit Prediction"
   - Approve the transaction in your wallet
   - Wait for blockchain confirmation

```

Example Prediction:
"Bitcoin will reach $100,000 by December 31, 2024"

Stake Amount: 0.05 ETH

```

3. **Submit Your Prediction**

- Click "Submit Prediction"
- MetaMask will popup for transaction approval
- Review the gas fees and confirm
- Wait for transaction confirmation

4. **Confirmation**
- You'll see a success message
- Your prediction will appear in the predictions feed
- Transaction hash will be provided for verification

### 3. Viewing Predictions

1. **All Predictions Page**

- Click "View Predictions" in the navigation
- See all predictions from all users
- Filter by status: Pending, Correct, Incorrect

2. **Prediction Details**
Each prediction shows:

- **Text:** The prediction statement
- **User:** Wallet address of predictor (abbreviated)
- **Stake:** Amount of ETH staked
- **Date:** When prediction was made
- **Status:** Pending/Correct/Incorrect
- **Reward:** Potential or earned reward

3. **Your Predictions**
- Connect your wallet to see your predictions highlighted
- Track your prediction history and rewards

### 4. Understanding Rewards

**How Rewards Work:**

- Make a prediction with a minimum stake (0.01 ETH)
- Admin evaluates predictions when outcomes are known
- Correct predictions earn rewards from the pool of incorrect predictions
- Rewards are distributed proportionally based on stake amounts

**Reward Calculation:**

```

Your Reward = (Your Stake / Total Correct Stakes) × Total Incorrect Stakes Pool

````

**Example:**

- You stake 0.1 ETH on a correct prediction
- Total correct stakes: 0.5 ETH
- Total incorrect stakes: 0.3 ETH
- Your reward: (0.1 / 0.5) × 0.3 = 0.06 ETH + your original 0.1 ETH = 0.16 ETH total

---

## 👨‍💼 Admin Functions

### Accessing Admin Panel

1. **Connect Admin Wallet**

   - Use the admin account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Navigate to http://localhost:3001/admin

2. **Admin Dashboard**
   - View all predictions
   - See contract statistics
   - Manage prediction outcomes

### Marking Prediction Outcomes

1. **Review Predictions**

   - Admin panel shows all pending predictions
   - Each prediction has "Mark Correct" and "Mark Incorrect" buttons

2. **Mark Outcome**

   - Click appropriate button based on real-world outcome
   - Confirm the transaction in MetaMask
   - Status will update immediately

3. **Distribute Rewards**
   - After marking outcomes, rewards can be distributed
   - Click "Distribute Reward" for correct predictions
   - Users can then withdraw their rewards

### Contract Statistics

- **Total Predictions:** Number of predictions made
- **Total Users:** Unique users who made predictions
- **Contract Balance:** Total ETH held in contract
- **Total Staked:** Sum of all stakes
- **Total Rewards:** Amount distributed as rewards

---

## 💡 Tips for Success

### Making Good Predictions

1. **Be Specific:** Include dates, numbers, or clear conditions

   - Good: "Apple stock will close above $200 on January 31, 2024"
   - Bad: "Apple stock will go up"

2. **Research:** Base predictions on analysis, not guesses
3. **Diversify:** Make multiple smaller predictions rather than one large one
4. **Time Horizon:** Consider when the outcome will be known

### Staking Strategy

1. **Start Small:** Begin with minimum stakes (0.01 ETH) to learn
2. **Risk Management:** Don't stake more than you can afford to lose
3. **Confidence-Based:** Stake more on predictions you're most confident about

### Security Best Practices

1. **Verify Transactions:** Always review MetaMask popups before confirming
2. **Check Addresses:** Ensure you're interacting with the correct contract
3. **Backup Wallet:** Keep your seed phrase secure and backed up
4. **Test Network:** Practice on testnet before using real ETH

---

## 🔍 Troubleshooting

### Common Issues

#### Wallet Connection Problems

**Issue:** "Connect Wallet" button doesn't work
**Solution:**

1. Ensure MetaMask is installed and unlocked
2. Refresh the page
3. Check if you're on the correct network (Hardhat Local)
4. Clear browser cache

#### Transaction Failures

**Issue:** Transactions fail or get stuck
**Solution:**

1. Check you have enough ETH for gas fees
2. Increase gas limit in MetaMask
3. Reset account in MetaMask (Settings → Advanced → Reset Account)
4. Ensure Hardhat node is running

#### Predictions Not Showing

**Issue:** Predictions don't appear after submission
**Solution:**

1. Wait for transaction confirmation
2. Refresh the page
3. Check if backend server is running
4. Verify the transaction on blockchain

#### MetaMask Network Issues

**Issue:** Wrong network or can't connect
**Solution:**

1. Manually add Hardhat network with correct settings
2. Switch to Hardhat Local network in MetaMask
3. Restart MetaMask if needed

### Getting Help

1. **Check Browser Console:** Look for error messages
2. **Verify Services:** Ensure all services (Hardhat, Backend, MongoDB) are running
3. **Transaction Logs:** Check Hardhat node logs for transaction details
4. **Network Status:** Confirm MetaMask is connected to correct network

---

## 🎯 Example User Journey

### Complete Walkthrough: Alice Makes a Prediction

1. **Setup**

   - Alice opens http://localhost:3001
   - Connects MetaMask with User Account 1
   - Sees her address and balance in header

2. **Making Prediction**

   - Alice navigates to prediction form
   - Enters: "Ethereum will exceed $3,000 by March 2024"
   - Sets stake: 0.08 ETH
   - Clicks "Submit Prediction"
   - Approves transaction in MetaMask
   - Receives confirmation with transaction hash

3. **Tracking**

   - Alice visits "View Predictions" page
   - Sees her prediction with "Pending" status
   - Bookmarks the page to check back later

4. **Resolution**

   - Admin evaluates the prediction when March 2024 arrives
   - If correct, Alice receives her stake + reward
   - If incorrect, Alice loses her stake to the reward pool

5. **Rewards**
   - If Alice was correct and earned rewards:
   - She can see her updated balance in MetaMask
   - Rewards are automatically distributed to her wallet

---

## 📊 Platform Statistics

### Real-Time Data

The platform provides live statistics:

- **Active Predictions:** Currently pending predictions
- **Total Volume:** Sum of all stakes ever made
- **Success Rate:** Percentage of users who made correct predictions
- **Average Stake:** Mean stake amount per prediction
- **Reward Pool:** Current amount available for distribution

### Performance Metrics

- **Transaction Speed:** Typically 1-2 seconds on Hardhat
- **Gas Costs:** Approximately 0.001-0.003 ETH per transaction
- **Uptime:** 24/7 availability (when properly configured)

---

## 🚀 Advanced Features

### Batch Operations

- Submit multiple predictions in sequence
- Bulk reward distribution for admins
- Historical data export

### Analytics Dashboard

- Personal prediction history
- Performance tracking over time
- Reward earnings summary
- Success rate analysis

### API Integration

Access prediction data programmatically:

```javascript
// Get all predictions
GET http://localhost:3002/api/predictions

// Get user predictions
GET http://localhost:3002/api/predictions/user/YOUR_ADDRESS

// Get contract stats
GET http://localhost:3002/api/predictions/stats
````

---

## 📞 Support & Resources

### Documentation

- Smart Contract Code: `/contracts/VeriBitePredictor.sol`
- API Documentation: `/backend/README.md`
- Frontend Components: `/src/app/components/`

### Development Resources

- Hardhat Documentation: https://hardhat.org/
- MetaMask Developer Docs: https://docs.metamask.io/
- Ethereum Development: https://ethereum.org/developers/

### Community

For development questions and support:

- GitHub Issues (if applicable)
- Smart contract address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Network: Hardhat Local (Chain ID: 31337)

---

**Happy Predicting! 🎯**

Remember: This is a development version running on a local test network. Always use test ETH and never share your real private keys!
