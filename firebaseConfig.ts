import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: REPLACE WITH YOUR FIREBASE CONFIGURATION
// Go to Firebase Console > Project Settings > General > Your Apps > Web App
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "lms-home-9a3a2.firebaseapp.com",
    projectId: "lms-home-9a3a2",
    storageBucket: "lms-home-9a3a2.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
