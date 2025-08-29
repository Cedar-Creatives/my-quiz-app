import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyCbXqT-cBZVFZzyxUN7aYqGtGpRneFvmQA",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "quiz-app-sdg4.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "quiz-app-sdg4",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "quiz-app-sdg4.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "565502145792",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:565502145792:web:34df0c99b1f75645ef2fe5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;