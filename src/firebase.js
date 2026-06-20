import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaDXM2Jhz4x8LTGgPwIKGZhhffJ32S0v4",
  authDomain: "noorzai-panel.firebaseapp.com",
  projectId: "noorzai-panel",
  storageBucket: "noorzai-panel.firebasestorage.app",
  messagingSenderId: "767821371206",
  appId: "1:767821371206:web:706190394ba078d8ab3747"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);