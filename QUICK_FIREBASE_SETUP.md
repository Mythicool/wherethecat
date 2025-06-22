# 🚀 Quick Firebase Setup - Fix the Errors

You're seeing "Missing or insufficient permissions" because Firebase isn't fully set up yet. Here's the quickest way to fix it:

## Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com/
2. Select your project: **new-thing-fd130**

## Step 2: Enable Authentication (2 minutes)

1. Click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Google"** → Toggle **"Enable"** → **Save**
5. Click **"Anonymous"** → Toggle **"Enable"** → **Save**

## Step 3: Create Firestore Database (1 minute)

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (important!)
4. Select location: **us-central** (or closest to you)
5. Click **"Done"**

## Step 4: Enable Storage (Optional - 1 minute)

**Note**: If you don't see "Storage" in your Firebase console, it might not be available on your plan. That's okay - the app will work without photo uploads.

If you see "Storage" in the left sidebar:
1. Click **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Use same location as Firestore
5. Click **"Done"**

If you don't see "Storage", skip this step - the app will work fine without photo uploads.

## Step 5: Deploy Security Rules (1 minute)

### For Firestore:
1. In Firestore → **"Rules"** tab
2. Replace the content with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
3. Click **"Publish"**

### For Storage (Only if you enabled Storage):
1. In Storage → **"Rules"** tab
2. Replace the content with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```
3. Click **"Publish"**

**If you skipped Storage setup**, that's fine - the app will work without photo uploads.

## Step 6: Test Your App

1. Refresh your browser at http://localhost:5176
2. Try clicking "Sign In" → "Continue with Google"
3. Try "Continue Anonymously"
4. Try clicking on the map to report a cat

## ✅ Success Indicators

You'll know it's working when:
- No more "Missing or insufficient permissions" errors
- Google sign-in works (popup or redirect)
- Anonymous sign-in works
- You can submit cat reports
- Data appears in your Firebase console

## 🐛 Still Having Issues?

### If Google sign-in still fails:
- Check that Google provider is enabled in Firebase Auth
- Try "Continue Anonymously" instead
- Check browser console for specific error messages

### If you see "popup blocked" errors:
- Allow popups for localhost in your browser
- The app will automatically try redirect as fallback

### If Firestore errors persist:
- Make sure you selected "Start in test mode"
- Verify the security rules are published
- Check that your project ID matches in .env.local

## 🔒 Security Note

The rules above are for **testing only** and allow anyone to read/write data. After testing, you should implement proper security rules using the examples in the `firestore.rules` and `storage.rules` files.

---

**Total setup time: ~5 minutes**

Once this is done, your Firebase migration will be complete and all the Supabase errors will be resolved!
