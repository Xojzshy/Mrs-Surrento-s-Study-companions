import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "neat-domain-ln50x",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769931622547:web:894fba5579a3f46d653566",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCYYTnLs_8NJUtnWpqI5m0ut7DUIrqTaLk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "neat-domain-ln50x.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-ff111c19-9afe-4480-a734-3af2837a572f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "neat-domain-ln50x.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769931622547",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
