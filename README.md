https://www.awesomescreenshot.com/video/44689548?key=0907bc9b8538e8c493a2a384dfb5c888


# VeriBite Food Prediction Platform

**NOTICE: Due to current restrictions on the Blogdag API (The credit tokenization), we were unable to implement it in this project. However, the system is fully compatible, and Blogdag will be integrated once the API restrictions are lifted.**

**Verify your food predictions, one bite at a time.**

VeriBite is a decentralized Web3 application that revolutionizes food consumption predictions through blockchain technology. Users can make predictions about food trends, consumption patterns, and culinary outcomes while staking ETH to back their confidence. Accurate predictions earn rewards, creating a gamified ecosystem for food enthusiasts and industry experts.

## 🍽️ What is VeriBite?

VeriBite transforms food prediction into a decentralized, stake-based game where:

- **Food Enthusiasts** predict consumption trends, restaurant success, food popularity, and culinary outcomes
- **Industry Experts** leverage their knowledge for rewards while sharing insights with the community
- **Data Analysts** access crowd-sourced food prediction data for market research
- **Blockchain Users** earn ETH rewards for accurate food-related predictions

## 🎯 Food Prediction Categories

- **🥘 Food Trends**: Predict the next viral food, seasonal favorites, or ingredient popularity
- **🍕 Restaurant Success**: Forecast new restaurant ratings, popularity, or survival rates
- **🛒 Consumption Patterns**: Predict food sales, dietary shifts, or market demand
- **🍎 Health & Nutrition**: Forecast adoption of health trends, superfood popularity
- **🌮 Regional Cuisine**: Predict the spread of regional foods to new markets
- **🎂 Seasonal Predictions**: Holiday food sales, seasonal menu changes, harvest outcomes

## 🎨 Brand Identity

