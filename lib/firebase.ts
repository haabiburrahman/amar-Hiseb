
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "myhisabe-dca0f.firebaseapp.com",
  projectId: "myhisabe-dca0f",
  storageBucket: "myhisabe-dca0f.firebasestorage.app",
  messagingSenderId: "600302979619",
  appId: "1:600302979619:web:3d34404ab0666dabaabf96",
};

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Please set FIREBASE_API_KEY in your environment variables.");
}

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
