<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCHX45QbjATYaI5yO50ghgSoZP98yXo3Hs",
    authDomain: "earning-platform-a267f.firebaseapp.com",
    databaseURL: "https://earning-platform-a267f-default-rtdb.firebaseio.com",
    projectId: "earning-platform-a267f",
    storageBucket: "earning-platform-a267f.firebasestorage.app",
    messagingSenderId: "785014377238",
    appId: "1:785014377238:web:99928cbc2ab5dc6e1c1e37",
    measurementId: "G-K6ZC1Y6VPL"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
