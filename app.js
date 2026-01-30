// 🔥 Firebase Config (اپنا real config paste کریں)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// 🔐 SIGNUP
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const referral = document.getElementById("referral")?.value || "";

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCred => {
      const uid = userCred.user.uid;

      db.ref("users/" + uid).set({
        email: email,
        earnings: 0,
        package: "None",
        referral: referral
      });

      alert("Signup successful");
      window.location.href = "login.html";
    })
    .catch(err => alert(err.message));
}

// 🔐 LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

// 📊 LOAD DASHBOARD DATA
function loadData() {
  const user = auth.currentUser;
  if (!user) return;

  db.ref("users/" + user.uid).on("value", snap => {
    const data = snap.val();
    if (!data) return;

    document.getElementById("earnings").innerText = data.earnings;
    document.getElementById("package").innerText = data.package;
  });
}

// 💼 SELECT PACKAGE
function selectPackage(pkg, daily) {
  const user = auth.currentUser;
  if (!user) return;

  db.ref("users/" + user.uid).update({
    package: pkg,
    earnings: firebase.database.ServerValue.increment(daily)
  });
}

// 💸 WITHDRAW REQUEST
function withdraw() {
  const amount = document.getElementById("amount").value;
  const method = document.getElementById("method").value;
  const number = document.getElementById("number").value;
  const user = auth.currentUser;

  if (!user) return;

  db.ref("withdraws").push({
    user: user.email,
    amount: amount,
    method: method,
    number: number,
    status: "Pending"
  });

  alert("Withdraw request submitted");
}
