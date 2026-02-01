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

// ------------------------
// Admin Login
// ------------------------
function adminLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  if (!email || !password) return alert('Enter email & password');

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = 'admin.html')
    .catch(err => alert(err.message));
}

// ------------------------
// Logout
// ------------------------
function logoutAdmin() {
  auth.signOut().then(() => window.location.href = 'admin-login.html');
}

// ------------------------
// Load Users
// ------------------------
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('usersTable')) loadUsers();
  if (document.getElementById('depositTable')) loadDepositRequests();
  if (document.getElementById('withdrawTable')) loadWithdrawRequests();
});

function loadUsers() {
  const tbody = document.getElementById('usersTable');
  tbody.innerHTML = '';
  db.ref('users').once('value').then(snap => {
    snap.forEach(u => {
      const data = u.val();
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${data.email}</td>
                      <td>$${data.totalBalance}</td>
                      <td>$${data.earnedIncome}</td>
                      <td>$${data.referralIncome}</td>
                      <td>${data.package || '-'}</td>`;
      tbody.appendChild(tr);
    });
  });
}

// ------------------------
// Deposit Requests
// ------------------------
function loadDepositRequests() {
  const tbody = document.getElementById('depositTable');
  tbody.innerHTML = '';
  db.ref('deposits').once('value').then(snap => {
    snap.forEach(userSnap => {
      userSnap.forEach(depSnap => {
        const d = depSnap.val();
        if (d.status === 'Pending') {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${d.email || 'User'}</td>
                          <td>$${d.amountUSD.toFixed(2)}</td>
                          <td>PKR ${d.amountPKR}</td>
                          <td><a href="${d.screenshot}" target="_blank">View</a></td>
                          <td>
                            <button onclick="approveDeposit('${userSnap.key}','${depSnap.key}')">Approve</button>
                          </td>`;
          tbody.appendChild(tr);
        }
      });
    });
  });
}

function approveDeposit(uid, depId) {
  db.ref(`deposits/${uid}/${depId}`).update({status:'Approved'});
  db.ref('users/' + uid).once('value').then(snap=>{
    const current = snap.val().totalBalance || 0;
    const depositUSD = snap.val().depositUSD || 0;
    const added = depositUSD || 0;
    db.ref('users/' + uid).update({totalBalance: current + added});
    loadDepositRequests();
    alert('Deposit approved!');
  });
}

// ------------------------
// Withdraw Requests
// ------------------------
function loadWithdrawRequests() {
  const tbody = document.getElementById('withdrawTable');
  tbody.innerHTML = '';
  db.ref('withdrawals').once('value').then(snap => {
    snap.forEach(userSnap => {
      userSnap.forEach(wSnap => {
        const w = wSnap.val();
        if (w.status === 'Pending') {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${w.email || 'User'}</td>
                          <td>$${w.amount}</td>
                          <td>${w.method}</td>
                          <td>${w.account}</td>
                          <td>
                            <button onclick="approveWithdraw('${userSnap.key}','${wSnap.key}')">Approve</button>
                          </td>`;
          tbody.appendChild(tr);
        }
      });
    });
  });
}

function approveWithdraw(uid, wId) {
  db.ref(`withdrawals/${uid}/${wId}`).update({status:'Approved'});
  loadWithdrawRequests();
  alert('Withdraw approved!');
}
