import { auth, googleProvider, setCachedAccessToken } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { User } from '../types';
import { getUserProfile } from './FirebaseService';

export const subscribeToAuth = (callback: (user: any | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Immediate return of basic user object for instant UI response
      const isAdmin = firebaseUser.email === 'parbadiyaakbar@gmail.com';
      const basicUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: isAdmin ? 'Admin' : 'Owner',
        shopId: firebaseUser.uid,
        user_metadata: { full_name: firebaseUser.displayName || undefined }
      };
      callback(basicUser);

      // Async fetch profile to update shopId if needed
      getUserProfile(firebaseUser.uid).then(profile => {
        if (profile && profile.shopId) {
          callback({
            ...basicUser,
            role: isAdmin ? 'Admin' : (profile.role || 'Owner'),
            shopId: profile.shopId
          });
        }
      }).catch(err => console.warn("Background profile fetch failed:", err));
    } else {
      callback(null);
    }
  });
};

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  if (!password || password.trim() === '') {
    throw new Error('auth/invalid-password: Password cannot be empty.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Return immediately without waiting for Firestore profile fetch
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    shopId: firebaseUser.uid, // Default to UID, updated later by subscriber
    role: 'Owner',
    user_metadata: { full_name: firebaseUser.displayName || undefined }
  };
};

export const registerWithEmail = async (email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return {
    id: userCredential.user.uid,
    email: userCredential.user.email || '',
    shopId: userCredential.user.uid,
    role: 'Owner',
    user_metadata: { full_name: userCredential.user.displayName || undefined }
  };
};

export const loginWithGoogle = async (): Promise<User> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(userCredential);
  if (credential?.accessToken) {
    setCachedAccessToken(credential.accessToken);
  }
  const firebaseUser = userCredential.user;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    shopId: firebaseUser.uid,
    role: 'Owner',
    user_metadata: { full_name: firebaseUser.displayName || undefined }
  };
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = () => auth.currentUser;
