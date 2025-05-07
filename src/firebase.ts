// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA96nWmclbKsbeKnS11YSQEoQaHGurAJz8",
  authDomain: "lettersapp-a8096.firebaseapp.com",
  projectId: "lettersapp-a8096",
  storageBucket: "lettersapp-a8096.appspot.com", // ← I fixed your typo here
  messagingSenderId: "571487338011",
  appId: "1:571487338011:web:86cfe52451e0a9697302be",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore database
export const db = getFirestore(app);
// Trigger redeploy
