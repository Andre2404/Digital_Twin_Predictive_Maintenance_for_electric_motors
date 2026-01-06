// lib/firebaseClient.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is already initialized
let app: FirebaseApp;

if (getApps().length === 0) {
  // Validate required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    console.warn('Firebase configuration is incomplete. Some features may not work.');
    // Create a minimal config for development
    app = initializeApp({
      apiKey: firebaseConfig.apiKey || 'demo-key',
      projectId: firebaseConfig.projectId || 'demo-project',
      databaseURL: firebaseConfig.databaseURL || 'https://demo-project-default-rtdb.firebaseio.com',
    });
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0];
}

export { app };
