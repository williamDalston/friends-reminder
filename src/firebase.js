// src/firebase.js
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// We keep using your globals injected from index.html
console.log('Firebase initialization starting...');
console.log('window.__firebase_config available:', typeof window.__firebase_config !== 'undefined');
console.log('__firebase_config available:', typeof __firebase_config !== 'undefined');

const firebaseConfig =
  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

console.log('Firebase config:', firebaseConfig);

try {
  const app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a minimal app to prevent crashes
  const app = initializeApp({});
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google OAuth provider
export const googleProvider = new GoogleAuthProvider();
