#!/bin/bash

# VeriBite Backend Deployment Helper Script
# This script helps set up the backend deployment

echo "🚀 VeriBite Backend Deployment Helper"
echo "=====================================\n"

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Run this script from the root directory of your project"
    exit 1
fi

echo "✅ Project structure verified\n"

# Display deployment options
echo "📋 Choose your deployment platform:"
echo "1. Railway (Recommended - Easy setup)"
echo "2. Render (Free tier available)"
echo "3. Heroku (Popular option)"
echo "4. Manual setup guide"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "\n🚂 Railway Deployment"
        echo "====================="
        echo "1. Go to: https://railway.app"
        echo "2. Sign in with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select this repository"
        echo "5. Set root directory to: backend"
        echo "6. Railway will auto-detect Node.js"
        echo ""
        echo "📋 Add these environment variables in Railway dashboard:"
        cat backend/.env.production
        ;;
    2)
        echo "\n🎨 Render Deployment"
        echo "===================="
        echo "1. Go to: https://render.com"
        echo "2. Sign in with GitHub"
        echo "3. Click 'New' → 'Web Service'"
        echo "4. Select this repository"
        echo "5. Configure:"
        echo "   - Root Directory: backend"
        echo "   - Build Command: npm install && npm run build"
        echo "   - Start Command: npm start"
        echo ""
        echo "📋 Add these environment variables in Render dashboard:"
        cat backend/.env.production
        ;;
    3)
        echo "\n🔸 Heroku Deployment"
        echo "===================="
        echo "1. Install Heroku CLI"
        echo "2. Run: heroku create your-app-name"
        echo "3. Use git subtree to deploy backend:"
        echo "   git subtree push --prefix=backend heroku main"
        echo ""
        echo "📋 Set environment variables:"
        echo "heroku config:set NODE_ENV=production"
        echo "heroku config:set MONGODB_URI=your-mongodb-uri"
        echo "# (add all variables from .env.production)"
        ;;
    4)
        echo "\n📖 Manual Setup Guide"
        echo "====================="
        echo "See detailed guides:"
        echo "- Railway: backend/RAILWAY_DEPLOYMENT.md"
        echo "- Render: backend/RENDER_DEPLOYMENT.md"
        echo "- Checklist: BACKEND_DEPLOYMENT_CHECKLIST.md"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "\n🔧 Next Steps:"
echo "=============="
echo "1. Set up MongoDB Atlas database"
echo "2. Configure all environment variables"
echo "3. Deploy backend to your chosen platform"
echo "4. Update Vercel environment variables:"
echo "   NEXT_PUBLIC_API_URL=https://your-backend-url.com"
echo "5. Test the deployment"
echo ""

echo "📚 Documentation:"
echo "- Backend API: backend/README.md"
echo "- Deployment Guide: BACKEND_DEPLOYMENT_CHECKLIST.md"
echo "- Environment Variables: backend/.env.production"
echo ""

echo "✨ Good luck with your deployment!"