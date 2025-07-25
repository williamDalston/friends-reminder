# GitHub Pages Deployment Guide

## 🚨 **White Screen Fix for GitHub Pages**

### **Step 1: Enable GitHub Pages**
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. This will use the workflow we created in `.github/workflows/deploy.yml`

### **Step 2: Push Your Changes**
```bash
git add .
git commit -m "Fix GitHub Pages deployment"
git push origin main
```

### **Step 3: Check the Deployment**
1. Go to your repository on GitHub
2. Click **Actions** tab
3. You should see a workflow running called "Deploy to GitHub Pages"
4. Wait for it to complete (green checkmark)
5. Your site will be available at: `https://[username].github.io/[repository-name]`

## 🔍 **Debugging Steps**

### **If you still see a white screen:**

#### **1. Check Browser Console**
1. Open your GitHub Pages site
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for any error messages
5. You should see these debug logs:
   - `"main.jsx loading..."`
   - `"firebase.js loading..."`
   - `"App component rendering..."`

#### **2. Check Network Tab**
1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for any failed requests (red entries)
4. Check if all JavaScript files are loading

#### **3. Common Issues & Solutions**

**Issue: "Failed to load resource"**
- Check if your repository name matches the URL
- Make sure the GitHub Actions workflow completed successfully

**Issue: "Firebase not initialized"**
- Check if your Firebase project allows your GitHub Pages domain
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add: `[username].github.io`

**Issue: "Module not found"**
- The build should handle this automatically
- Check if all files are in the `dist` folder

#### **4. Manual Deployment (Alternative)**

If GitHub Actions doesn't work:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Create a new branch called `gh-pages`:**
   ```bash
   git checkout -b gh-pages
   ```

3. **Copy dist contents to root:**
   ```bash
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

4. **In GitHub Settings → Pages:**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages**
   - Folder: **/ (root)**

## 🛠️ **Troubleshooting Commands**

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build

# Test locally
npm run preview

# Check for errors
npm run build 2>&1 | grep -i error

# Check file sizes
ls -la dist/assets/
```

## 📋 **Checklist**

- ✅ **GitHub Actions workflow** created
- ✅ **404.html** for SPA routing
- ✅ **Redirect script** in index.html
- ✅ **Base path** set to `./` in vite.config.js
- ✅ **Error boundary** added
- ✅ **Debug logging** added
- ✅ **Firebase domain** whitelisted

## 🔧 **Firebase Configuration**

Make sure your Firebase project has:
1. **Authentication** enabled with Google sign-in
2. **Firestore Database** created
3. **Storage** enabled
4. **Authorized domains** include your GitHub Pages domain

## 📞 **Still Having Issues?**

1. **Check the GitHub Actions logs** for build errors
2. **Open browser console** and look for specific error messages
3. **Test locally** with `npm run preview` first
4. **Check if Firebase is working** by looking for auth errors

The debug logs will help identify exactly where the issue is occurring! 