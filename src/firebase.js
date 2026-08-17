import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuyeAfCNfBLX0vS_T9rSUVy7PAdKp-8-0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zany-passkey-d9st9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zany-passkey-d9st9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zany-passkey-d9st9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "214615800644",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:214615800644:web:d5c70509a0622e5465f511"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