- **Name**: VeriBite Food Prediction Platform
- **Tagline**: "Verify your food predictions, one bite at a time."
- **Focus**: Decentralized food industry predictions and trend forecasting
- **Style**: Clean, modern, with vibrant food-inspired accents
- **Primary Colors**: Fresh Green (#00A86B) + Orange (#FF6B35) + Neutral Gray

## 🚀 Key Features

- 🔗 **Wallet Integration**: Seamless Web3 wallet connection with RainbowKit
- 🍽️ **Food Prediction System**: Submit detailed food industry predictions with ETH stakes
- 📊 **Prediction Categories**: Organized by food trends, restaurants, consumption, health, and regions
- 🏆 **Reward System**: Earn ETH rewards for accurate food predictions
- 👥 **Community Insights**: Access crowd-sourced food industry intelligence
- 🛡️ **Admin Dashboard**: Verify predictions and manage community rewards
- 📱 **Mobile-First Design**: Optimized for food enthusiasts on the go
- � **Analytics Dashboard**: Track prediction accuracy and food trend data

## 🍕 How It Works

1. **Connect Your Wallet**: Link your Web3 wallet to start predicting
2. **Choose Food Category**: Select from trends, restaurants, consumption, or health predictions
3. **Make Your Prediction**: Submit detailed food predictions with reasoning
4. **Stake Your Confidence**: Back predictions with ETH to show confidence
5. **Community Validation**: Predictions are verified by community consensus
6. **Earn Rewards**: Accurate predictions earn ETH rewards and reputation points

## 🛠 Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: TailwindCSS with food-themed design system
- **Web3 Integration**: Wagmi + RainbowKit + Ethers.js
- **Smart Contracts**: Solidity on Ethereum/Polygon
- **Backend API**: Node.js + Express + MongoDB
- **Language**: TypeScript for type safety
- **State Management**: React Query for data fetching
- **Deployment**: Vercel (Frontend) + Railway (Backend)

## 📂 Project Structure

```
/src
  /app
    /components
      Navbar.tsx                    # Navigation with wallet connection
      PredictionForm.tsx           # Food prediction submission form
      PredictionsFeed.tsx          # Community food predictions feed
      AdminPanel.tsx               # Admin interface for prediction management
    /predictions
      page.tsx                     # Food predictions marketplace
    /admin
      page.tsx                     # Admin dashboard
    layout.tsx                     # Global layout with Web3 providers
    page.tsx                       # Landing page showcasing food predictions
  /lib
    contract.ts                    # Smart contract integration
    wagmi.ts                       # Web3 wallet configuration
    api.ts                         # Backend API integration
    error-handling.ts              # Web3 error handling utilities
  /hooks
    useWeb3ErrorHandling.ts        # Custom error handling hooks
  /components
    ErrorHandling.tsx              # Error display components
/backend
  /src
    /routes
      predictions.ts               # Food prediction API routes
      admin.ts                     # Admin management routes
    /models
      Prediction.ts                # Food prediction data model
    /services
      classifier.ts                # Food classification service
      contract.ts                  # Blockchain integration service
    app.ts                         # Express application setup
/contracts
  VeriBiteFoodPredictor.sol       # Main prediction smart contract
  tailwind.config.ts           # Tailwind configuration with VeriBite colors
  package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- A Web3 wallet (MetaMask, etc.)
- Access to Ethereum network (mainnet, testnets, or local)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd veribite
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
   ```

4. **Update contract configuration**:
   Edit `src/lib/contract.ts`:

   - Replace `CONTRACT_ADDRESS` with your deployed contract address
   - Replace `CONTRACT_ABI` with your actual contract ABI

5. **Start the development server**:

   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔗 Smart Contract Integration

VeriBite uses the `VeriBiteFoodPredictor` smart contract deployed on Ethereum Sepolia testnet.

### Core Functions

- `submitPrediction(string foodPredictionText) payable` - Submit food predictions with ETH stake
- `getAllPredictions() view returns (Prediction[])` - Retrieve all community predictions
- `markOutcome(uint256 predictionId, bool correct)` - Admin function to verify predictions
- `distributeReward(uint256 predictionId)` - Distribute rewards to accurate predictors
- `getContractStats() view returns (...)` - Get platform statistics and metrics

### Prediction Data Structure

```solidity
struct Prediction {
    uint256 id;              // Unique prediction identifier
    address user;            // Predictor's wallet address
    string text;             // Detailed food prediction
    uint256 timestamp;       // Prediction submission time
    uint256 stake;           // ETH staked on prediction
    uint8 status;           // 0: Pending, 1: Correct, 2: Incorrect
}
```

### Contract Address

- **Sepolia Testnet**: `0xAC93ef07c3861b071169F34D610027A79DF3B742`
- **Network**: Ethereum Sepolia
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0xAC93ef07c3861b071169F34D610027A79DF3B742)

## 🍽️ Example Food Predictions

### Trending Foods

- "Plant-based meat alternatives will capture 25% of the burger market by Q2 2025"
- "Korean corn dogs will become the next viral street food trend in major US cities"
- "Oat milk will surpass almond milk in coffee shop adoption within 6 months"

### Restaurant Success

- "The new Italian restaurant on 5th Avenue will receive 4+ stars within 30 days"
- "Fast-casual Mediterranean chains will expand 200% in suburban markets this year"

### Health & Nutrition Trends

- "Ashwagandha supplements will see 300% growth in mainstream adoption"
- "Intermittent fasting apps will gain 5M+ users before year-end"

### Regional Cuisine Expansion

- "Nigerian jollof rice will appear on 50+ US restaurant menus by summer"
- "Japanese convenience store model will launch in 10+ US cities"

## 🎯 For Different Users

### Food Enthusiasts & Bloggers

1. **Connect Wallet**: Link MetaMask or preferred Web3 wallet
2. **Browse Categories**: Explore food trends, restaurant predictions, health forecasts
3. **Make Predictions**: Share insights on upcoming food trends with detailed reasoning
4. **Build Reputation**: Earn credibility points and ETH rewards for accurate predictions

### Industry Professionals

1. **Leverage Expertise**: Use professional knowledge to make high-confidence predictions
2. **Higher Stakes**: Back predictions with larger ETH amounts for bigger rewards
3. **Market Intelligence**: Access crowd-sourced data for business insights
4. **Network Building**: Connect with other food industry professionals

