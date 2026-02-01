// Firebase configuration
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
const storage = firebase.storage();

// User Signup
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
  .then(userCredential => {
    const uid = userCredential.user.uid;
    db.ref('users/' + uid).set({
      totalBalance: 0,
      earnedIncome: 0,
      referralIncome: 0,
      package: null,
      dailyIncome: 0,
      lastCollected: 0
    });
    showDashboard();
  })
  .catch(error => alert(error.message));
}

// User Login
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
  .then(() => showDashboard())
  .catch(error => alert(error.message));
}

// Logout
function logout() {
  auth.signOut().then(() => {
    document.getElementById('dashboard-container').style.display='none';
    document.getElementById('auth-container').style.display='block';
  });
}

// Show Dashboard
function showDashboard() {
  document.getElementById('auth-container').style.display='none';
  document.getElementById('dashboard-container').style.display='block';
  loadUserData();
}

// Load user data
function loadUserData() {
  const uid = auth.currentUser.uid;
  const userRef = db.ref('users/' + uid);
  userRef.on('value', snapshot => {
    const data = snapshot.val();
    document.getElementById('totalBalance').innerText = data.totalBalance || 0;
    document.getElementById('earnedIncome').innerText = data.earnedIncome || 0;
    document.getElementById('referralIncome').innerText = data.referralIncome || 0;
    document.getElementById('dailyIncome').innerText = data.dailyIncome || 0;

    const last = data.lastCollected || 0;
    const now = Date.now();
    if(!data.package) {
      document.getElementById('collectBtn').disabled = true;
      document.getElementById('nextCollect').innerText = 'No package purchased';
    } else if(now - last >= 24*60*60*1000) {
      document.getElementById('collectBtn').disabled = false;
      document.getElementById('nextCollect').innerText = 'Now Available';
    } else {
      document.getElementById('collectBtn').disabled = true;
      const hours = Math.floor((24*60*60*1000 - (now - last))/3600000);
      document.getElementById('nextCollect').innerText = hours + ' hours left';
    }
  });
}

// Buy Package
function buyPackage(name, dailyIncome) {
  const uid = auth.currentUser.uid;
  db.ref('users/' + uid).update({
    package: name,
    dailyIncome: dailyIncome
  });
  alert(`Package ${name} purchased! Daily income $${dailyIncome}`);
}

// Collect Daily Income
function collectIncome() {
  const uid = auth.currentUser.uid;
  const userRef = db.ref('users/' + uid);
  userRef.once('value').then(snapshot => {
    const data = snapshot.val();
    const now = Date.now();
    if(now - (data.lastCollected || 0) >= 24*60*60*1000) {
      const newTotal = (data.totalBalance || 0) + (data.dailyIncome || 0);
      const newEarned = (data.earnedIncome || 0) + (data.dailyIncome || 0);
      userRef.update({
        totalBalance: newTotal,
        earnedIncome: newEarned,
        lastCollected: now
      });
      alert(`You collected $${data.dailyIncome} today!`);
    } else {
      alert('Daily income not yet available.');
    }
  });
}

// Deposit Page
function showDepositPage() {
  document.getElementById('dashboard-container').style.display='none';
  document.getElementById('deposit-container').style.display='block';
  loadDepositHistory();
}

function submitDeposit() {
  const uid = auth.currentUser.uid;
  const amount = document.getElementById('depositAmount').value;
  const file = document.getElementById('depositScreenshot').files[0];
  if(!amount || !file) return alert('Enter amount and upload screenshot');
  
  const storageRef = storage.ref('deposits/'+uid+'/'+Date.now());
  storageRef.put(file).then(snapshot => {
    snapshot.ref.getDownloadURL().then(url => {
      const depositRef = db.ref('deposits/'+uid).push();
      depositRef.set({
        amount: parseFloat(amount),
        screenshot: url,
        timestamp: Date.now(),
        status: 'Pending'
      });
      alert('Deposit submitted!');
      loadDepositHistory();
    });
  });
}

function loadDepositHistory() {
  const uid = auth.currentUser.uid;
  const list = document.getElementById('depositHistory');
  list.innerHTML='';
  db.ref('deposits/'+uid).once('value').then(snapshot => {
    snapshot.forEach(child => {
      const d = child.val();
      const li = document.createElement('li');
      li.innerHTML = `$${d.amount} - ${d.status} - <a href="${d.screenshot}" target="_blank">View Screenshot</a>`;
      list.appendChild(li);
    });
  });
}

// Withdraw Page
function showWithdrawPage() {
  document.getElementById('dashboard-container').style.display='none';
  document.getElementById('withdraw-container').style.display='block';
  loadWithdrawHistory();
}

function submitWithdraw() {
  const uid = auth.currentUser.uid;
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const method = document.getElementById('withdrawMethod').value;
  const account = document.getElementById('withdrawAccount').value;

  if(!amount || !account) return alert('Enter amount and account');
  const userRef = db.ref('users/'+uid);
  userRef.once('value').then(snapshot => {
    const balance = snapshot.val().totalBalance || 0;
    if(amount > balance) return alert('Insufficient balance');

    const withdrawRef = db.ref('withdrawals/'+uid).push();
    withdrawRef.set({
      amount: amount,
      method: method,
      account: account,
      timestamp: Date.now(),
      status: 'Pending'
    });

    userRef.update({totalBalance: balance - amount});
    alert('Withdraw request submitted!');
    loadWithdrawHistory();
  });
}

function loadWithdrawHistory() {
  const uid = auth.currentUser.uid;
  const list = document.getElementById('withdrawHistory');
  list.innerHTML='';
  db.ref('withdrawals/'+uid).once('value').then(snapshot => {
    snapshot.forEach(child => {
      const w = child.val();
      const li = document.createElement('li');
      li.innerText = `$${w.amount} - ${w.method} - ${w.status}`;
      list.appendChild(li);
    });
  });
}

function backToDashboard() {
  document.getElementById('deposit-container').style.display='none';
  document.getElementById('withdraw-container').style.display='none';
  document.getElementById('dashboard-container').style.display='block';
}
