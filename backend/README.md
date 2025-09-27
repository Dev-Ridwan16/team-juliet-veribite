# VeriBite Food Prediction Platform - Backend API

A production-grade Express TypeScript backend powering the world's first decentralized food prediction marketplace. Features smart contract integration, food-specific classification, IPFS storage, and comprehensive analytics for food industry insights.

## 🍽️ What This Powers

This backend API enables:

- **Food Trend Predictions**: Track viral foods, ingredient popularity, cooking method trends
- **Restaurant Success Forecasting**: Predict restaurant ratings, chain expansions, business outcomes
- **Market Intelligence**: Food sales, consumption patterns, dietary shift analysis
- **Health & Nutrition Trends**: Wellness food adoption, supplement popularity, diet movements
- **Cultural Food Expansion**: Regional cuisine spread, international food brand launches

## 🚀 Core Features

### 🔗 **Blockchain Integration**

- **Smart Contract**: Full integration with VeriBiteFoodPredictor contract
- **Multi-Network**: Supports Hardhat, Sepolia testnet, and Ethereum mainnet
- **Transaction Management**: Automated prediction submission and reward distribution
- **Error Handling**: Robust Web3 error handling with circuit breaker protection

### 🧠 **Food Classification Engine**

- **AI-Ready**: Interface for machine learning food categorization services
- **Keyword Analysis**: Intelligent food content classification
- **Category Enforcement**: Ensures all predictions are food-related
- **Quality Validation**: Filters non-food predictions automatically

### 🗄️ **Data & Analytics**

- **MongoDB Integration**: Optimized schemas for food prediction data
- **Real-time Analytics**: Prediction accuracy tracking and trend analysis
- **User Insights**: Reputation scoring and expertise tracking
- **Market Intelligence**: Aggregated data for food industry research

### 🛡️ **Production Security**

- **Rate Limiting**: Anti-spam and DDoS protection
- **Input Validation**: Comprehensive data sanitization with Joi
- **Admin Authentication**: Secure admin panel access control
- **Audit Logging**: Complete activity tracking and monitoring

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher (or MongoDB Atlas)
- **Ethereum Node**: Hardhat, Ganache, or live network access

## 🛠️ Installation

1. **Clone and Install**

   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

## ⚙️ Environment Configuration

Create a `.env` file with the following variables:

### Required Configuration

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/veribite

# Blockchain Configuration
BLOCKCHAIN_NETWORK=hardhat
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_deployed_contract_address
RPC_URL=http://127.0.0.1:8545

# IPFS Configuration
IPFS_PROVIDER=pinata
PINATA_JWT=your_pinata_jwt_token

# Admin Configuration
ADMIN_API_KEY=your_secure_admin_api_key

# Food Classification
FOOD_CLASSIFIER=keyword
```

### Optional Configuration

```env
# Alternative IPFS Provider
IPFS_PROVIDER=web3storage
WEB3_STORAGE_TOKEN=your_web3_storage_token

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT (if implementing authentication)
JWT_SECRET=your_jwt_secret
```

## 🚀 Getting Started

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Health Check

```http
GET /health
```

Returns server health status.

### Predictions API

#### Create Prediction

```http
POST /api/predictions
Content-Type: application/json

