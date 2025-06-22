# 🚀 Deployment Checklist for "Where The Cat?"

## Pre-Deployment Checklist

### ✅ Database Setup
- [ ] **Run database migration** in Supabase SQL Editor
  ```sql
  -- Copy and paste content from anonymous-reporting-migration.sql
  ```
- [ ] **Verify migration success** with verification queries
- [ ] **Test anonymous reporting** works in development
- [ ] **Confirm RLS policies** are active

### ✅ Code Preparation
- [ ] **Uncomment reporter_type** in `src/App.jsx` (if not already done)
- [ ] **Test build locally**: `npm run build:test`
- [ ] **Fix any linting errors**: `npm run lint`
- [ ] **Test geolocation features** in development
- [ ] **Commit all changes** to git

### ✅ Environment Variables
- [ ] **Get Supabase URL** from dashboard (Settings → API)
- [ ] **Get Supabase anon key** from dashboard (Settings → API)
- [ ] **Create .env.local** for local testing (copy from .env.example)
- [ ] **Test with environment variables** locally

## Deployment Steps

### 1. 📁 Repository Setup
```bash
# Ensure code is committed and pushed
git add .
git commit -m "Ready for deployment with geolocation features"
git push origin main
```

### 2. 🌐 Netlify Setup
- [ ] **Create Netlify account** (if needed)
- [ ] **Connect GitHub repository**
- [ ] **Configure build settings**:
  - Base directory: (leave empty)
  - Build command: `npm run build`
  - Publish directory: `dist`

### 3. 🔧 Environment Configuration
In Netlify Dashboard → Site Settings → Environment Variables:
- [ ] **Add VITE_SUPABASE_URL**: `https://your-project-id.supabase.co`
- [ ] **Add VITE_SUPABASE_ANON_KEY**: `your-supabase-anon-key`
- [ ] **Set scopes**: Production, Deploy previews, Branch deploys

### 4. 🚀 Deploy
- [ ] **Trigger deployment** (automatic on push or manual)
- [ ] **Monitor build logs** for errors
- [ ] **Wait for deployment** to complete (2-3 minutes)

## Post-Deployment Testing

### 🧪 Core Functionality
- [ ] **Site loads** without errors
- [ ] **Map displays** with tiles loading
- [ ] **Demo cat markers** appear on map
- [ ] **Click map** to open cat form
- [ ] **Submit cat report** (test with demo data)

### 📍 Geolocation Features
- [ ] **"Use My Location" button** appears on map
- [ ] **"Use My Location" button** appears in cat form
- [ ] **Location permission** request works
- [ ] **GPS coordinates** are detected and displayed
- [ ] **Map centers** on user location
- [ ] **User location marker** (blue dot) appears
- [ ] **Accuracy circle** displays around user location
- [ ] **Accuracy indicators** show in form (color-coded)

### 👤 Anonymous Reporting
- [ ] **Submit report without login** works
- [ ] **Anonymous reports** have semi-transparent markers
- [ ] **Anonymous badge** shows in map popups
- [ ] **Privacy notice** displays in form
- [ ] **Success message** mentions sign-up option

### 📱 Mobile Testing
- [ ] **Responsive design** works on mobile
- [ ] **Touch interactions** work properly
- [ ] **Geolocation** works on mobile browsers
- [ ] **Form inputs** are mobile-friendly
- [ ] **Map controls** are touch-accessible

### 🔒 Security & Performance
- [ ] **HTTPS enabled** (required for geolocation)
- [ ] **No console errors** in browser
- [ ] **Fast loading** (< 3 seconds)
- [ ] **Proper caching** headers
- [ ] **CSP headers** working

## Error Troubleshooting

### 🚨 Common Build Errors

#### "Command failed with exit code 1"
```bash
# Test build locally first
npm run build:test
```

#### "Module not found"
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 🚨 Runtime Errors

#### "Supabase client not configured"
- **Check**: Environment variables in Netlify dashboard
- **Verify**: VITE_SUPABASE_URL format is correct
- **Confirm**: Using anon key, not service_role key

#### "Geolocation not working"
- **Check**: Site is served over HTTPS
- **Test**: Different browsers and devices
- **Verify**: Error messages display properly

#### "Anonymous reporting fails"
- **Check**: Database migration was applied
- **Verify**: RLS policies allow anonymous inserts
- **Test**: reporter_type field is uncommented in code

### 🚨 Performance Issues

#### "Slow loading"
- **Check**: Bundle size with `npm run build`
- **Optimize**: Large images or assets
- **Verify**: CDN and caching are working

## Success Criteria

### ✅ Deployment Successful When:
- [ ] **Site accessible** via Netlify URL
- [ ] **All features working** as in development
- [ ] **No JavaScript errors** in console
- [ ] **Geolocation functional** on desktop and mobile
- [ ] **Anonymous reporting** works without login
- [ ] **Database operations** succeed
- [ ] **Performance acceptable** (Lighthouse score > 80)

## Post-Launch Tasks

### 📊 Monitoring Setup
- [ ] **Enable Netlify Analytics** (optional)
- [ ] **Set up error monitoring** (Sentry, etc.)
- [ ] **Monitor Supabase usage** and quotas
- [ ] **Check performance** with Lighthouse

### 🔄 Maintenance
- [ ] **Document deployment process** for team
- [ ] **Set up automated backups** for database
- [ ] **Plan for dependency updates**
- [ ] **Monitor user feedback** and issues

### 🎯 Optional Enhancements
- [ ] **Custom domain** setup
- [ ] **SEO optimization** (meta tags, sitemap)
- [ ] **Analytics integration** (Google Analytics)
- [ ] **Progressive Web App** features
- [ ] **Offline functionality**

## Quick Commands Reference

```bash
# Test build locally
npm run build:test

# Deploy to Netlify (if CLI installed)
npm run deploy:netlify

# Start local development
npm run dev

# Preview production build
npm run serve

# Check for issues
npm run lint
```

## Support Resources

- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **React Leaflet**: [react-leaflet.js.org](https://react-leaflet.js.org)

---

🎉 **Congratulations!** Your cat reporting app with geolocation is now live and helping the community find cats! 🐱📍
