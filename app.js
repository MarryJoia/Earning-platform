// ------------------------
// Firebase Initialization
// ------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCHX45QbjATYaI5yO50ghgSoZP98yXo3Hs",
  authDomain: "earning-platform-a267f.firebaseapp.com",
  databaseURL: "https://earning-platform-a267f-default-rtdb.firebaseio.com",
  projectId: "earning-platform-a267f",
  storageBucket: "earning-platform-a267f.firebasestorage.app",
  messagingSenderId: "785014377238",
  appId: "1:785014377238:web:e693e96aacbe4b151c1e37",
  measurementId: "G-CJTYVGW3PM"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// ------------------------
// User Login / Signup
// ------------------------
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('signupBtn')) {
    document.getElementById('signupBtn').addEventListener('click', signup);
    document.getElementById('loginBtn').addEventListener('click', login);
  }

  if (document.getElementById('dashboard-container')) {
    auth.onAuthStateChanged(user => {
      if (!user) window.location.href = 'index.html';
      loadDashboard(user.uid);
    });
  }

  if (document.getElementById('depositBtn')) {
    auth.onAuthStateChanged(user => {
      if (!user) window.location.href = 'index.html';
      loadDepositHistory(user.uid);
      document.getElementById('depositPKR').addEventListener('input', convertPKRtoUSD);
      document.getElementById('depositBtn').addEventListener('click', submitDeposit);
    });
  }

  if (document.getElementById('withdrawBtn')) {
    auth.onAuthStateChanged(user => {
      if (!user) window.location.href = 'index.html';
      loadWithdrawHistory(user.uid);
      document.getElementById('withdrawBtn').addEventListener('click', submitWithdraw);
    });
  }
});

// ------------------------
// Signup
// ------------------------
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const referral = document.getElementById('referralCode').value.trim();

  if (!email || !password) return alert('Enter email and password');

  auth.createUserWithEmailAndPassword(email, password)
    .then(user => {
      const uid = user.user.uid;
      const myReferralCode = uid.substring(0, 6).toUpperCase();
      db.ref('users/' + uid).set({
        email,
        totalBalance: 0,
        earnedIncome: 0,
        referralIncome: 0,
        myReferralCode,
        package: null,
        dailyIncome: 0,
        lastCollected: 0
      });
      if (referral) {
        db.ref('users').orderByChild('myReferralCode').equalTo(referral).once('value', snap => {
          snap.forEach(u => {
            const refUid = u.key;
            const bonus = 1; // referral bonus $1
            const currentReferral = u.val().referralIncome || 0;
            db.ref('users/' + refUid).update({referralIncome: currentReferral + bonus});
          });
        });
      }
      alert('Signup successful! Referral Code: ' + myReferralCode);
    })
    .catch(err => alert(err.message));
}

// ------------------------
// Login
// ------------------------
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('Enter email and password');
  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = 'dashboard.html')
    .catch(err => alert(err.message));
}

// ------------------------
// Logout
// ------------------------
function logout() { auth.signOut().then(() => window.location.href = 'index.html'); }

// ------------------------
// Dashboard Load
// ------------------------
function loadDashboard(uid) {
  const totalEl = document.getElementById('totalBalance');
  const earnedEl = document.getElementById('earnedIncome');
  const referralEl = document.getElementById('referralIncome');
  const dailyEl = document.getElementById('dailyIncome');
  const nextCollectEl = document.getElementById('nextCollect');
  const referralCodeEl = document.getElementById('myReferralCode');

  db.ref('users/' + uid).on('value', snap => {
    const data = snap.val();
    totalEl.innerText = '$' + (data.totalBalance || 0).toFixed(2);
    earnedEl.innerText = '$' + (data.earnedIncome || 0).toFixed(2);
    referralEl.innerText = '$' + (data.referralIncome || 0).toFixed(2);
    dailyEl.innerText = '$' + (data.dailyIncome || 0).toFixed(2);
    referralCodeEl.innerText = data.myReferralCode;

    // Daily income timer
    const last = data.lastCollected || 0;
    const now = Date.now();
    let diff = 24*60*60*1000 - (now - last);
    if (diff < 0) { diff = 0; }
    const timerInterval = setInterval(() => {
      if (diff <= 0) {
        nextCollectEl.innerText = 'Ready!';
        clearInterval(timerInterval);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        nextCollectEl.innerText = `${h}h ${m}m ${s}s`;
        diff -= 1000;
      }
    }, 1000);

    document.getElementById('collectBtn').onclick = () => collectIncome(uid, data.package);
  });
}

