# Environment Variables Setup for Production

## Overview
This guide explains how to configure environment variables for deploying "Where The Cat?" to Netlify.

## Required Environment Variables

### Supabase Configuration
You need these two essential variables from your Supabase project:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

## How to Get Supabase Credentials

### 1. Get Your Supabase URL
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL**
   - Format: `https://kgitpwrxwzzercfmrmcx.supabase.co`

### 2. Get Your Supabase Anon Key
1. In the same **Settings** → **API** page
2. Copy the **anon/public** key (not the service_role key!)
3. This key is safe to expose in the browser

## Setting Up Environment Variables in Netlify

### Method 1: Netlify Dashboard
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add each variable:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Scopes**: Select all (Production, Deploy previews, Branch deploys)
5. Repeat for `VITE_SUPABASE_ANON_KEY`

### Method 2: Netlify CLI
```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://your-project-id.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-supabase-anon-key-here"
```

### Method 3: netlify.toml (Not Recommended for Secrets)
```toml
[build.environment]
  VITE_SUPABASE_URL = "https://your-project-id.supabase.co"
  # Don't put the anon key here - use the dashboard instead
```

## Local Development Setup

### 1. Create .env.local file
```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 2. Verify Environment Variables
Add this to your `src/lib/supabase.js` to verify:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

## Security Best Practices

### ✅ Safe to Expose (Frontend)
- `VITE_SUPABASE_URL` - Your project URL
- `VITE_SUPABASE_ANON_KEY` - Public/anon key (designed for browser use)
- Any `VITE_` prefixed variables

### ❌ Never Expose (Keep Secret)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- Database passwords
- API keys for external services
- Any secrets without `VITE_` prefix

## Troubleshooting

### Common Issues

#### 1. "Supabase client not configured"
- **Cause**: Missing or incorrect environment variables
- **Solution**: Verify variables are set correctly in Netlify dashboard

#### 2. "Invalid API key"
- **Cause**: Using wrong key or expired key
- **Solution**: Double-check you're using the **anon/public** key, not service_role

#### 3. "CORS errors"
- **Cause**: Supabase URL mismatch
- **Solution**: Ensure URL exactly matches your Supabase project URL

#### 4. Variables not loading
- **Cause**: Missing `VITE_` prefix
- **Solution**: All frontend variables must start with `VITE_`

### Verification Steps
1. **Check Netlify logs** during build for environment variable loading
2. **Test in browser console**: `console.log(import.meta.env)`
3. **Verify Supabase connection** in Network tab of DevTools

## Optional Environment Variables

### App Configuration
```bash
VITE_APP_NAME="Where The Cat?"
VITE_APP_VERSION=1.0.0
```

### Analytics (if needed later)
```bash
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_SENTRY_DSN=your-sentry-dsn
```

### Feature Flags
```bash
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

## Production Checklist

- [ ] Supabase URL configured
- [ ] Supabase anon key configured
- [ ] Environment variables set in Netlify
- [ ] Build succeeds without errors
- [ ] App connects to Supabase successfully
- [ ] Geolocation features work
- [ ] Anonymous reporting functions
- [ ] No console errors in production
