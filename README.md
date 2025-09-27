# VeriBite

**Verified consumption, predicted one bite at a time.**

VeriBite is a modern Web3 dApp built with Next.js, TailwindCSS, Wagmi, and Ethers.js that allows users to make food consumption predictions, stake ETH, and earn rewards for accurate predictions.

## 🎨 Brand Identity

- **Name**: VeriBite
- **Tagline**: "Verified consumption, predicted one bite at a time."
- **Style**: Clean, futuristic, with light food accents
- **Primary Colors**: Green (#00A86B) + White + Neutral Gray

## ⚡ Features

- 🔗 **Wallet Connection**: Seamless Web3 wallet integration with RainbowKit
- 📝 **Prediction System**: Submit food consumption predictions with ETH stakes
- 🏆 **Reward Mechanism**: Earn rewards for accurate predictions
- 👥 **Community Feed**: View and interact with community predictions
- 🛡️ **Admin Panel**: Admin-only interface for managing predictions and rewards
- 📱 **Responsive Design**: Mobile-first, modern UI/UX

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Web3**: Wagmi + RainbowKit + Ethers.js
- **Language**: TypeScript
- **State Management**: React Query (@tanstack/react-query)

## 📂 Project Structure

```
/frontend
  /src
    /app
      /components
        Navbar.tsx              # Navigation with wallet connection
        PredictionForm.tsx      # Form to submit new predictions
        PredictionsFeed.tsx     # Display community predictions
        AdminPanel.tsx          # Admin interface for managing predictions
      /predictions
        page.tsx                # Predictions page
      /admin
        page.tsx                # Admin panel page
      layout.tsx                # Global layout with providers
      page.tsx                  # Landing page
    /lib
      contract.ts               # Contract integration and helper functions
      wagmi.ts                  # Wagmi configuration
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

## 🔗 Contract Integration

The dApp expects a Solidity contract with the following functions:

### Core Functions

- `submitPrediction(string predictionText) payable` - Submit a new prediction
- `getAllPredictions() view returns (Prediction[])` - Get all predictions
- `markOutcome(uint256 predictionId, uint8 outcome)` - Mark prediction outcome (admin)
- `distributeReward(uint256 predictionId)` - Distribute rewards (admin)
- `owner() view returns (address)` - Get contract owner

### Data Structure

```solidity
struct Prediction {
    uint256 id;
    address predictor;
    string predictionText;
    uint256 timestamp;
    uint256 stake;
    uint8 status; // 0: Pending, 1: Correct, 2: Incorrect
}
```

## 🎯 Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" in the navigation
2. **Make Predictions**: Go to `/predictions` and submit your food consumption predictions
3. **View Community**: Browse all community predictions and their status
4. **Earn Rewards**: Get rewards when your predictions are marked correct

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (only visible to contract owner)
2. **Review Predictions**: View all submitted predictions
3. **Mark Outcomes**: Mark predictions as correct or incorrect
4. **Distribute Rewards**: Send rewards to users with correct predictions

## 🎨 Styling Guidelines

### Colors

- Primary: `#00A86B` (VeriBite Green)
- Secondary: White and Neutral Grays
- Gradients: Used for hero sections and CTAs

### Typography

- Font: Inter (Google Fonts)
- Headings: Bold, large scales
- Body: Clean, readable hierarchy

### Components

- Rounded corners (xl, 2xl for cards)
- Subtle shadows and borders
- Hover animations and transitions
- Responsive grid layouts

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

## 🚀 Deployment

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**:

   - Vercel (recommended)
   - Netlify
   - Traditional hosting

3. **Environment Variables**:
   Set up production environment variables on your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For questions or issues:

- Check the documentation
- Review contract integration requirements
- Ensure wallet connectivity
- Verify network compatibility

---

**Built with ❤️ for the Web3 community**
