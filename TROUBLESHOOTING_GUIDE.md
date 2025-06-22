# 🔧 Troubleshooting Guide - OAuth & Database Issues

## 🚨 **Issues Identified**

1. **OAuth buttons not visible** on login screen
2. **Database 500 errors** preventing cat data loading
3. **PWA icon missing** (minor issue)

---

## 🔍 **Issue 1: OAuth Buttons Not Showing**

### **Possible Causes:**
- CSS not loading properly
- Component import issue
- Build cache problem

### **Solutions:**

#### **A. Force Browser Cache Refresh**
1. **Hard refresh** your browser: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache** for your domain
3. **Open in incognito/private mode** to test

#### **B. Check Browser Console**
1. **Open browser dev tools** (F12)
2. **Check Console tab** for any JavaScript errors
3. **Look for CSS loading errors** in Network tab

#### **C. Verify Deployment**
1. **Redeploy** the updated `dist/` folder to Cloudflare Pages
2. **Ensure all files** were uploaded correctly
3. **Check deployment logs** in Cloudflare dashboard

#### **D. Test OAuth Components**
**Open browser console and run:**
```javascript
// Check if OAuth components are loaded
console.log('OAuthButtons component:', document.querySelector('.oauth-buttons'));
console.log('Auth divider:', document.querySelector('.auth-divider'));
```

---

## 🗄️ **Issue 2: Database 500 Errors (CRITICAL)**

### **Root Cause:**
The admin migration wasn't applied correctly, causing database schema issues.

### **Solution: Re-run Database Migration**

#### **Step 1: Verify Current Database State**
**Run this in Supabase SQL Editor:**
```sql
-- Check if admin columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_admin';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cats' AND column_name IN ('admin_notes', 'last_updated_by');

-- Check if admin_actions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'admin_actions';
```

#### **Step 2: Re-run Admin Migration**
**Copy and paste the entire `admin-dashboard-migration.sql` again:**

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy ALL content** from `admin-dashboard-migration.sql`
3. **Paste and run** the complete migration
4. **Verify success** - should see "Migration completed successfully!"

#### **Step 3: Check RLS Policies**
**Run this to verify policies:**
```sql
-- Check cats table policies
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'cats';

-- Check profiles table policies  
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

#### **Step 4: Test Database Connection**
**Run this simple test:**
```sql
-- Test basic cat query
SELECT COUNT(*) as total_cats FROM cats;

-- Test profiles table
SELECT COUNT(*) as total_profiles FROM profiles;
```

---

## 🔧 **Issue 3: Quick Fixes**

### **A. Fix PWA Icon Error**
**Add missing icon to `public/icons/` folder:**
1. **Create** `public/icons/` directory if it doesn't exist
2. **Add** a 144x144 PNG icon file named `icon-144x144.png`
3. **Or update** `public/manifest.json` to remove the missing icon reference

### **B. Fix Autocomplete Warnings**
**Add autocomplete attributes to password fields:**
```html
<!-- In AuthModal.jsx, update password inputs: -->
<input
  type="password"
  id="password"
  name="password"
  autoComplete="current-password"
  // ... other props
/>

<input
  type="password"
  id="confirmPassword"
  name="confirmPassword"
  autoComplete="new-password"
  // ... other props
/>
```

---

## 🚀 **Step-by-Step Recovery Process**

### **1. Fix Database Issues First (CRITICAL)**
```sql
-- Run this complete migration in Supabase SQL Editor:
-- [Copy entire content of admin-dashboard-migration.sql]
```

### **2. Verify Database Works**
```sql
-- Test basic functionality
SELECT id, name, status FROM cats LIMIT 5;
SELECT id, email, is_admin FROM profiles LIMIT 5;
```

### **3. Redeploy Application**
1. **Upload new `dist/` folder** to Cloudflare Pages
2. **Clear browser cache** completely
3. **Test in incognito mode**

### **4. Test OAuth Visibility**
1. **Open auth modal** (click Sign In)
2. **Look for OAuth buttons** above email form
3. **Check browser console** for errors

### **5. Test Database Connection**
1. **Refresh the page**
2. **Check if cats load** on the map
3. **Verify no 500 errors** in Network tab

---

## 🎯 **Expected Results After Fixes**

### **OAuth Integration Working:**
- ✅ **Google OAuth button** visible in auth modal
- ✅ **GitHub OAuth button** visible in auth modal
- ✅ **"or continue with email" divider** separating sections
- ✅ **OAuth buttons** have proper styling and hover effects

### **Database Working:**
- ✅ **No 500 errors** in browser console
- ✅ **Cats load** on the map properly
- ✅ **User registration** works without errors
- ✅ **Admin dashboard** accessible (if you're an admin)

### **Complete Functionality:**
- ✅ **Anonymous cat reporting** works
- ✅ **User authentication** works (email + OAuth)
- ✅ **Admin features** work properly
- ✅ **Mobile responsiveness** maintained

---

## 🆘 **If Issues Persist**

### **For OAuth Issues:**
1. **Check network tab** - are CSS files loading?
2. **Inspect element** - is the `.oauth-buttons` div present?
3. **Try different browser** - could be browser-specific issue

### **For Database Issues:**
1. **Check Supabase logs** - Dashboard → Logs
2. **Verify environment variables** are correct
3. **Test with Supabase API directly** in browser console

### **Emergency Fallback:**
If OAuth still doesn't show, the email/password authentication will still work. Users can sign up normally and you can grant admin privileges manually.

---

## 📞 **Next Steps**

1. **Run database migration** first (most critical)
2. **Redeploy application** with cache clearing
3. **Test OAuth visibility** in fresh browser session
4. **Report back** with any remaining issues

**The database migration is the most critical fix - this should resolve the 500 errors and restore full functionality.** 🗄️✨
