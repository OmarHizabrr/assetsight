import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBbDfP3Wm97RyCZcPHHtBBcXQZytG_EC_0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "assetsight.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "assetsight",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "assetsight.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "175578104736",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:175578104736:web:e3b11bc97d802fda8edac5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-DP3DR9FQ1L",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleAuthProvider = new GoogleAuthProvider();

// محاولة إعادة الاتصال عند فشل الاتصال
if (typeof window !== 'undefined') {
  // إعادة محاولة الاتصال تلقائياً
  enableNetwork(db).catch((error) => {
    console.warn('Firestore connection warning:', error);
  });
}

export default app;

