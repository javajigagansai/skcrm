import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyACHT3CSmz9BiF_Zxdq_T83o-PiH7iKR-M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sk-crm-1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sk-crm-1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sk-crm-1.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "124421919884",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:124421919884:web:sk-crm-1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
