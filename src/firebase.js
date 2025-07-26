// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// We keep using your globals injected from index.html
console.log('Firebase initialization starting...');
console.log('window.__firebase_config available:', typeof window.__firebase_config !== 'undefined');
console.log('__firebase_config available:', typeof __firebase_config !== 'undefined');

const firebaseConfig =
  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

console.log('Firebase config:', firebaseConfig);

let app;
try {
  if (!firebaseConfig.apiKey) {
    console.error('Firebase config is missing apiKey - using fallback');
    app = initializeApp({
      apiKey: "AIzaSyCw3oPJKCHchzDoCmNjMc7mXGJBcG3tAPM",
      authDomain: "friends-reminder-1b494.firebaseapp.com",
      projectId: "friends-reminder-1b494",
      storageBucket: "friends-reminder-1b494.firebasestorage.app",
      messagingSenderId: "818386771400",
      appId: "1:818386771400:web:3ca4fb33b928355c10f4fd",
      measurementId: "G-ZQ6RJSWMR2"
    });
  } else {
    app = initializeApp(firebaseConfig);
  }
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a minimal app to prevent crashes
  app = initializeApp({
    apiKey: "AIzaSyCw3oPJKCHchzDoCmNjMc7mXGJBcG3tAPM",
    authDomain: "friends-reminder-1b494.firebaseapp.com",
    projectId: "friends-reminder-1b494",
    storageBucket: "friends-reminder-1b494.firebasestorage.app",
    messagingSenderId: "818386771400",
    appId: "1:818386771400:web:3ca4fb33b928355c10f4fd",
    measurementId: "G-ZQ6RJSWMR2"
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

// Google OAuth provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Push notification functions
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const getFCMToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'BK4VAPFNUQ0EkIjOaDqlBYwtOgSXFQkXBgcz3DG-SyJdgNK66QBB8ZuiymJtK2xY164r3EORW5flEwIb4ve7kTE'
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });
};
