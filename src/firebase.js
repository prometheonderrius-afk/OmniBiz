import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvUqb-NMr_9lvE-7gpuSjnNImfzaYySKo",
  authDomain: "wacom-canvas.firebaseapp.com",
  projectId: "wacom-canvas",
  storageBucket: "wacom-canvas.firebasestorage.app",
  messagingSenderId: "948691108517",
  appId: "1:948691108517:web:b8412b3428bec908ddc34c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
