import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_CONFIG_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_CONFIG_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_CONFIG_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_CONFIG_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_CONFIG_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_CONFIG_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_CONFIG_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// Export auth, provider, firestore, and analytics
export { auth, db, googleProvider, analytics };


