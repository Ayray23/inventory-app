// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJa9yBJe4Ot8-JA1RCjtsUY_wQ_Bwoge0",
  authDomain: "inventory-app-62b98.firebaseapp.com",
  projectId: "inventory-app-62b98",
  storageBucket: "inventory-app-62b98.appspot.com",
  messagingSenderId: "760227607561",
  appId: "1:760227607561:web:ab0064f1db898e8eec34d8",
  measurementId: "G-4ZZVHT5F74"
};

const app = initializeApp(firebaseConfig);

// ✅ Enable offline cache support
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export { db };
export const auth = getAuth(app);