### Data Researchers

1. **Access Trend Data**: Analyze community predictions for market research
2. **Historical Analysis**: Study prediction accuracy and food trend evolution
3. **Export Insights**: Use prediction data for academic or commercial research

### Platform Administrators

1. **Access Admin Panel**: Navigate to `/admin` (contract owner only)
2. **Verify Predictions**: Review and validate prediction outcomes with evidence
3. **Manage Rewards**: Distribute ETH rewards to accurate predictors
4. **Platform Analytics**: Monitor community engagement and prediction quality

## 🎨 Food-Themed Design System

### Color Palette

- **Primary**: Fresh Green `#00A86B` (represents fresh ingredients and growth)
- **Secondary**: Warm Orange `#FF6B35` (appetite-stimulating and energetic)
- **Accent**: Deep Purple `#6B46C1` (premium, sophisticated dining)
- **Neutral**: Clean Grays for backgrounds and text
- **Success**: Bright Green for accurate predictions
- **Warning**: Golden Yellow for pending predictions

### Food-Inspired Typography

- **Primary Font**: Inter (clean, modern, highly readable)
- **Headers**: Bold weights with food-related metaphors ("Bite-sized insights", "Savor the predictions")
- **Icons**: Custom food icons (🍽️, 🥘, 🍕, 🍎, 🌮, 🎂)

### Component Design Philosophy

- **Card Layouts**: Resemble menu cards with rounded corners and subtle shadows
- **Buttons**: Appetite-inspiring hover effects with warm color transitions
- **Forms**: Clean inputs with food category organization
- **Navigation**: Simple, intuitive like a restaurant menu structure

## 🔧 Configuration

### Wagmi Setup

Update `src/lib/wagmi.ts` with your WalletConnect project ID:

```typescript
export const config = getDefaultConfig({
  appName: "VeriBite",
  projectId: "YOUR_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: true,
});
```

### Supported Networks

- Ethereum Mainnet
- Polygon
- Optimism
- Arbitrum
- Base
- Sepolia (for testing)

## 📱 Responsive Design

The dApp is built mobile-first and works seamlessly across:

- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🧪 Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- TypeScript for type safety
- ESLint configuration
- Responsive design patterns
- Web3 best practices

## 🚀 Deployment & Architecture

### Frontend (Vercel)

- **URL**: Deployed on Vercel with automatic GitHub integration
- **Environment**: Next.js 14 with optimized food-themed components
- **Web3 Integration**: RainbowKit wallet connection with Sepolia testnet support

### Backend (Railway)

- **API URL**: `team-juliet-veribite-production.up.railway.app`
- **Database**: MongoDB Atlas for prediction data and user analytics
- **Services**: Food classification, blockchain integration, admin management

### Smart Contract (Ethereum Sepolia)

- **Address**: `0xAC93ef07c3861b071169F34D610027A79DF3B742`
- **Network**: Ethereum Sepolia Testnet
- **Features**: Staking, reward distribution, prediction verification

## 📊 Platform Analytics

Track your food prediction performance:

- **Accuracy Score**: Personal prediction success rate
- **Reputation Points**: Community-driven credibility system
- **Earnings History**: ETH rewards from accurate predictions
- **Category Expertise**: Specialized knowledge in food areas
- **Community Ranking**: Leaderboard position among predictors

## 🤝 Contributing to Food Predictions

1. **Fork the Repository**: Create your own copy
2. **Food Focus**: Ensure contributions align with food prediction theme
3. **Quality Standards**: Maintain high-quality prediction categories
4. **Community Guidelines**: Follow food industry prediction ethics
5. **Submit Pull Request**: Contribute improvements and new features

## 🆘 Support & Community

For questions about food predictions or technical issues:

- **Documentation**: Comprehensive guides for all user types
- **Community Discord**: Connect with other food prediction enthusiasts
- **Technical Support**: Blockchain integration and wallet connection help
- **Food Industry Insights**: Access expert analysis and trend discussions

---

**🍽️ Built for food enthusiasts, powered by blockchain technology**

_VeriBite: Where culinary intuition meets decentralized verification_