// ------------------------
// Collect Income
// ------------------------
function collectIncome(uid, userPackage) {
  const packageIncome = {50:1,100:2,200:4,300:8};
  const amount = packageIncome[userPackage] || 0;
  if (amount <= 0) return alert('No package purchased!');
  const now = Date.now();
  db.ref('users/' + uid).once('value').then(snap => {
    const last = snap.val().lastCollected || 0;
    if (now - last < 24*60*60*1000) return alert('Income not ready yet');
    const totalBalance = (snap.val().totalBalance || 0) + amount;
    const earnedIncome = (snap.val().earnedIncome || 0) + amount;
    db.ref('users/' + uid).update({totalBalance, earnedIncome, lastCollected: now});
    alert('Daily income collected: $' + amount);
  });
}

// ------------------------
// Packages
// ------------------------
function buyPackage(amount,dailyIncome){
  const uid = auth.currentUser.uid;
  db.ref('users/' + uid).once('value').then(snap=>{
    const balance = snap.val().totalBalance || 0;
    if(balance < amount) return alert('Insufficient balance');
    db.ref('users/' + uid).update({
      package: amount,
      dailyIncome,
      totalBalance: balance - amount
    });
    alert('Package purchased: $' + amount);
  });
}

// ------------------------
// Referral Link Copy
// ------------------------
function copyReferralLink(){
  const code = document.getElementById('myReferralCode').innerText;
  navigator.clipboard.writeText(window.location.origin + '?ref=' + code);
  alert('Referral link copied!');
}

// ------------------------
// Deposit
// ------------------------
function convertPKRtoUSD() {
  const pkr = Number(document.getElementById('depositPKR').value);
  document.getElementById('depositUSD').innerText = (pkr/300).toFixed(2);
}

function submitDeposit() {
  const uid = auth.currentUser.uid;
  const pkr = Number(document.getElementById('depositPKR').value);
  const usd = pkr/300;
  const file = document.getElementById('screenshotInput').files[0];
  if(!pkr || !file) return alert('Enter amount and upload screenshot');

  const storageRef = storage.ref('deposits/' + Date.now() + '_' + file.name);
  storageRef.put(file).then(snapshot=>{
    snapshot.ref.getDownloadURL().then(url=>{
      const depositRef = db.ref('deposits/' + uid).push();
      depositRef.set({amountUSD:usd,amountPKR:pkr,status:'Pending',screenshot:url});
      alert('Deposit submitted!');
      document.getElementById('depositPKR').value = '';
      document.getElementById('screenshotInput').value = '';
      loadDepositHistory(uid);
    });
  });
}

function loadDepositHistory(uid){
  const tbody = document.getElementById('depositHistory');
  if(!tbody) return;
  tbody.innerHTML='';
  db.ref('deposits/' + uid).once('value').then(snap=>{
    snap.forEach(d=>{
      const data = d.val();
      const tr = document.createElement('tr');
      tr.innerHTML=`<td>$${data.amountUSD.toFixed(2)}</td>
                    <td>PKR ${data.amountPKR}</td>
                    <td>${data.status}</td>
                    <td><a href="${data.screenshot}" target="_blank">View</a></td>`;
      tbody.appendChild(tr);
    });
  });
}

// ------------------------
// Withdraw
// ------------------------
function submitWithdraw() {
  const uid = auth.currentUser.uid;
  const amount = Number(document.getElementById('withdrawAmount').value);
  const method = document.getElementById('withdrawMethod').value;
  const account = document.getElementById('withdrawAccount').value.trim();
  if(!amount || !account) return alert('Enter amount and account details');

  const userRef = db.ref('users/' + uid);
  userRef.once('value').then(snap=>{
    const balance = snap.val().totalBalance || 0;
    if(amount > balance) return alert('Insufficient balance');
    db.ref('withdrawals/' + uid).push({
      amount, method, account, status:'Pending'
    });
    userRef.update({totalBalance: balance - amount});
    alert('Withdraw request submitted!');
    loadWithdrawHistory(uid);
  });
}

function loadWithdrawHistory(uid){
  const tbody = document.getElementById('withdrawHistory');
  if(!tbody) return;
  tbody.innerHTML='';
  db.ref('withdrawals/' + uid).once('value').then(snap=>{
    snap.forEach(w=>{
      const data = w.val();
      const tr = document.createElement('tr');
      tr.innerHTML=`<td>$${data.amount}</td>
                    <td>${data.method}</td>
                    <td>${data.account}</td>
                    <td>${data.status}</td>`;
      tbody.appendChild(tr);
    });
  });
}
