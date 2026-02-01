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

// Load Users
function loadUsers(){
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML='';
  db.ref('users').once('value').then(snap=>{
    snap.forEach(uSnap=>{
      const u = uSnap.val();
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${u.email||uSnap.key}</td>
                    <td>${(u.totalBalance||0).toFixed(2)}</td>
                    <td>${(u.earnedIncome||0).toFixed(2)}</td>
                    <td>${(u.referralIncome||0).toFixed(2)}</td>
                    <td>${u.package||'-'}</td>`;
      tbody.appendChild(tr);
    });
  });
}

// Load Deposits
function loadDeposits(){
  const tbody = document.querySelector('#depositTable tbody');
  tbody.innerHTML='';
  db.ref('deposits').once('value').then(users=>{
    users.forEach(userSnap=>{
      const uid=userSnap.key;
      const deposits=userSnap.val();
      for(let dKey in deposits){
        const d=deposits[dKey];
        if(d.status==='Pending'){
          db.ref('users/'+uid+'/email').once('value').then(emailSnap=>{
            const email=emailSnap.val()||uid;
            const tr=document.createElement('tr');
            tr.innerHTML=`<td>${email}</td>
                          <td>${d.amountUSD.toFixed(2)}</td>
                          <td>${d.amountPKR}</td>
                          <td><a href="${d.screenshot}" target="_blank">View</a></td>
                          <td>
                            <button onclick="approveDeposit('${uid}','${dKey}',${d.amountUSD})">Approve</button>
                            <button onclick="rejectDeposit('${uid}','${dKey}')">Reject</button>
                          </td>`;
            tbody.appendChild(tr);
          });
        }
      }
    });
  });
}

function approveDeposit(uid,dKey,amount){
  db.ref('deposits/'+uid+'/'+dKey).update({status:'Approved'});
  db.ref('users/'+uid).once('value').then(snap=>{
    const total=snap.val().totalBalance||0;
    db.ref('users/'+uid).update({totalBalance:total+amount});
    loadUsers(); loadDeposits();
  });
}

function rejectDeposit(uid,dKey){
  db.ref('deposits/'+uid+'/'+dKey).update({status:'Rejected'});
  loadDeposits();
}

// Load Withdraws
function loadWithdraws(){
  const tbody=document.querySelector('#withdrawTable tbody');
  tbody.innerHTML='';
  db.ref('withdrawals').once('value').then(users=>{
    users.forEach(userSnap=>{
      const uid=userSnap.key;
      const withdraws=userSnap.val();
      for(let wKey in withdraws){
        const w=withdraws[wKey];
        if(w.status==='Pending'){
          db.ref('users/'+uid+'/email').once('value').then(emailSnap=>{
            const email=emailSnap.val()||uid;
            const tr=document.createElement('tr');
            tr.innerHTML=`<td>${email}</td>
                          <td>${w.amount}</td>
                          <td>${w.method}</td>
                          <td>${w.account}</td>
                          <td>
                            <button onclick="approveWithdraw('${uid}','${wKey}')">Approve</button>
                            <button onclick="rejectWithdraw('${uid}','${wKey}')">Reject</button>
                          </td>`;
            tbody.appendChild(tr);
          });
        }
      }
    });
  });
}

function approveWithdraw(uid,wKey){ db.ref('withdrawals/'+uid+'/'+wKey).update({status:'Approved'}); loadWithdraws(); }
function rejectWithdraw(uid,wKey){ db.ref('withdrawals/'+uid+'/'+wKey).update({status:'Rejected'}); loadWithdraws(); }
function logoutAdmin(){ auth.signOut().then(()=>window.location.href='admin-login.html'); }

// Init Admin
loadUsers();
loadDeposits();
loadWithdraws();
