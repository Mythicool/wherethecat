# 🚀 Netlify Deployment Troubleshooting Guide

## Overview
This guide helps resolve issues where the "Where The Cat?" app loads locally but fails on Netlify deployment.

## 🔍 **Most Common Issues & Solutions**

### 1. **Database Migration Not Applied**
**Symptoms**: App loads locally but crashes on Netlify with database errors

**Solution**:
1. **Run the database migration** in your Supabase SQL Editor:
   ```sql
   -- Copy and paste the content from database-compatibility-migration.sql
   ```
2. **Verify the migration** worked by checking if the `reporter_type` column exists
3. **Redeploy** to Netlify after migration

### 2. **Environment Variables Missing**
**Symptoms**: App shows "Supabase not configured" or demo data

**Solution**:
1. **Check Netlify environment variables**:
   - Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
   - Ensure these are set:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
2. **Redeploy** after adding variables

### 3. **Build Errors**
**Symptoms**: Netlify build fails during deployment

**Solution**:
1. **Check build logs** in Netlify dashboard
2. **Common fixes**:
   - Ensure Node.js version is 18+ in Netlify settings
   - Check for missing dependencies
   - Verify all imports are correct

### 4. **HTTPS/Security Issues**
**Symptoms**: App loads but features don't work (geolocation, PWA)

**Solution**:
- Netlify automatically provides HTTPS, but ensure your Supabase URL uses HTTPS
- Check browser console for mixed content warnings

## 🛠️ **Step-by-Step Deployment Process**

### Step 1: Prepare Database
```sql
-- In Supabase SQL Editor, run:
-- (Copy content from database-compatibility-migration.sql)
```

### Step 2: Build Locally
```bash
npm run build
# Verify no errors in build output
```

### Step 3: Deploy to Netlify
1. **Drag and drop** the `dist` folder to Netlify
2. **Or connect GitHub** for automatic deployments

### Step 4: Configure Environment Variables
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Test Deployment
1. **Visit your Netlify URL**
2. **Check browser console** for errors
3. **Test basic functionality**

## 🐛 **Debugging Tools**

### Enable Debug Mode
Add `?debug=true` to your Netlify URL:
```
https://your-site.netlify.app?debug=true
```

This will show:
- Device information
- Database connection status
- Supabase configuration
- Error details

### Check Browser Console
1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Look for error messages**
4. **Check Network tab** for failed requests

### Database Health Check
The app now includes automatic database health checking that logs:
- Supabase configuration status
- Database connectivity
- Schema compatibility
- Available features

## 📋 **Deployment Checklist**

### Before Deployment
- [ ] **Database migration** applied in Supabase
- [ ] **Local build** completes without errors
- [ ] **Environment variables** ready
- [ ] **Supabase project** is active and accessible

### After Deployment
- [ ] **Site loads** without errors
- [ ] **Environment variables** are set in Netlify
- [ ] **Database connection** works
- [ ] **Basic features** function (viewing cats, adding reports)
- [ ] **Mobile compatibility** verified

### Testing
- [ ] **Desktop browser** loads correctly
- [ ] **Mobile browser** (iPhone Safari, Android Chrome) works
- [ ] **PWA features** available (install prompt, offline mode)
- [ ] **Geolocation** functions (if permissions granted)

## 🔧 **Common Error Messages & Fixes**

### "Failed to load cat reports"
**Cause**: Database connection or schema issues
**Fix**: 
1. Check environment variables
2. Run database migration
3. Verify Supabase project is active

### "Supabase not configured"
**Cause**: Missing or incorrect environment variables
**Fix**: 
1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify
2. Ensure URLs don't have trailing slashes
3. Redeploy after setting variables

### "Column 'reporter_type' does not exist"
**Cause**: Database migration not applied
**Fix**: 
1. Run `database-compatibility-migration.sql` in Supabase
2. Verify column exists in database
3. Redeploy application

### "Network error" or "Permission denied"
**Cause**: Supabase RLS policies or network issues
**Fix**: 
1. Check Supabase RLS policies
2. Verify anon key has correct permissions
3. Check network connectivity

## 🎯 **Fallback Strategies**

The app now includes several fallback strategies:

### 1. **Demo Data Fallback**
- If Supabase is not configured, shows demo cats
- Allows testing app functionality without database

### 2. **Schema Compatibility**
- Automatically detects missing database features
- Gracefully handles older database schemas
- Removes unsupported fields from database operations

### 3. **Error Recovery**
- User-friendly error messages
- Automatic retry mechanisms
- Graceful degradation of features

## 📞 **Getting Help**

### Debug Information to Collect
1. **Netlify build logs**
2. **Browser console errors**
3. **Database health check results** (from debug mode)
4. **Supabase project status**
5. **Environment variable configuration**

### Quick Fixes to Try
1. **Clear browser cache** and reload
2. **Redeploy** the site in Netlify
3. **Check Supabase dashboard** for service status
4. **Verify environment variables** are correct
5. **Run database migration** if not done already

## 🎉 **Success Indicators**

Your deployment is successful when:
- [ ] **App loads** without errors on Netlify URL
- [ ] **Cat map displays** with markers
- [ ] **Forms work** for adding cat reports
- [ ] **Mobile version** loads and functions properly
- [ ] **PWA features** are available
- [ ] **Database operations** complete successfully

## 🔮 **Advanced Troubleshooting**

### Check Netlify Function Logs
```bash
# If using Netlify functions
netlify dev
netlify logs
```

### Verify Supabase Connection
```javascript
// Test in browser console
fetch('https://your-project-id.supabase.co/rest/v1/cats?select=id&limit=1', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
```

### Database Direct Query Test
```sql
-- In Supabase SQL Editor
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cats';
```

---

**Remember**: The app is now designed to be resilient and will work even if some features aren't available. The key is ensuring basic database connectivity and proper environment variable configuration! 🚀✨
