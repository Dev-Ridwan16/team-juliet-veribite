# VeriBite Backend - Railway Deployment

## Quick Railway Deployment

### 1. Prepare Your Repository

Make sure your backend code is ready and environment variables are set.

### 2. Deploy to Railway

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub
2. **Create Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose your `team-juliet-veribite` repository
4. **Configure Service**:
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

### 3. Environment Variables

Add these in Railway dashboard:

```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/veribite
JWT_SECRET=your-super-secure-jwt-secret-key-here
ADMIN_API_KEY=your-admin-api-key-here
BLOCKCHAIN_NETWORK=sepolia
CONTRACT_ADDRESS=0xAC93ef07c3861b071169F34D610027A79DF3B742
IPFS_PROVIDER=pinata
FOOD_CLASSIFIER=keyword
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 4. Database Setup (MongoDB Atlas)

1. **Create Atlas Account**: Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Cluster**: Choose free M0 cluster
3. **Setup Database User**: Create username/password
4. **Network Access**: Allow access from anywhere (0.0.0.0/0)
5. **Get Connection String**: Copy MongoDB URI to Railway env vars

### 5. Update Frontend Configuration

Update your frontend to use the new backend URL:

```typescript
// In your Next.js app
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://your-railway-app.railway.app";
```

---

## Alternative: Render Deployment

### railway.json (Optional - for advanced config)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Nixpacks.toml (Optional - for custom build)

```toml
[phases.setup]
nixPkgs = ['nodejs', 'npm']

[phases.install]
cmds = ['npm install']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```
