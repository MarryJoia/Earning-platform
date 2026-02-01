// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHX45QbjATYaI5yO50ghgSoZP98yXo3Hs",
  authDomain: "earning-platform-a267f.firebaseapp.com",
  databaseURL: "https://earning-platform-a267f-default-rtdb.firebaseio.com",
  projectId: "earning-platform-a267f",
  storageBucket: "earning-platform-a267f.firebasestorage.app",
  messagingSenderId: "785014377238",
  appId: "1:785014377238:web:cbdbf4209286465f1c1e37",
  measurementId: "G-Z3CGN0WMVF"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

/* ================= AUTH ================= */

function signUp() {
  const email = emailEl.value;
  const password = passwordEl.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(res => {
      db.ref("users/" + res.user.uid).set({
        email,
        balance: 0,
        earned: 0,
        referral: 0,
        plan: null,
        dailyIncome: 0,
        lastClaim: 0
      });
      location.href = "dashboard.html";
    })
    .catch(e => alert(e.message));
}

function login() {
  auth.signInWithEmailAndPassword(emailEl.value, passwordEl.value)
    .then(() => location.href = "dashboard.html")
    .catch(e => alert(e.message));
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/* ================= PLANS ================= */

function buyPlan(amount, daily) {
  const user = auth.currentUser;
  if (!user) return;

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (snap.val().plan) return alert("Plan already active");

    db.ref("users/" + user.uid).update({
      plan: amount,
      dailyIncome: daily
    });
    alert("Plan Activated!");
  });
}

/* ================= DAILY CLAIM ================= */

function claimDaily() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = db.ref("users/" + user.uid);
  ref.once("value").then(snap => {
    const d = snap.val();
    const now = Date.now();

    if (now - d.lastClaim < 86400000)
      return alert("Already claimed today");

    ref.update({
      balance: d.balance + d.dailyIncome,
      earned: d.earned + d.dailyIncome,
      lastClaim: now
    });
    alert("Income Added");
  });
}

/* ================= PKR → USD ================= */

function convertPKR() {
  const pkr = Number(pkrInput.value);
  usdOutput.innerText = (pkr / 300).toFixed(2);
}

/* ================= DASHBOARD LOAD ================= */

auth.onAuthStateChanged(user => {
  if (!user && location.pathname.includes("dashboard"))
    location.href = "index.html";

  if (user && location.pathname.includes("dashboard")) {
    db.ref("users/" + user.uid).on("value", snap => {
      const d = snap.val();
      totalIncome.innerText = d.balance;
      earnedIncome.innerText = d.earned;
      referralIncome.innerText = d.referral;
    });
  }
});
