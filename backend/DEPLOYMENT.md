# VeriBite Backend Deployment Guide

This guide provides step-by-step instructions for deploying the VeriBite food prediction backend in various environments.

## 🎯 Quick Start (Local Development)

### 1. Prerequisites Installation

**Install Node.js (v18+)**

```bash
# Download from nodejs.org or use a version manager
node --version  # Should be 18.0.0+
npm --version   # Should be 8.0.0+
```

**Install MongoDB**

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Windows
# Download MongoDB Community Server from mongodb.com
```

**Start MongoDB**

```bash
# macOS/Linux
sudo systemctl start mongod

# Or start manually
mongod --dbpath /path/to/your/data/directory

# Windows
# Run as Windows Service or start manually from bin directory
```

### 2. Backend Setup

**Clone and Install**

```bash
cd veribite/backend
npm install
```

**Environment Configuration**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/veribite
BLOCKCHAIN_NETWORK=hardhat
PRIVATE_KEY=your_private_key_from_hardhat_accounts
CONTRACT_ADDRESS=deployed_contract_address
RPC_URL=http://127.0.0.1:8545
IPFS_PROVIDER=mock
ADMIN_API_KEY=dev-admin-key-123
FOOD_CLASSIFIER=keyword
```

### 3. Smart Contract Setup

**In the root directory, start Hardhat node:**

```bash
cd ..  # Go to root veribite directory
npx hardhat node
```

**Deploy the contract (in new terminal):**

```bash
npx hardhat run scripts/deploy-food-predictor.ts --network localhost
```

Copy the deployed contract address to your `.env` file.

### 4. Start the Backend

```bash
cd backend
npm run dev
```

Your API will be available at `http://localhost:5000`

### 5. Test the API

**Health Check:**

```bash
curl http://localhost:5000/health
```

**Create a Prediction:**

```bash
curl -X POST http://localhost:5000/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x1234567890123456789012345678901234567890",
    "predictionText": "These organic tomatoes will taste amazing",
    "category": "Ingredient",
    "relayerMode": true
  }'
```

## 🏭 Production Deployment

### Option 1: VPS/Server Deployment

#### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

#### 1. Server Setup

**Update System**

```bash
sudo apt update && sudo apt upgrade -y
```

**Install Node.js**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Install MongoDB**

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Install PM2 (Process Manager)**

```bash
sudo npm install -g pm2
```

#### 2. Application Deployment

**Clone Repository**

```bash
cd /opt
sudo git clone https://github.com/your-username/veribite.git
sudo chown -R $USER:$USER veribite
cd veribite/backend
```

**Install Dependencies**

```bash
npm ci --only=production
```

**Build Application**

```bash
npm run build
```

**Configure Environment**

```bash
cp .env.example .env
```