{
  "userAddress": "0x1234567890123456789012345678901234567890",
  "predictionText": "These organic tomatoes will taste amazing",
  "category": "Ingredient",
  "relayerMode": true
}
```

**Response:**

```json
{
  "success": true,
  "prediction": {
    "_id": "60d5ec49f1a2c8b1f8e4e1a1",
    "predictionText": "These organic tomatoes will taste amazing",
    "category": "Ingredient",
    "status": "pending",
    "classificationConfidence": 0.95,
    "ipfsHash": "QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get Predictions

```http
GET /api/predictions?page=1&limit=20&category=Ingredient&status=pending
```

#### Get Specific Prediction

```http
GET /api/predictions/:id
```

#### Sync Prediction with Blockchain

```http
POST /api/predictions/:id/sync
```

### Admin API

All admin endpoints require the `x-admin-api-key` header.

#### Get Platform Statistics

```http
GET /api/admin/stats
x-admin-api-key: your_admin_api_key
```

#### Get All Predictions (Admin)

```http
GET /api/admin/predictions?page=1&limit=20&status=pending
x-admin-api-key: your_admin_api_key
```

#### Mark Prediction Outcome

```http
POST /api/admin/mark-outcome
x-admin-api-key: your_admin_api_key
Content-Type: application/json

{
  "predictionId": 1,
  "outcome": "Correct",
  "reason": "Prediction verified as accurate"
}
```

#### Distribute Reward

```http
POST /api/admin/distribute-reward
x-admin-api-key: your_admin_api_key
Content-Type: application/json

{
  "predictionId": 1
}
```

#### Batch Distribute Rewards

```http
POST /api/admin/batch-distribute
x-admin-api-key: your_admin_api_key
Content-Type: application/json

{
  "predictionIds": [1, 2, 3, 4, 5]
}
```

## 🏗️ Architecture

### Core Services

#### IPFS Service (`src/services/ipfs.ts`)

- **Purpose**: Decentralized storage for prediction data
- **Providers**: Pinata, Web3.Storage, Mock (for testing)
- **Features**: Retry logic, integrity verification, provider abstraction

#### Food Classifier (`src/services/classifier.ts`)

- **Purpose**: Categorize predictions into food categories
- **Implementation**: Keyword-based classification with ML service interface
- **Categories**: Ingredient, Dish, Diet, Restaurant, Consumption, FoodPolicy, Other

#### Contract Service (`src/services/contract.ts`)

- **Purpose**: Blockchain interaction layer
- **Features**: Prediction submission, outcome marking, reward distribution
- **Networks**: Hardhat, Localhost, Sepolia, Mainnet

#### Database Models (`src/models/`)

- **Prediction**: Complete prediction data with indexing and validation
- **User**: User management and analytics

### API Architecture

#### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Admin API**: 20 requests per 15 minutes per IP
- **Configurable**: Via environment variables

#### Error Handling

- **Centralized**: Global error handling middleware
- **Logging**: Comprehensive error logging with Winston
- **User-Friendly**: Sanitized error responses

#### Validation

- **Joi Schemas**: Request validation for all endpoints
- **Ethereum Addresses**: Proper address format validation
- **Food Classification**: Category validation against enum

## 🔧 Configuration Options

### Blockchain Networks

```typescript
// Supported networks
const networks = {
  hardhat: "http://127.0.0.1:8545",
  localhost: "http://127.0.0.1:8545",
  sepolia: "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
  mainnet: "https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
};
```

### IPFS Providers

```typescript
// Available providers
const providers = {
  pinata: "https://api.pinata.cloud",
  web3storage: "https://api.web3.storage",
  mock: "memory-based-for-testing",
};
```

### Food Categories

```typescript
enum FoodCategory {
  Ingredient = "Ingredient",
  Dish = "Dish",
  Diet = "Diet",
  Restaurant = "Restaurant",
  Consumption = "Consumption",
  FoodPolicy = "FoodPolicy",
  Other = "Other",
}
```

## 🔒 Security Features

- **Rate Limiting**: Multiple tiers of rate limiting
- **Input Validation**: Comprehensive request validation
- **Admin Authentication**: API key-based admin access
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers via Helmet.js
- **Error Sanitization**: No sensitive data in error responses

## 📊 Monitoring & Logging

### Winston Logging

```typescript
// Log levels and files
{
  error: 'error.log',
  warn: 'combined.log',
  info: 'combined.log',
  debug: 'debug.log'
}
```

### Health Monitoring

- **Health Endpoint**: `/health` for uptime monitoring
- **Database Connection**: MongoDB connection status
- **Contract Connection**: Blockchain connectivity status

## 🚀 Deployment

### Development Deployment

```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Start Hardhat node (in contract directory)
npx hardhat node

# Deploy contracts (in contract directory)
npx hardhat run scripts/deploy-food-predictor.ts --network localhost

# Start backend
npm run dev
```

### Production Deployment

```bash
# Build application
npm run build

# Set production environment
export NODE_ENV=production

# Start with PM2 (recommended)
pm2 start dist/server.js --name "veribite-backend"

# Or start directly
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

## 🧪 Testing

### Test Structure

```
tests/
├── services/           # Unit tests for services
├── integration/        # API integration tests
└── setup.ts           # Test configuration
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage
```

## 📈 Performance Optimization

### Database Indexing

```javascript
// Automatic indexes on:
- user (compound with createdAt)
- category (compound with status)
- status (standalone)
- onChainId (unique, sparse)
- ipfsHash (unique, sparse)
```

### Caching Strategy

- **Memory Caching**: For frequently accessed data
- **Redis**: For distributed caching (future enhancement)

### Connection Pooling

- **MongoDB**: Automatic connection pooling
- **HTTP Clients**: Axios with keep-alive

## 🔄 Integration with Frontend

### WebSocket Support (Future)

```typescript
// Real-time updates for prediction status
io.on("prediction-update", (data) => {
  // Handle prediction status changes
});
```

### Frontend Integration

```javascript
// Example frontend integration
const response = await fetch("/api/predictions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    userAddress: account,
    predictionText: text,
    category: category,
  }),
});
```

## 🔍 Troubleshooting

### Common Issues

#### MongoDB Connection

```bash
# Check MongoDB status
mongo --eval "db.adminCommand('ismaster')"

# Check connection string
echo $MONGODB_URI
```

#### Contract Connection

```bash
# Verify contract deployment
npx hardhat verify --network localhost $CONTRACT_ADDRESS

# Check contract ABI
cat src/contracts/VeriBiteFoodPredictor.json
```

#### IPFS Issues

```bash
# Test Pinata connection
curl -X GET https://api.pinata.cloud/data/testAuthentication \
  -H "pinata_api_key: $PINATA_API_KEY" \
  -H "pinata_secret_api_key: $PINATA_SECRET_KEY"
```

### Debug Mode

```bash
DEBUG=* npm run dev
```

## 📚 API Examples

See the [Postman Collection](./postman/VeriBite-Backend.postman_collection.json) for complete API examples.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Write tests for new features**
4. **Ensure all tests pass**
5. **Submit a pull request**

## 📄 License

MIT License - see LICENSE file for details.

---

## 📞 Support

For technical support and questions:

- **Documentation**: This README and inline code comments
- **Issues**: GitHub Issues for bug reports and feature requests
- **API Testing**: Use the provided Postman collection

## 🔮 Future Enhancements

- **WebSocket Integration**: Real-time prediction updates
- **Advanced ML Classification**: Replace keyword classifier with ML models
- **Multi-Chain Support**: Support for multiple blockchain networks
- **Advanced Analytics**: Detailed prediction analytics and insights
- **Caching Layer**: Redis integration for improved performance
