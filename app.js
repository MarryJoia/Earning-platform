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
const storage = firebase.storage();
const PKR_TO_USD = 300;
let countdownInterval;

// ------------------------
// AUTHENTICATION
// ------------------------
function signup(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const referralCode = document.getElementById('referralCode')?.value.trim();
  auth.createUserWithEmailAndPassword(email,password)
  .then(user=>{
    const uid = user.user.uid;
    const myReferralCode = uid.substring(0,6).toUpperCase();
    db.ref('users/'+uid).set({
      email,
      totalBalance:0,
      earnedIncome:0,
      referralIncome:0,
      package:null,
      dailyIncome:0,
      lastCollected:0,
      myReferralCode
    });
    if(referralCode){
      db.ref('users').orderByChild('myReferralCode').equalTo(referralCode).once('value')
      .then(snap=>{
        snap.forEach(refUser=>{
          const refData = refUser.val();
          const refUID = refUser.key;
          const bonus = 1;
          db.ref('users/'+refUID).update({
            referralIncome:(refData.referralIncome||0)+bonus,
            totalBalance:(refData.totalBalance||0)+bonus
          });
        });
      });
    }
    alert('Signup successful! Your referral code: '+myReferralCode);
    window.location.href='dashboard.html';
  }).catch(e=>alert(e.message));
}

function login(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email,password)
  .then(()=>window.location.href='dashboard.html')
  .catch(e=>alert(e.message));
}

function logout(){ auth.signOut().then(()=>window.location.href='index.html'); }

// ------------------------
// DASHBOARD FUNCTIONS
// ------------------------
function loadUserData(){
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).on('value',snap=>{
    const data = snap.val();
    document.getElementById('totalBalance')?.innerText=data.totalBalance.toFixed(2);
    document.getElementById('earnedIncome')?.innerText=data.earnedIncome.toFixed(2);
    document.getElementById('referralIncome')?.innerText=data.referralIncome.toFixed(2);
    document.getElementById('dailyIncome')?.innerText=data.dailyIncome.toFixed(2);
    document.getElementById('myReferralCode')?.innerText=data.myReferralCode || '---';
    if(!data.package){ document.getElementById('collectBtn')?.setAttribute('disabled','true'); document.getElementById('nextCollect')?.innerText='No package purchased'; }
    else{
      const lastCollected = data.lastCollected||0;
      const now = Date.now();
      const nextAvailable = lastCollected + 24*60*60*1000;
      const remaining = nextAvailable - now;
      if(remaining<=0){ document.getElementById('collectBtn')?.removeAttribute('disabled'); document.getElementById('nextCollect')?.innerText='Now Available'; }
      else{ document.getElementById('collectBtn')?.setAttribute('disabled','true'); startCountdown(remaining); }
    }
  });
}

function startCountdown(ms){
  clearInterval(countdownInterval);
  function update(){
    if(ms<=0){ clearInterval(countdownInterval); document.getElementById('collectBtn')?.removeAttribute('disabled'); document.getElementById('nextCollect')?.innerText='Now Available'; return;}
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    document.getElementById('nextCollect').innerText=`${h}h ${m}m ${s}s`;
    ms-=1000;
  }
  update();
  countdownInterval=setInterval(update,1000);
}

document.getElementById('collectBtn')?.addEventListener('click', ()=>{
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).once('value').then(snap=>{
    const data = snap.val();
    const now = Date.now();
    if(now-(data.lastCollected||0)>=24*60*60*1000){
      const newTotal = data.totalBalance + data.dailyIncome;
      const newEarned = data.earnedIncome + data.dailyIncome;
      db.ref('users/'+uid).update({ totalBalance:newTotal, earnedIncome:newEarned, lastCollected:now });
      alert(`You collected $${data.dailyIncome} today!`);
      loadUserData();
    } else alert('Daily income not yet available');
  });
});

