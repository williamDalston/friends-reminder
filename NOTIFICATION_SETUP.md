# Push Notifications and Email Setup Guide

This guide will help you set up push notifications and email features for your Friends Reminder app.

## Prerequisites

1. Firebase project with the following services enabled:
   - Authentication
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
   - Cloud Messaging (FCM)

2. Node.js and npm installed
3. Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Firebase Project Setup

### 1.1 Enable Cloud Functions
```bash
# Navigate to your project directory
cd friends-reminder

# Initialize Firebase Functions
firebase init functions

# Select your project when prompted
# Choose JavaScript
# Say yes to ESLint
# Say yes to installing dependencies
```

### 1.2 Enable Cloud Messaging
1. Go to Firebase Console > Project Settings
2. Go to the "Cloud Messaging" tab
3. Generate a new Web Push certificate
4. Copy the VAPID key

### 1.3 Update VAPID Key
Replace `YOUR_VAPID_KEY` in `src/firebase.js` with your actual VAPID key:

```javascript
export const getFCMToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'YOUR_ACTUAL_VAPID_KEY_HERE' // Replace this
    });
    // ... rest of the function
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};
```

## Step 2: Email Service Setup

### 2.1 Configure Email Service
You can use Gmail, SendGrid, or any other email service. For Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Set Firebase Functions config:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-password"
```

### 2.2 Alternative: SendGrid Setup
If you prefer SendGrid:

1. Create a SendGrid account
2. Get an API key
3. Update the functions/index.js file:

```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: functions.config().sendgrid.key
  }
});
```

Then set the config:
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

## Step 3: Deploy Cloud Functions

### 3.1 Install Dependencies
```bash
cd functions
npm install
```

### 3.2 Deploy Functions
```bash
firebase deploy --only functions
```

## Step 4: Test the Setup

### 4.1 Test Push Notifications
1. Open your app in a browser
2. Allow notification permissions when prompted
3. Go to Settings > Push Notifications
4. Click "Test Notification"
5. You should receive a push notification

### 4.2 Test Email Notifications
1. Go to Settings > Email Notifications
2. Enter your email address
3. Save settings
4. Add a friend and wait for a reminder
5. Check your email for notifications

## Step 5: Production Deployment

### 5.1 Deploy Everything
```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy
```

### 5.2 Set Production Environment Variables
```bash
# Set production email config
firebase functions:config:set email.user="your-production-email@gmail.com" email.pass="your-production-app-password"

# Deploy functions again
firebase deploy --only functions
```

## Troubleshooting

### Push Notifications Not Working
1. Check browser console for errors
2. Verify VAPID key is correct
3. Ensure service worker is registered
4. Check notification permissions

### Email Not Sending
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify email credentials
3. Check Firestore for email documents
4. Ensure Cloud Functions are deployed

### Common Issues

#### CORS Errors
Add CORS headers to your Cloud Functions:

```javascript
const cors = require('cors')({origin: true});

exports.sendEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    // Your function logic here
  });
});
```

#### Service Worker Not Registering
1. Ensure firebase-messaging-sw.js is in the public directory
2. Check that the service worker is being served correctly
3. Verify the service worker path in index.html

#### FCM Token Issues
1. Check browser console for token generation errors
2. Verify Firebase configuration
3. Ensure the app is served over HTTPS (required for service workers)

## Security Considerations

1. **VAPID Key**: Keep your VAPID key secure and don't commit it to public repositories
2. **Email Credentials**: Use environment variables for email credentials
3. **Firestore Rules**: Ensure proper security rules are in place
4. **Rate Limiting**: Consider implementing rate limiting for email sending

## Monitoring

### Firebase Console
- Monitor Cloud Functions execution in the Firebase Console
- Check Firestore for email and notification documents
- Monitor FCM delivery in the Cloud Messaging section

### Logs
```bash
# View function logs
firebase functions:log

# View real-time logs
firebase functions:log --only sendEmail
```

## Advanced Configuration

### Custom Email Templates
You can customize email templates in `functions/index.js`:

```javascript
const emailTemplate = (data) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2ecc71;">Friends Reminder</h2>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
      <h3>${data.subject}</h3>
      <p style="white-space: pre-line;">${data.body}</p>
    </div>
  </div>
`;
```

### Notification Scheduling
The app includes a daily digest feature that runs at 9 AM. You can modify the schedule in `functions/index.js`:

```javascript
exports.sendDailyDigest = functions.pubsub
  .schedule('0 9 * * *') // Change this to your preferred time
  .timeZone('America/New_York') // Change to your timezone
```

## Support

If you encounter issues:
1. Check the Firebase Console for error logs
2. Review the browser console for client-side errors
3. Verify all configuration steps were completed
4. Test with a simple notification first

Remember to test thoroughly in development before deploying to production! 