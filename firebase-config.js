<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
</script>
