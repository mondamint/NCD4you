# NCDs 4YOU - Deployment Guide
## GitHub + Supabase + Railway + Vercel

This guide will walk you through deploying the NCDs 4YOU application using modern cloud services.

## Architecture Overview

- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (FastAPI + Python)
- **Database**: Supabase (PostgreSQL)
- **Source Control**: GitHub

---

## Prerequisites

Before you begin, create accounts for:

1. [GitHub](https://github.com) - Free
2. [Supabase](https://supabase.com) - Free tier available
3. [Railway](https://railway.app) - Free tier available (requires GitHub login)
4. [Vercel](https://vercel.com) - Free tier available (requires GitHub login)

---

## Step 1: Set Up Supabase Database

### 1.1 Create a New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `ncds-4you` (or any name you prefer)
   - **Database Password**: Choose a strong password (SAVE THIS!)
   - **Region**: Choose closest to your location (e.g., Southeast Asia)
4. Click "Create new project" (takes 1-2 minutes)

### 1.2 Run Database Migration

1. Once your project is ready, go to the **SQL Editor** in the left sidebar
2. Click "New Query"
3. Open the file `supabase_migration.sql` from this project
4. **Copy the entire contents** and paste into the SQL Editor
5. Click "Run" (bottom right)
6. You should see: "Success. No rows returned"

### 1.3 Get Database Connection String

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **Database** section
3. Scroll to **Connection String** section
4. Select **URI** tab
5. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the database password you created in step 1.1
7. **SAVE THIS CONNECTION STRING** - you'll need it later

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository (if not already done)

Open terminal in your project folder (`C:\Dev Dev\NCDs 4YOU`) and run:

```bash
git init
git add .
git commit -m "Initial commit - NCDs 4YOU application"
```

### 2.2 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon → "New repository"
3. Fill in:
   - **Repository name**: `ncds-4you`
   - **Visibility**: Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license
4. Click "Create repository"

### 2.3 Push to GitHub

Copy the commands from GitHub (under "...or push an existing repository from the command line"):

```bash
git remote add origin https://github.com/YOUR-USERNAME/ncds-4you.git
git branch -M main
git push -u origin main
```

**Replace `YOUR-USERNAME` with your GitHub username**

---

## Step 3: Deploy Backend to Railway

### 3.1 Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select the `ncds-4you` repository

### 3.2 Configure Backend Service

1. Railway will detect your `Procfile` and start building
2. Click on the service card (should show "backend")
3. Go to **Variables** tab
4. Add the following environment variables:

   | Variable Name | Value |
   |--------------|-------|
   | `DATABASE_URL` | Paste the Supabase connection string from Step 1.3 |
   | `SECRET_KEY` | Generate a random string (e.g., `openssl rand -hex 32`) |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hours) |
   | `CORS_ORIGINS` | `*` (or your Vercel domain later) |

   **IMPORTANT**: Replace the `SECRET_KEY` with a secure random string!

### 3.3 Get Backend URL

1. Go to **Settings** tab
2. Scroll to **Networking** section
3. Click "Generate Domain"
4. Copy the domain (e.g., `your-app-production.up.railway.app`)
5. **SAVE THIS URL** - format: `https://your-app-production.up.railway.app`

### 3.4 Wait for Deployment

- Railway will automatically build and deploy
- Watch the **Deployments** tab for progress
- Once deployed, you should see "Success" status
- Test by visiting: `https://your-railway-url.railway.app/docs`
- You should see the FastAPI documentation page

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Update Frontend Configuration

Before deploying, you need to update the API URL:

1. In your project, create a new file: `frontend/dist/.gitkeep` (to ensure dist folder exists in git)
2. Copy `config.js.example` to `config.js`
3. Edit `config.js` and replace the API_URL with your Railway backend URL:
   ```javascript
   window.globalConfig = {
       API_URL: "https://your-railway-url.railway.app"
   };
   ```
4. Commit and push:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

### 4.2 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your `ncds-4you` repository from GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as `./`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`

### 4.3 Add Environment Variables (if needed)

Currently, the app uses `config.js` for configuration, so no environment variables are needed.

### 4.4 Deploy

1. Click "Deploy"
2. Wait 1-2 minutes for deployment to complete
3. Once done, Vercel will show your live URL (e.g., `ncds-4you.vercel.app`)
4. Click "Visit" to open your application

---

## Step 5: Test Your Deployment

### 5.1 Test Backend API

Visit: `https://your-railway-url.railway.app/docs`

- You should see FastAPI interactive documentation
- Try the `/login` endpoint with default credentials:
  - Username: `admin`
  - Password: `admin123`

### 5.2 Test Frontend Application

1. Open your Vercel URL: `https://your-app.vercel.app`
2. You should see the login page
3. Login with:
   - Username: `admin`
   - Password: `admin123`
4. You should be redirected to the dashboard

### 5.3 Verify Database Connection

1. After logging in, try creating a test user from User Management page
2. Check Supabase dashboard → Table Editor → `users` table
3. You should see the new user record

---

## Step 6: Update CORS Settings (Security)

Once everything works, secure your backend:

### 6.1 Update Railway Environment Variables

1. Go to Railway → Your Backend Service → Variables
2. Update `CORS_ORIGINS` from `*` to your Vercel domain:
   ```
   https://your-app.vercel.app
   ```
3. If you need multiple domains, separate with commas:
   ```
   https://your-app.vercel.app,https://your-custom-domain.com
   ```

### 6.2 Optionally Update in Code

Edit `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then commit and push to trigger a new Railway deployment.

---

## Step 7: Change Default Admin Password

**IMPORTANT SECURITY STEP!**

1. Login to your deployed application
2. Go to User Management
3. Edit the `admin` user
4. Change the password from `admin123` to a strong password
5. Save

---

## Troubleshooting

### Frontend Can't Connect to Backend

**Problem**: Login fails or API errors in browser console

**Solution**:
1. Check `config.js` has correct Railway backend URL
2. Check Railway backend is running (visit `/docs` endpoint)
3. Check browser console for CORS errors
4. Verify CORS_ORIGINS in Railway includes your Vercel domain

### Database Connection Errors on Railway

**Problem**: Backend logs show "Could not connect to database"

**Solution**:
1. Verify `DATABASE_URL` in Railway Variables
2. Check Supabase database is running (not paused)
3. Make sure password in DATABASE_URL is correct
4. Check if Supabase has any connection limits

### Build Fails on Vercel

**Problem**: Vercel build fails with npm errors

**Solution**:
1. Check that `frontend/package.json` exists
2. Verify build command: `cd frontend && npm install && npm run build`
3. Check build logs for specific error messages
4. Try running `npm install` and `npm run build` locally first

### Railway Build Fails

**Problem**: Railway shows "Build failed" or "Deploy failed"

**Solution**:
1. Check that `Procfile` exists in root directory
2. Check that `requirements.txt` is in `backend/` folder
3. Verify Python version in `runtime.txt` is supported
4. Check Railway build logs for specific errors

---

## Updating Your Application

### Update Backend

1. Make changes to backend code locally
2. Test locally with `python run_app.py`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend: description of changes"
   git push
   ```
4. Railway will automatically detect changes and redeploy

### Update Frontend

1. Make changes to frontend code locally
2. Test locally with `npm run dev` in `frontend/` folder
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update frontend: description of changes"
   git push
   ```
4. Vercel will automatically detect changes and redeploy

### Update Database Schema

1. Make changes in Supabase SQL Editor
2. Update `backend/models.py` to match
3. Test locally
4. Push code changes to trigger Railway redeploy

---

## Cost Estimates (Free Tiers)

All services have generous free tiers:

- **Supabase**: 500MB database, 2GB transfer/month
- **Railway**: $5 credit/month (approximately 500 hours of runtime)
- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **GitHub**: Unlimited public/private repositories

**Total monthly cost**: $0 (within free tier limits)

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `ncds.yourdomain.com`)
3. Follow DNS configuration instructions
4. Update Railway `CORS_ORIGINS` to include your custom domain

### Add Custom Domain to Railway (Optional)

1. Railway → Your Service → Settings → Custom Domain
2. Add your API domain (e.g., `api.ncds.yourdomain.com`)
3. Configure DNS as instructed
4. Update `config.js` frontend to use new API domain

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Vite Docs**: https://vitejs.dev

---

## Security Checklist

Before going to production:

- [ ] Changed default admin password
- [ ] Set strong `SECRET_KEY` in Railway
- [ ] Configured proper `CORS_ORIGINS` (not `*`)
- [ ] Enabled HTTPS (automatic on Vercel & Railway)
- [ ] Review Supabase Row Level Security policies
- [ ] Set up database backups in Supabase
- [ ] Monitor Railway usage to stay within free tier
- [ ] Review user permissions and roles

---

## Next Steps

1. **Add More Users**: Use the User Management page to add hospital and HC users
2. **Import Patient Data**: Use the Excel import feature to bulk import patients
3. **Configure Zones**: Set up health center zones based on your regions
4. **Backup Data**: Regularly export data from Supabase dashboard
5. **Monitor Usage**: Check Railway and Vercel dashboards for usage stats

---

**Congratulations!** Your NCDs 4YOU application is now deployed and accessible worldwide.

For questions or issues, refer to the official documentation links above.