Edit `.env` for production:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/veribite_prod
BLOCKCHAIN_NETWORK=mainnet
PRIVATE_KEY=your_production_private_key
CONTRACT_ADDRESS=your_production_contract_address
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
IPFS_PROVIDER=pinata
PINATA_JWT=your_pinata_jwt_token
ADMIN_API_KEY=secure_random_admin_key_here
```

**Start with PM2**

```bash
pm2 start dist/server.js --name "veribite-backend"
pm2 startup
pm2 save
```

#### 3. Nginx Reverse Proxy

**Install Nginx**

```bash
sudo apt install nginx -y
```

**Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/veribite-backend
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

**Enable Site**

```bash
sudo ln -s /etc/nginx/sites-available/veribite-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. SSL Certificate (Let's Encrypt)

**Install Certbot**

```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Get Certificate**

```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=development

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S veribite -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder --chown=veribite:nodejs /app/dist ./dist
COPY --from=builder --chown=veribite:nodejs /app/src/contracts ./src/contracts

USER veribite

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
```

#### 2. Docker Compose Setup

```yaml
# docker-compose.yml
version: "3.8"

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/veribite_prod
      - PORT=5000
    env_file:
      - .env
    depends_on:
      - mongo
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: veribite_prod

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale if needed
docker-compose up -d --scale backend=3
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

**1. Install Heroku CLI**

```bash
# Download from heroku.com/cli
heroku --version
```

**2. Create Heroku App**

```bash
heroku create veribite-backend-prod
```

**3. Add MongoDB Atlas**

```bash
heroku addons:create mongolab:sandbox
```

**4. Configure Environment**

```bash
heroku config:set NODE_ENV=production
heroku config:set BLOCKCHAIN_NETWORK=mainnet
heroku config:set PRIVATE_KEY=your_private_key
heroku config:set CONTRACT_ADDRESS=your_contract_address
heroku config:set RPC_URL=your_rpc_url
heroku config:set IPFS_PROVIDER=pinata
heroku config:set PINATA_JWT=your_pinata_jwt
heroku config:set ADMIN_API_KEY=your_admin_key
```

**5. Deploy**

```bash
git add .
git commit -m "Deploy to production"
git push heroku main
```

#### AWS ECS Deployment

**1. Create Task Definition**

```json
{
  "family": "veribite-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "veribite-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/veribite-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:ssm:region:account:parameter/veribite/mongodb-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/veribite-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 🔧 Configuration Management

### Environment Variables

**Required Variables:**

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: Database connection string
- `BLOCKCHAIN_NETWORK`: Blockchain network name
- `PRIVATE_KEY`: Private key for transactions
- `CONTRACT_ADDRESS`: Deployed contract address
- `ADMIN_API_KEY`: Admin authentication key

**Optional Variables:**

- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
- `LOG_LEVEL`: Logging level (default: info)

### Database Setup

**MongoDB Indexes (Auto-created)**

```javascript
// Compound indexes for performance
db.predictions.createIndex({ user: 1, createdAt: -1 });
db.predictions.createIndex({ category: 1, status: 1 });
db.predictions.createIndex({ status: 1 });
db.predictions.createIndex({ onChainId: 1 }, { unique: true, sparse: true });
db.predictions.createIndex({ ipfsHash: 1 }, { unique: true, sparse: true });
```

### IPFS Provider Setup

**Pinata Setup:**

1. Create account at pinata.cloud
2. Generate JWT token
3. Add to environment: `PINATA_JWT=your_jwt_here`

**Web3.Storage Setup:**

1. Create account at web3.storage
2. Generate API token
3. Add to environment: `WEB3_STORAGE_TOKEN=your_token_here`

## 📊 Monitoring & Maintenance

### Health Monitoring

**Health Endpoint:**

```bash
curl http://your-domain.com/health
```

**Expected Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "VeriBite Backend",
  "database": "connected",
  "blockchain": "connected"
}
```

### Log Monitoring

**View PM2 Logs:**

```bash
pm2 logs veribite-backend
```

**View Docker Logs:**

```bash
docker-compose logs -f backend
```

**Log Levels:**

- `error`: Critical errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

### Performance Monitoring

**PM2 Monitoring:**

```bash
pm2 monit
```

**System Resources:**

```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# MongoDB stats
mongo --eval "db.stats()"
```

### Database Backup

**MongoDB Backup:**

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/veribite_prod" --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/veribite_prod" /backup/20240115/veribite_prod
```

### Security Hardening

**1. Firewall Configuration**

```bash
sudo ufw enable
sudo ufw allow 22  # SSH
sudo ufw allow 80  # HTTP
sudo ufw allow 443 # HTTPS
sudo ufw deny 5000 # Block direct API access
```

**2. MongoDB Security**

```bash
# Enable authentication
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase"]
})
```

Update connection string:

```env
MONGODB_URI=mongodb://admin:secure_password@localhost:27017/veribite_prod?authSource=admin
```

**3. SSL/TLS Configuration**

- Use Let's Encrypt for free SSL certificates
- Configure strong cipher suites
- Enable HSTS headers

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Issues:**

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongo --eval "db.adminCommand('ismaster')"
```

**Contract Connection Issues:**

```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_URL
```

**IPFS Issues:**

```bash
# Test Pinata authentication
curl -X GET "https://api.pinata.cloud/data/testAuthentication" \
  -H "Authorization: Bearer $PINATA_JWT"
```

**High Memory Usage:**

```bash
# Check process memory
ps aux | grep node

# Restart if needed
pm2 restart veribite-backend
```

### Performance Issues

**Database Optimization:**

```javascript
// Check slow queries
db.setProfilingLevel(2);
db.system.profile.find().limit(5).sort({ millis: -1 });

// Analyze query performance
db.predictions.explain("executionStats").find({ category: "Ingredient" });
```

**Application Optimization:**

- Enable gzip compression
- Use database connection pooling
- Implement caching layer
- Monitor API response times

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Smart contract deployed and verified
- [ ] IPFS provider configured and tested
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] Admin API key secured
- [ ] Private keys secured (use KMS in production)

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] API endpoints tested via Postman collection
- [ ] Database indexes created
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Error alerts configured
- [ ] Performance baselines established

### Production Readiness

- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Rollback plan documented
- [ ] Monitoring dashboards created

---

For additional support and detailed troubleshooting, refer to the main [README.md](./README.md) and the API documentation.
