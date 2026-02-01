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
  appId: "1:785014377238:web:3ee94e861b97f4a31c1e37",
  measurementId: "G-QRM1VKP98G"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ------------------------
// ADMIN LOGIN
// ------------------------
function adminLogin(){
  const email=document.getElementById('adminEmail').value;
  const password=document.getElementById('adminPassword').value;
  auth.signInWithEmailAndPassword(email,password)
  .then(()=>window.location.href='admin.html')
  .catch(e=>alert(e.message));
}

// ------------------------
// ADMIN DASHBOARD
// ------------------------
if(document.getElementById('usersTable')){
  auth.onAuthStateChanged(user=>{
    if(!user) window.location.href='admin-login.html';
    loadUsers();
    loadDeposits();
    loadWithdraws();
  });
}

function loadUsers(){
  db.ref('users').once('value').then(snap=>{
    const tbody=document.querySelector('#usersTable tbody');
    tbody.innerHTML='';
    snap.forEach(u=>{
      const data=u.val();
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${data.email}</td>
                     <td>$${(data.totalBalance||0).toFixed(2)}</td>
                     <td>$${(data.earnedIncome||0).toFixed(2)}</td>
                     <td>$${(data.referralIncome||0).toFixed(2)}</td>
                     <td>${data.package||'---'}</td>`;
      tbody.appendChild(tr);
    });
  });
}

function loadDeposits(){
  db.ref('deposits').once('value').then(snap=>{
    const tbody=document.querySelector('#depositTable tbody');
    tbody.innerHTML='';
    snap.forEach(u=>{
      const uid=u.key;
      const userRef=db.ref('users/'+uid);
      u.forEach(d=>{
        const data=d.val();
        if(data.status!=='Pending') return;
        userRef.once('value').then(uSnap=>{
          const email=uSnap.val().email;
          const tr=document.createElement('tr');
          tr.innerHTML=`<td>${email}</td>
                          <td>$${data.amountUSD.toFixed(2)}</td>
                          <td>PKR ${data.amountPKR}</td>
                          <td><a href="${data.screenshot}" target="_blank">View</a></td>
                          <td>
                            <button onclick="approveDeposit('${uid}','${d.key}',${data.amountUSD})">Approve</button>
                          </td>`;
          tbody.appendChild(tr);
        });
      });
    });
  });
}

function approveDeposit(uid,key,usd){
  if(confirm('Approve this deposit?')){
    db.ref(`deposits/${uid}/${key}`).update({status:'Approved'});
    db.ref(`users/${uid}`).once('value').then(snap=>{
      const totalBalance=snap.val().totalBalance||0;
      db.ref(`users/${uid}`).update({totalBalance:totalBalance+usd});
      alert('Deposit approved!');
      loadDeposits();
      loadUsers();
    });
  }
}

function loadWithdraws(){
  db.ref('withdrawals').once('value').then(snap=>{
    const tbody=document.querySelector('#withdrawTable tbody');
    tbody.innerHTML='';
    snap.forEach(u=>{
      const uid=u.key;
      const userRef=db.ref('users/'+uid);
      u.forEach(w=>{
        const data=w.val();
        if(data.status!=='Pending') return;
        userRef.once('value').then(uSnap=>{
          const email=uSnap.val().email;
          const tr=document.createElement('tr');
          tr.innerHTML=`<td>${email}</td>
                          <td>$${data.amount}</td>
                          <td>${data.method}</td>
                          <td>${data.account}</td>
                          <td>
                            <button onclick="approveWithdraw('${uid}','${w.key}')">Approve</button>
                          </td>`;
          tbody.appendChild(tr);
        });
      });
    });
  });
}

function approveWithdraw(uid,key){
  if(confirm('Approve this withdrawal?')){
    db.ref(`withdrawals/${uid}/${key}`).update({status:'Approved'});
    alert('Withdraw approved!');
    loadWithdraws();
    loadUsers();
  }
}

function logoutAdmin(){ auth.signOut().then(()=>window.location.href='admin-login.html'); }
