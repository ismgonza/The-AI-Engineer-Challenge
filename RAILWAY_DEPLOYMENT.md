# Railway Deployment Guide

This guide will help you deploy the PDF RAG Chat API backend to Railway while keeping the frontend on Vercel.

## Prerequisites

- Railway account (you already have this)
- GitHub repository with your code
- Railway CLI (optional but recommended)

## Step 1: Install Railway CLI (Optional but Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

## Step 2: Deploy to Railway

### Option A: Using Railway Web Dashboard (Easiest)

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Sign in to your account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `The-AI-Engineer-Challenge`
   - Select the branch: `feature/pdf-rag-system`

3. **Configure Deployment**
   - Railway will automatically detect the Dockerfile
   - The deployment will use the `railway.json` configuration
   - Railway will build and deploy your application

4. **Set Environment Variables (if needed)**
   - Go to your project settings
   - Add any environment variables you need
   - Common ones might include:
     - `PORT` (Railway sets this automatically)
     - Any default API keys or configuration

### Option B: Using Railway CLI

```bash
# Navigate to your project directory
cd /Users/ismgonza/Documents/projects/repositories/learning/The-AI-Engineer-Challenge

# Initialize Railway project
railway init

# Deploy to Railway
railway up
```

## Step 3: Get Your Railway URL

After deployment, Railway will provide you with a URL like:
- `https://your-project-name-production.up.railway.app`

## Step 4: Update Frontend Configuration

You'll need to update your frontend to point to the Railway backend instead of the local API.

### Update Frontend API Base URL

In your frontend code, update the API base URL to point to your Railway deployment:

```typescript
// In your frontend API configuration
const API_BASE_URL = 'https://your-project-name-production.up.railway.app';
```

## Step 5: Test the Deployment

1. **Health Check**
   - Visit: `https://your-railway-url/api/health`
   - Should return: `{"status": "ok", "features": ["regular_chat", "pdf_upload", "rag_chat", "file_analysis"]}`

2. **Test API Endpoints**
   - Test file upload: `POST /api/upload-files`
   - Test chat: `POST /api/chat`
   - Test RAG chat: `POST /api/rag-chat`

## Step 6: Configure Custom Domain (Optional)

1. **In Railway Dashboard**
   - Go to your project settings
   - Click on "Domains"
   - Add your custom domain
   - Follow Railway's DNS configuration instructions

## Environment Variables

Railway will automatically set:
- `PORT`: The port your application should listen on
- `RAILWAY_ENVIRONMENT`: The environment (production, preview, etc.)

You can add custom environment variables in the Railway dashboard if needed.

## Monitoring and Logs

- **Logs**: View real-time logs in the Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: Track deployment history and rollback if needed

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check the build logs in Railway dashboard
   - Ensure all dependencies are in `requirements.txt`
   - Verify Dockerfile syntax

2. **Application Not Starting**
   - Check the application logs
   - Verify the start command in `railway.json`
   - Ensure the application listens on `0.0.0.0:$PORT`

3. **CORS Issues**
   - The application is configured to allow all origins (`allow_origins=["*"]`)
   - If you need to restrict CORS, update the CORS configuration in `app.py`

### Useful Commands

```bash
# View logs
railway logs

# Connect to Railway shell
railway shell

# View environment variables
railway variables

# Redeploy
railway up
```

## Cost Considerations

Railway offers:
- **Free tier**: $5 credit monthly
- **Pro plan**: Pay-as-you-go pricing
- **Team plan**: For collaborative projects

Monitor your usage in the Railway dashboard to avoid unexpected charges.

## Security Notes

1. **API Keys**: Never commit API keys to your repository
2. **Environment Variables**: Use Railway's environment variable system
3. **HTTPS**: Railway provides HTTPS by default
4. **CORS**: Currently configured to allow all origins - consider restricting in production

## Next Steps

1. Deploy to Railway using the steps above
2. Update your frontend to use the Railway URL
3. Test the complete system
4. Set up monitoring and alerts
5. Consider setting up a custom domain

## Support

- Railway Documentation: https://docs.railway.app
- Railway Community: https://discord.gg/railway
- Railway Status: https://status.railway.app
