import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// এইখানে আপনার ফায়ারবেস প্রজেক্টের আসল কনফিগ বসান
const firebaseConfig = {
  apiKey: "AIzaSyBlbiP9cwFrYtD2NGBIi0c-H6nzRVtmoic",
  authDomain: "myhisabe-dca0f.firebaseapp.com",
  projectId: "myhisabe-dca0f",
  storageBucket: "myhisabe-dca0f.firebasestorage.app",
  messagingSenderId: "600302979619",
  appId: "1:600302979619:web:3d34404ab0666dabaabf96",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);