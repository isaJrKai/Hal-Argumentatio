/// <reference types="vite/client" />
import { getApp, getApps, initializeApp } from '@firebase/app';
import { getAuth, type Auth } from '@firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Both HAL account Google sign-in and Google Workspace integrations must use
// the same explicitly configured Firebase project. Never silently fall back to
// the committed Google AI Studio applet configuration.
const HAL_FIREBASE_APP_NAME = 'hal-firebase-client';
const app = isFirebaseConfigured
  ? (getApps().some(existing => existing.name === HAL_FIREBASE_APP_NAME)
      ? getApp(HAL_FIREBASE_APP_NAME)
      : initializeApp(firebaseConfig, HAL_FIREBASE_APP_NAME))
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
