// Firebase config (same as user)
const firebaseConfig = {
  apiKey: "AIzaSyCHX45QbjATYaI5yO50ghgSoZP98yXo3Hs",
  authDomain: "earning-platform-a267f.firebaseapp.com",
  databaseURL: "https://earning-platform-a267f-default-rtdb.firebaseio.com",
  projectId: "earning-platform-a267f",
  storageBucket: "earning-platform-a267f.firebasestorage.app",
  messagingSenderId: "785014377238",
  appId: "1:785014377238:web:3ee94e861b97f4a31c1e37",
  measurementId: "G-QRM1VKP98G"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- ADMIN LOGIN ---
function adminLogin(email,password){
  auth.signInWithEmailAndPassword(email,password)
  .then(()=>loadAdminData())
  .catch(e=>alert(e.message));
}

// --- LOAD USERS ---
function loadAdminData(){
  const usersTable = document.querySelector('#usersTable tbody');
  usersTable.innerHTML='';
  db.ref('users').once('value').then(snap=>{
    snap.forEach(userSnap=>{
      const u = userSnap.val();
      const uid = userSnap.key;
      const tr = document.createElement('tr');
      tr.innerHTML=`
        <td>${u.email || uid}</td>
        <td>${u.totalBalance.toFixed(2)}</td>
        <td>${u.earnedIncome.toFixed(2)}</td>
        <td>${u.referralIncome.toFixed(2)}</td>
        <td>${u.package || '-'}</td>
        <td><button onclick="viewUser('${uid}')">View</button></td>
      `;
      usersTable.appendChild(tr);
    });
  });
}

// --- LOAD PENDING DEPOSITS ---
function loadDeposits(){
  const table = document.querySelector('#depositTable tbody');
  table.innerHTML='';
  db.ref('deposits').once('value').then(snap=>{
    snap.forEach(userSnap=>{
      const uid = userSnap.key;
      const deposits = userSnap.val();
      for(let dKey in deposits){
        const d = deposits[dKey];
        if(d.status==='Pending'){
          db.ref('users/'+uid+'/email').once('value').then(emailSnap=>{
            const email = emailSnap.val() || uid;
            const tr = document.createElement('tr');
            tr.innerHTML=`
              <td>${email}</td>
              <td>${d.amountUSD.toFixed(2)}</td>
              <td>${d.amountPKR}</td>
              <td><a href="${d.screenshot}" target="_blank">View</a></td>
              <td>
                <button onclick="approveDeposit('${uid}','${dKey}',${d.amountUSD})">Approve</button>
                <button onclick="rejectDeposit('${uid}','${dKey}')">Reject</button>
              </td>
            `;
            table.appendChild(tr);
          });
        }
      }
    });
  });
}

// --- LOAD PENDING WITHDRAWS ---
function loadWithdraws(){
  const table = document.querySelector('#withdrawTable tbody');
  table.innerHTML='';
  db.ref('withdrawals').once('value').then(snap=>{
    snap.forEach(userSnap=>{
      const uid = userSnap.key;
      const withdraws = userSnap.val();
      for(let wKey in withdraws){
        const w = withdraws[wKey];
        if(w.status==='Pending'){
          db.ref('users/'+uid+'/email').once('value').then(emailSnap=>{
            const email = emailSnap.val() || uid;
            const tr = document.createElement('tr');
            tr.innerHTML=`
              <td>${email}</td>
              <td>${w.amount}</td>
              <td>${w.method}</td>
              <td>${w.account}</td>
              <td>
                <button onclick="approveWithdraw('${uid}','${wKey}')">Approve</button>
                <button onclick="rejectWithdraw('${uid}','${wKey}')">Reject</button>
              </td>
            `;
            table.appendChild(tr);
          });
        }
      }
    });
  });
}

// --- DEPOSIT APPROVE / REJECT ---
function approveDeposit(uid,dKey,amount){
  db.ref('deposits/'+uid+'/'+dKey).update({status:'Approved'});
  db.ref('users/'+uid).once('value').then(snap=>{
    const total = snap.val().totalBalance||0;
    db.ref('users/'+uid).update({totalBalance:total+amount});
  });
  loadDeposits();
}

function rejectDeposit(uid,dKey){
  db.ref('deposits/'+uid+'/'+dKey).update({status:'Rejected'});
  loadDeposits();
}

// --- WITHDRAW APPROVE / REJECT ---
function approveWithdraw(uid,wKey){
  db.ref('withdrawals/'+uid+'/'+wKey).update({status:'Approved'});
  loadWithdraws();
}

function rejectWithdraw(uid,wKey){
  db.ref('withdrawals/'+uid+'/'+wKey).update({status:'Rejected'});
  loadWithdraws();
}

// --- LOGOUT ---
function logoutAdmin(){ auth.signOut().then(()=>window.location.href='admin-login.html'); }

// --- INIT ---
loadAdminData();
loadDeposits();
loadWithdraws();
