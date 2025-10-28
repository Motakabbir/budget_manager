# Vercel Deployment Guide

This guide will help you deploy your Budget Manager application to Vercel with CI/CD automation.

## Prerequisites

- A [Vercel](https://vercel.com) account
- A GitHub repository with your code
- Access to your repository's Settings > Secrets

## Setup Instructions

### 1. Install Vercel CLI (Optional for local testing)

```bash
npm install -g vercel
```

### 2. Link Your Project to Vercel

There are two ways to set up your project:

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

6. Click "Deploy"

#### Option B: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Link your project (run in project root)
vercel link

# Follow the prompts to link to your Vercel project
```

### 3. Get Vercel Tokens and IDs

After linking your project, you need to get three secrets:

#### Get VERCEL_TOKEN

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Create a new token with a descriptive name (e.g., "GitHub Actions")
3. Copy the token (you won't be able to see it again)

#### Get VERCEL_ORG_ID and VERCEL_PROJECT_ID

**Method 1: From .vercel/project.json** (if you used Vercel CLI)

```bash
cat .vercel/project.json
```

**Method 2: From Vercel Dashboard**

- `VERCEL_ORG_ID`: Found in your Team Settings URL or Account Settings
- `VERCEL_PROJECT_ID`: Found in Project Settings → General → Project ID

### 4. Add GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - Name: `VERCEL_TOKEN`, Value: Your Vercel token
   - Name: `VERCEL_ORG_ID`, Value: Your organization ID
   - Name: `VERCEL_PROJECT_ID`, Value: Your project ID

### 5. Configure Environment Variables in Vercel

Add your environment variables in the Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for all environments (Production, Preview, Development):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## How CI/CD Works

### Automatic Deployments

- **Production Deployment**: Automatically triggers when you push to the `main` branch
- **Preview Deployment**: Automatically triggers when you create or update a pull request

### Workflow Files

- `.github/workflows/vercel-deploy.yml`: Handles production deployments
- `.github/workflows/vercel-preview.yml`: Handles preview deployments

### Deployment Process

1. Code is pushed to GitHub
2. GitHub Actions workflow is triggered
3. Vercel CLI pulls environment configuration
4. Project is built
5. Built artifacts are deployed to Vercel
6. Vercel provides a deployment URL

## Manual Deployment (Alternative)

If you prefer to deploy manually or test locally:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Remove a deployment
vercel rm [deployment-url]

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME
```

## Troubleshooting

### Build Fails

1. Check your environment variables are set correctly in Vercel
2. Ensure `package.json` has the correct build script
3. Check Vercel build logs for specific errors

### Environment Variables Not Working

1. Make sure variables are prefixed with `VITE_`
2. Verify variables are set for the correct environment (Production/Preview)
3. Redeploy after adding new environment variables

### GitHub Actions Fails

1. Verify all three secrets are added to GitHub:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
2. Check that the token has not expired
3. Review the Actions logs for specific errors

## Domain Configuration

### Add Custom Domain

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Click **Add** and enter your domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Security Best Practices

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Regularly rotate your Vercel tokens
- Use different Supabase keys for production and preview environments
- Enable Vercel's Security Headers (already configured in `vercel.json`)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions for Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## Support

If you encounter issues:

- Check [Vercel's Status Page](https://www.vercel-status.com/)
- Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
- Review GitHub Actions logs in your repository
