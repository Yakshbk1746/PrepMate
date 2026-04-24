

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebaseConfig';

// ─── Helper: map Firebase error codes to friendly messages ───────────────────
const getFriendlyError = (code) => {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
};

// ─── Login with Email & Password ─────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (err) {
    throw new Error(getFriendlyError(err.code));
  }
};

// ─── Register with Email & Password ──────────────────────────────────────────
export const registerWithEmail = async (email, password) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (err) {
    throw new Error(getFriendlyError(err.code));
  }
};

// ─── Sign In with Google ──────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    throw new Error(getFriendlyError(err.code));
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    throw new Error('Failed to log out. Please try again.');
  }
};

// ─── Send Password Reset Email ────────────────────────────────────────────────
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw new Error(getFriendlyError(err.code));
  }
};