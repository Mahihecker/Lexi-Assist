// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYcWBa4Fua3WtXRA-wld8ZL9KTd5TndmY",
  authDomain: "lexassist-f7efd.firebaseapp.com",
  projectId: "lexassist-f7efd",
  storageBucket: "lexassist-f7efd.firebasestorage.app",
  messagingSenderId: "47116769635",
  appId: "1:47116769635:web:6457c15ea9b929b83ddb56",
  measurementId: "G-MXP1E5RMD1"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
