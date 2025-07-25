// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

console.log('firebase.js loading...');

// Define the Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCw3oPJKCHchzDoCmNjMc7mXGJBcG3tAPM",
  authDomain: "friends-reminder-1b494.firebaseapp.com",
  projectId: "friends-reminder-1b494",
  storageBucket: "friends-reminder-1b494.firebasestorage.app",
  messagingSenderId: "818386771400",
  appId: "1:818386771400:web:3ca4fb33b928355c10f4fd",
  measurementId: "G-ZQ6RJSWMR2"
};

console.log('Firebase config:', firebaseConfig);

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
