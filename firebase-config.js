// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbXi2ZptHebiPIPARnsnoGjM6PxG9fm70",
  authDomain: "smartscores-21f44.firebaseapp.com",
  projectId: "smartscores-21f44",
  storageBucket: "smartscores-21f44.firebasestorage.app",
  messagingSenderId: "729692210177",
  appId: "1:729692210177:web:6da3636a661efc8852ec00",
  measurementId: "G-WRWL0EJCBR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };
