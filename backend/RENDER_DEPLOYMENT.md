# VeriBite Backend - Render Deployment

## Quick Render Deployment (Free Tier Available)

### 1. Deploy to Render

1. **Sign up**: Go to [render.com](https://render.com) and sign in with GitHub
2. **Create Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: Select your `team-juliet-veribite` repository
4. **Configure Service**:
   - **Name**: `veribite-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2. Environment Variables

Add these in Render dashboard (Environment section):

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/veribite
JWT_SECRET=your-super-secure-jwt-secret-key-here
ADMIN_API_KEY=your-admin-api-key-here
BLOCKCHAIN_NETWORK=sepolia
CONTRACT_ADDRESS=0xAC93ef07c3861b071169F34D610027A79DF3B742
IPFS_PROVIDER=pinata
FOOD_CLASSIFIER=keyword
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 3. Database Setup (MongoDB Atlas)

1. **Create Atlas Account**: [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Free Cluster**: M0 Sandbox (512 MB)
3. **Database Access**: Create database user
4. **Network Access**: Allow 0.0.0.0/0 (all IPs)
5. **Connect**: Get connection string for MONGODB_URI

### 4. Custom Build (render.yaml) - Optional

Create `render.yaml` in your root directory:

```yaml
services:
  - type: web
    name: veribite-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### 5. Update Frontend

Update your Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://veribite-backend.onrender.com
```

### 6. Health Check Endpoint

Your backend should have a health check endpoint (already included):

```typescript
// In your app.ts
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
```

---

## Free Tier Limitations

- **Sleep after 15 minutes** of inactivity
- **750 hours/month** (enough for continuous use)
- **Cold starts** when waking up from sleep

## Paid Tier Benefits ($7/month)

- **No sleep**
- **Faster builds**
- **Custom domains**
- **More resources**
