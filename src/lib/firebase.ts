import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAq2vgpQmNvi0Bs7t_XuYalhGa6T9eTXYg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mizan-bill.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mizan-bill",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mizan-bill.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "485206372208",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:485206372208:web:2f1a56bf3c1a7b98c6e9b5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-THQ6WMJCJH"
};

// Validate that we have the minimum required config before initializing
const hasMinimumConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

const app = initializeApp(firebaseConfig);

// Initialize App Check for protection against bots and unauthorized API access
// Note: In a production environment, VITE_RECAPTCHA_SITE_KEY must be provided in the dashboard.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(app);
// Enable LOCAL persistence to keep the user logged in across sessions
setPersistence(auth, browserLocalPersistence).catch(err => console.error('Auth persistence error:', err));

export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize persistence with a slight delay to prioritize main UI rendering
const enablePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Firestore persistence enabled.');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence.');
    } else {
      console.warn('Persistence error:', err);
    }
  }
};

// Fire and forget, don't block
enablePersistence();

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};
export const getCachedAccessToken = () => cachedAccessToken;

