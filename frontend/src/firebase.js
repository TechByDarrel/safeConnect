import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxMeuG7JZWeB1WP2Guf4POzK8Eidaw784",
  authDomain: "safeconnect-c402e.firebaseapp.com",
  databaseURL: "https://safeconnect-c402e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "safeconnect-c402e",
  storageBucket: "safeconnect-c402e.firebasestorage.app",
  messagingSenderId: "894991840102",
  appId: "1:894991840102:web:6b578fdaf5536a25eecea7"
}; 

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);