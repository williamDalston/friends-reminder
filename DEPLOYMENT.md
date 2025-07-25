# Deployment Guide

## Common White Screen Issues & Solutions

### 1. **Firebase Configuration**
- ✅ Firebase config is hardcoded in `src/firebase.js`
- ✅ No environment variables needed
- ✅ Should work in production

### 2. **Build Configuration**
- ✅ Updated `vite.config.js` with proper base path (`./`)
- ✅ Added chunk splitting for better performance
- ✅ Increased chunk size warning limit

### 3. **Error Handling**
- ✅ Added Error Boundary component
- ✅ Added loading states
- ✅ Added console logging for debugging

### 4. **Deployment Checklist**

#### Before Deploying:
1. Run `npm run build` locally
2. Test the build locally with `npm run preview`
3. Check browser console for any errors

#### Deployment Platforms:

**Netlify:**
- Deploy the `dist` folder
- No special configuration needed

**Vercel:**
- Connect your GitHub repo
- Build command: `npm run build`
- Output directory: `dist`

**GitHub Pages:**
- Deploy the `dist` folder
- Make sure base path is set to `./` in vite.config.js

**Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select dist as public directory
firebase deploy
```

### 5. **Troubleshooting**

#### If you still see a white screen:

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Common Issues:**
   - **CORS errors**: Check if Firebase domain is whitelisted
   - **Firebase auth errors**: Check if your Firebase project is properly configured
   - **Asset loading errors**: Check if all files are being served correctly

3. **Debug Steps:**
   - Add `console.log('App starting...')` at the top of App.jsx
   - Check if the error boundary catches any errors
   - Verify Firebase initialization in console

### 6. **Firebase Project Setup**

Make sure your Firebase project has:
- ✅ Authentication enabled (Google sign-in)
- ✅ Firestore Database created
- ✅ Storage enabled
- ✅ Proper security rules

### 7. **Testing Locally**

```bash
# Build and test locally
npm run build
npm run preview

# Or serve the dist folder
npx serve dist
```

### 8. **Performance**

The build now includes:
- ✅ Code splitting (vendor, firebase, tone, main)
- ✅ Optimized chunks
- ✅ Gzip compression ready

### 9. **Security**

- ✅ Firebase config is safe to expose (public keys only)
- ✅ No sensitive data in client-side code
- ✅ Proper authentication flow

## Quick Fix Commands

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build

# Test locally
npm run preview

# Check for errors
npm run build 2>&1 | grep -i error
``` 