// ------------------------
// PACKAGES
// ------------------------
function buyPackage(price,dailyIncome){
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).once('value').then(snap=>{
    const balance = snap.val().totalBalance||0;
    if(balance<price) return alert('Insufficient balance. Deposit first!');
    db.ref('users/'+uid).update({ package:`$${price}`, dailyIncome:dailyIncome, totalBalance:balance-price });
    alert(`Package $${price} purchased! Daily income $${dailyIncome}`);
  });
}

// ------------------------
// REFERRAL
// ------------------------
function copyReferralLink(){
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).once('value').then(snap=>{
    const code = snap.val().myReferralCode;
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied! Share: '+link);
  });
}

// ------------------------
// DEPOSIT PAGE
// ------------------------
if(document.getElementById('depositAmountPKR')){
  const amountInput = document.getElementById('depositAmountPKR');
  const screenshotInput = document.getElementById('depositScreenshot');
  const depositBtn = document.getElementById('depositBtn');
  const depositHistory = document.getElementById('depositHistory');

  amountInput.addEventListener('input',()=>{
    const val=parseFloat(amountInput.value)||0;
    document.getElementById('convertedUSD').innerText=(val/PKR_TO_USD).toFixed(2);
  });

  depositBtn.addEventListener('click', async ()=>{
    const uid = auth.currentUser.uid;
    const amountPKR = parseFloat(amountInput.value);
    const file = screenshotInput.files[0];
    if(!amountPKR) return alert('Enter deposit amount');
    if(!file) return alert('Upload screenshot');
    const amountUSD = amountPKR/PKR_TO_USD;
    try{
      const storageRef = storage.ref(`deposits/${uid}/${Date.now()}`);
      const snap = await storageRef.put(file);
      const url = await snap.ref.getDownloadURL();
      await db.ref(`deposits/${uid}`).push({ amountPKR, amountUSD, screenshot:url, timestamp:Date.now(), status:'Pending' });
      alert('Deposit submitted! Waiting admin approval.');
      loadDepositHistory();
      amountInput.value=''; screenshotInput.value='';
    }catch(e){ alert('Deposit failed: '+e.message);}
  });

  function loadDepositHistory(){
    depositHistory.innerHTML='';
    const uid = auth.currentUser.uid;
    db.ref('deposits/'+uid).once('value').then(snap=>{
      snap.forEach(c=>{
        const d = c.val();
        const li=document.createElement('li');
        li.innerHTML=`PKR ${d.amountPKR} = $${d.amountUSD.toFixed(2)} - ${d.status} - <a href="${d.screenshot}" target="_blank">View</a>`;
        depositHistory.appendChild(li);
      });
    });
  }
  loadDepositHistory();
}

// ------------------------
// WITHDRAW PAGE
// ------------------------
if(document.getElementById('withdrawBtn')){
  const withdrawBtn = document.getElementById('withdrawBtn');
  const withdrawHistory = document.getElementById('withdrawHistory');

  withdrawBtn.addEventListener('click', ()=>{
    const uid = auth.currentUser.uid;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    const account = document.getElementById('withdrawAccount').value;
    if(!amount || !account) return alert('Enter amount and account');
    db.ref('users/'+uid).once('value').then(snap=>{
      const balance = snap.val().totalBalance||0;
      if(amount>balance) return alert('Insufficient balance');
      db.ref('withdrawals/'+uid).push({ amount, method, account, timestamp:Date.now(), status:'Pending' });
      db.ref('users/'+uid).update({ totalBalance: balance-amount });
      alert('Withdraw request submitted!');
      loadWithdrawHistory();
    });
  });

  function loadWithdrawHistory(){
    withdrawHistory.innerHTML='';
    const uid = auth.currentUser.uid;
    db.ref('withdrawals/'+uid).once('value').then(snap=>{
      snap.forEach(c=>{
        const w = c.val();
        const li=document.createElement('li');
        li.innerText=`$${w.amount} - ${w.method} - ${w.status}`;
        withdrawHistory.appendChild(li);
      });
    });
  }
  loadWithdrawHistory();
}

// ------------------------
// INIT
// ------------------------
if(document.getElementById('dashboard-container')){
  auth.onAuthStateChanged(user=>{
    if(user) loadUserData();
    else window.location.href='index.html';
  });
}
