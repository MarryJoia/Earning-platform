// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHX45QbjATYaI5yO50ghgSoZP98yXo3Hs",
  authDomain: "earning-platform-a267f.firebaseapp.com",
  databaseURL: "https://earning-platform-a267f-default-rtdb.firebaseio.com",
  projectId: "earning-platform-a267f",
  storageBucket: "earning-platform-a267f.firebasestorage.app",
  messagingSenderId: "785014377238",
  appId: "1:785014377238:web:e693e96aacbe4b151c1e37"
};

// 🔥 MUST: initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// ---------- SIGN UP ----------
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      database.ref("users/" + user.uid).set({
        email: email,
        balance: 0
      });

      alert("Signup successful");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert(error.message);
    });
}

// ---------- LOGIN ----------
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert(error.message);
    });
}
// ---------- AUTH CHECK ----------
auth.onAuthStateChanged((user) => {
  if (user && document.getElementById("userEmail")) {
    document.getElementById("userEmail").innerText = user.email;

    database.ref("users/" + user.uid).on("value", (snapshot) => {
      const data = snapshot.val();
      document.getElementById("balance").innerText = data?.balance || 0;
    });
  }
});

// ---------- BUY PACKAGE ----------
function buyPackage(amount, daily) {
  const user = auth.currentUser;
  if (!user) return alert("Login required");

  database.ref("users/" + user.uid).update({
    package: amount,
    dailyEarning: daily,
    lastClaim: Date.now()
  });

  alert("Package activated!");
}

// ---------- DAILY EARNING ----------
function claimDaily() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = database.ref("users/" + user.uid);
  ref.once("value").then((snap) => {
    const data = snap.val();
    const now = Date.now();

    if (!data.lastClaim || now - data.lastClaim >= 86400000) {
      ref.update({
        balance: (data.balance || 0) + (data.dailyEarning || 0),
        lastClaim: now
      });
      alert("Daily earning added");
    } else {
      alert("Already claimed today");
    }
  });
}

// ---------- LOGOUT ----------
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}
