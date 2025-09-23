# Complete Deployment Guide: Railway Backend + Vercel Frontend

This guide will help you deploy your PDF RAG Chat system with the backend on Railway and frontend on Vercel.

## Architecture Overview

- **Backend (Railway)**: FastAPI application with PDF processing and RAG capabilities
- **Frontend (Vercel)**: Next.js application with modern UI
- **Communication**: Frontend makes API calls to Railway backend

## Part 1: Deploy Backend to Railway

### Step 1: Prepare for Railway Deployment

The following files have been created for Railway deployment:
- `Dockerfile` - Container configuration
- `railway.json` - Railway deployment settings
- `.dockerignore` - Optimize build process
- `api/requirements.txt` - Python dependencies

### Step 2: Deploy to Railway

#### Option A: Using Railway Web Dashboard (Recommended)

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

4. **Get Your Railway URL**
   - After deployment, Railway will provide a URL like:
   - `https://your-project-name-production.up.railway.app`

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to your project
cd /Users/ismgonza/Documents/projects/repositories/learning/The-AI-Engineer-Challenge

# Initialize Railway project
railway init

# Deploy to Railway
railway up
```

### Step 3: Test Railway Backend

1. **Health Check**
   - Visit: `https://your-railway-url/api/health`
   - Should return: `{"status": "ok", "features": ["regular_chat", "pdf_upload", "rag_chat", "file_analysis"]}`

2. **Test API Endpoints**
   - Test file upload: `POST /api/upload-files`
   - Test chat: `POST /api/chat`
   - Test RAG chat: `POST /api/rag-chat`

## Part 2: Configure Frontend for Railway Backend

### Step 1: Update Frontend Configuration

1. **Update Environment Variables**
   - Edit `frontend/.env.local`
   - Replace the API base URL with your Railway URL:

```bash
# Change this line in frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://your-project-name-production.up.railway.app
```

2. **Test Locally**
   ```bash
   cd frontend
   npm run dev
   ```
   - Visit `http://localhost:3000`
   - Test that the frontend can communicate with Railway backend

### Step 2: Deploy Frontend to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"

2. **Import Repository**
   - Select your `The-AI-Engineer-Challenge` repository
   - Choose the `feature/pdf-rag-system` branch

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Set Environment Variables**
   - In Vercel dashboard, go to your project settings
   - Add environment variable:
     - Name: `NEXT_PUBLIC_API_BASE_URL`
     - Value: `https://your-railway-url/api`

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend

## Part 3: Final Configuration

### Step 1: Update CORS Settings (if needed)

If you encounter CORS issues, the backend is already configured to allow all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 2: Test Complete System

1. **Test Frontend → Backend Communication**
   - Visit your Vercel frontend URL
   - Try uploading a PDF file
   - Test the chat functionality
   - Test RAG mode with uploaded documents

2. **Monitor Logs**
   - Railway: View logs in Railway dashboard
   - Vercel: View logs in Vercel dashboard

## Part 4: Custom Domain (Optional)

### Railway Custom Domain

1. **In Railway Dashboard**
   - Go to your project settings
   - Click on "Domains"
   - Add your custom domain (e.g., `api.yourdomain.com`)
   - Follow Railway's DNS configuration instructions

2. **Update Frontend Configuration**
   - Update `NEXT_PUBLIC_API_BASE_URL` to use your custom domain
   - Redeploy frontend to Vercel

### Vercel Custom Domain

1. **In Vercel Dashboard**
   - Go to your project settings
   - Click on "Domains"
   - Add your custom domain
   - Follow Vercel's DNS configuration instructions

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Railway/Vercel dashboard
   - Ensure all dependencies are properly specified
   - Verify file paths and configurations

2. **CORS Issues**
   - Backend is configured to allow all origins
   - If issues persist, check Railway URL format

3. **API Connection Issues**
   - Verify Railway URL is correct
   - Check that Railway service is running
   - Test API endpoints directly

4. **Environment Variables**
   - Ensure `NEXT_PUBLIC_API_BASE_URL` is set correctly
   - Check that environment variables are deployed

### Useful Commands

```bash
# Railway CLI
railway logs          # View Railway logs
railway shell         # Connect to Railway shell
railway variables     # View environment variables

# Local testing
cd frontend
npm run dev          # Test frontend locally
npm run build        # Test build process
```

## Cost Considerations

### Railway
- **Free tier**: $5 credit monthly
- **Pro plan**: Pay-as-you-go pricing
- Monitor usage in Railway dashboard

### Vercel
- **Free tier**: Generous limits for personal projects
- **Pro plan**: For production applications
- Monitor usage in Vercel dashboard

## Security Notes

1. **API Keys**: Never commit API keys to repository
2. **Environment Variables**: Use Railway/Vercel environment variable systems
3. **HTTPS**: Both Railway and Vercel provide HTTPS by default
4. **CORS**: Currently configured to allow all origins - consider restricting in production

## Monitoring and Maintenance

1. **Set up monitoring** for both Railway and Vercel
2. **Monitor costs** in both platforms
3. **Set up alerts** for service downtime
4. **Regular updates** of dependencies
5. **Backup strategies** for important data

## Next Steps

1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Test complete system
4. Set up monitoring and alerts
5. Consider custom domains
6. Plan for scaling and maintenance

## Support Resources

- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs
