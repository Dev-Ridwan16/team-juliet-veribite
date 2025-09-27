# 🔗 Frontend-Backend Integration Setup

## ✅ What I've Done:

### 1. Created `.env.local` for Local Development

```env
NEXT_PUBLIC_API_URL=https://team-juliet-veribite-production.up.railway.app
```

### 2. Updated `src/lib/api.ts`

- Set Railway URL as production fallback
- Maintains localhost for development

## 🚀 Next Steps:

### 1. Update Vercel Environment Variables

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```env
NEXT_PUBLIC_API_URL=https://team-juliet-veribite-production.up.railway.app
```

### 2. Update Railway Backend CORS Settings

In Railway dashboard, update your environment variable:

```env
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

Replace `your-vercel-app.vercel.app` with your actual Vercel URL.

### 3. Test the Integration

After deployment, test these endpoints:

```bash
# Health check
curl https://team-juliet-veribite-production.up.railway.app/health

# Get predictions
curl https://team-juliet-veribite-production.up.railway.app/api/predictions
```

## 🔧 Usage in Your Components

Your API is now ready to use in React components:

```typescript
import { apiService } from "@/lib/api";

// Get all predictions
const predictions = await apiService.getAllPredictions();

// Get user predictions
const userPredictions = await apiService.getUserPredictions(userAddress);

// Admin functions (requires NEXT_PUBLIC_ADMIN_API_KEY)
const stats = await apiService.admin.getStats();
```

## 🎯 What's Configured:

✅ **API Base URL**: https://team-juliet-veribite-production.up.railway.app
✅ **Development fallback**: http://localhost:3002
✅ **Production configuration**: Ready for Vercel
✅ **CORS ready**: Need to update with your Vercel URL

## 🚨 Important Notes:

1. **Vercel Deployment**: Your frontend will automatically use the Railway backend in production
2. **Local Development**: Will still use localhost:3002 when running `npm run dev`
3. **CORS Configuration**: Make sure to update CORS_ORIGIN in Railway with your Vercel URL
4. **Environment Variables**: Add NEXT_PUBLIC_API_URL to Vercel project settings
