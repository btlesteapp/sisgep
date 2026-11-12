import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCjhaBVB_3Kix8z4ZwMqK7YebCqULmhKTs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sisgep-a91cb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sisgep-a91cb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sisgep-a91cb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "829294243932",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:829294243932:web:cac9028f8088233c4bb699"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const isFirebaseReady = true;
export default app;
