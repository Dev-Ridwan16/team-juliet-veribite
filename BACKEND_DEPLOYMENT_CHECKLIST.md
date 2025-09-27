# 🚀 VeriBite Backend Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Database Setup (MongoDB Atlas)

- [ ] Create MongoDB Atlas account
- [ ] Create a free M0 cluster
- [ ] Create database user with username/password
- [ ] Set network access to allow all IPs (0.0.0.0/0)
- [ ] Get connection string for MONGODB_URI

### 2. Environment Variables Preparation

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Set ADMIN_API_KEY for admin operations
- [ ] Get your Vercel app URL for CORS_ORIGIN
- [ ] Confirm CONTRACT_ADDRESS is correct

## 🎯 Deployment Options

### Option A: Railway (Recommended)

- [ ] Sign up at railway.app
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Configure build/start commands
- [ ] Add all environment variables
- [ ] Deploy and test

### Option B: Render (Free Tier Available)

- [ ] Sign up at render.com
- [ ] Create Web Service from GitHub
- [ ] Set root directory to `backend`
- [ ] Configure build/start commands
- [ ] Add all environment variables
- [ ] Deploy and test

### Option C: Heroku

- [ ] Install Heroku CLI
- [ ] Create new Heroku app
- [ ] Set up MongoDB addon or use Atlas
- [ ] Configure environment variables
- [ ] Deploy using Git subtree

## 🔗 Frontend Integration

### Update Vercel Environment Variables

Add to your Vercel project settings:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Test API Connection

After deployment, test these endpoints:

- [ ] `GET /health` - Health check
- [ ] `GET /api/predictions` - Get predictions
- [ ] `POST /api/predictions` - Create prediction (requires auth)
- [ ] `GET /api/admin/stats` - Admin stats

## 🛠️ Required Environment Variables

```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veribite
JWT_SECRET=your-32-character-minimum-secret-key
ADMIN_API_KEY=your-admin-key
BLOCKCHAIN_NETWORK=sepolia
CONTRACT_ADDRESS=0xAC93ef07c3861b071169F34D610027A79DF3B742
IPFS_PROVIDER=pinata
FOOD_CLASSIFIER=keyword
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

## 🧪 Post-Deployment Testing

### Backend Health Check

```bash
curl https://your-backend-url.com/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2025-09-27T..."
}
```

### API Endpoints Test

```bash
# Get predictions
curl https://your-backend-url.com/api/predictions

# Get contract stats (admin)
curl -H "x-admin-key: YOUR_ADMIN_KEY" https://your-backend-url.com/api/admin/stats
```

## 🔄 Frontend Configuration

Create/update these files:

### `src/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const api = {
  baseURL: API_BASE_URL,
  predictions: `${API_BASE_URL}/api/predictions`,
  users: `${API_BASE_URL}/api/users`,
  admin: `${API_BASE_URL}/api/admin`,
};
```

## 🚨 Common Issues & Solutions

### CORS Errors

- Ensure CORS_ORIGIN matches your exact Vercel URL
- Include protocol (https://)
- No trailing slash

### Database Connection

- Check MongoDB Atlas network access
- Verify connection string format
- Ensure database user has proper permissions

### Environment Variables

- Double-check all required variables are set
- Verify no extra spaces or quotes
- Use production values, not development

### Cold Starts (Free Tiers)

- First request after inactivity may be slow
- Consider implementing a keep-alive ping
- Upgrade to paid tier for 24/7 availability

## 📊 Monitoring

### Check Logs

- Railway: Dashboard → Deployments → View Logs
- Render: Dashboard → Service → Logs
- Heroku: `heroku logs --tail`

### Health Monitoring

Set up a simple health check ping every 10 minutes to prevent cold starts:

```bash
# Cron job or GitHub Actions
*/10 * * * * curl https://your-backend-url.com/health
```
