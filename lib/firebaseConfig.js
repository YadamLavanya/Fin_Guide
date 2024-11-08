// lib/utils.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBcp1f7uEaE3babqPFBcIQErEPgwkvmKwI",
    authDomain: "curio-pay.firebaseapp.com",
    projectId: "curio-pay",
    storageBucket: "curio-pay.firebasestorage.app",
    messagingSenderId: "704358986950",
    appId: "1:704358986950:web:f0d8ee47e9e91a740913c7",
    measurementId: "G-EM72KMQW6Z"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
