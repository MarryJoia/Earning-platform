// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCHX45QbjATYaI5yO50ghgSoZP98yXo3Hs",
  authDomain: "earning-platform-a267f.firebaseapp.com",
  databaseURL: "https://earning-platform-a267f-default-rtdb.firebaseio.com",
  projectId: "earning-platform-a267f",
  storageBucket: "earning-platform-a267f.firebasestorage.app",
  messagingSenderId: "785014377238",
  appId: "1:785014377238:web:e693e96aacbe4b151c1e37"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const database = firebase.database();

// ================= SIGNUP =================
window.signUp = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      database.ref("users/" + cred.user.uid).set({
        email: email,
        balance: 0
      });
      alert("Signup successful");
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
};

// ================= LOGIN =================
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert(err.message));
};

// ================= BUY PACKAGE =================
window.buyPackage = function (amount, daily) {
  const user = auth.currentUser;
  if (!user) return alert("Login required");

  database.ref("users/" + user.uid).update({
    package: "$" + amount,
    dailyEarning: daily,
    lastClaim: 0
  }).then(() => {
    alert("Package activated");
  });
};

// ================= DAILY CLAIM =================
window.claimDaily = function () {
  const user = auth.currentUser;
  if (!user) return;

  const ref = database.ref("users/" + user.uid);
  ref.once("value").then(snap => {
    const d = snap.val();
    const now = Date.now();

    if (now - (d.lastClaim || 0) >= 86400000) {
      ref.update({
        balance: (d.balance || 0) + (d.dailyEarning || 0),
        lastClaim: now
      });
      alert("Daily earning added");
    } else {
      alert("Already claimed today");
    }
  });
};

// ================= LOGOUT =================
window.logout = function () {
  auth.signOut().then(() => location.href = "login.html");
};
