import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Sustituye con tus credenciales de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDrUIccqznpHGkkN4mnL-JNOARHHEVwL14",
  authDomain: "worship-keys-app.firebaseapp.com",
  projectId: "worship-keys-app",
  storageBucket: "worship-keys-app.firebasestorage.app",
  messagingSenderId: "882885401192",
  appId: "1:882885401192:web:3e639c1a319c977f25f9dd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);