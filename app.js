// Firebase config
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

// --- AUTH ---
function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const referralCode = document.getElementById('referralCode').value.trim();

  auth.createUserWithEmailAndPassword(email,password)
  .then(user=>{
    const uid = user.user.uid;
    const myReferralCode = uid.substring(0,6).toUpperCase();
    db.ref('users/'+uid).set({
      totalBalance:0,
      earnedIncome:0,
      referralIncome:0,
      package:null,
      dailyIncome:0,
      lastCollected:0,
      myReferralCode:myReferralCode
    });

    // Handle referral bonus
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
    showDashboard();
  }).catch(e=>alert(e.message));
}

function login(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email,password)
  .then(()=>showDashboard())
  .catch(e=>alert(e.message));
}

function logout(){
  auth.signOut().then(()=>{
    document.getElementById('dashboard-container').style.display='none';
    document.getElementById('auth-container').style.display='block';
  });
}

// --- DASHBOARD ---
function showDashboard(){
  document.getElementById('auth-container').style.display='none';
  document.getElementById('dashboard-container').style.display='block';
  loadUserData();
}

function loadUserData(){
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).on('value',snap=>{
    const data = snap.val();
    document.getElementById('totalBalance').innerText=data.totalBalance.toFixed(2);
    document.getElementById('earnedIncome').innerText=data.earnedIncome.toFixed(2);
    document.getElementById('referralIncome').innerText=data.referralIncome.toFixed(2);
    document.getElementById('dailyIncome').innerText=data.dailyIncome.toFixed(2);
    document.getElementById('myReferralCode').innerText=data.myReferralCode || '---';

    const last = data.lastCollected ||0;
    const now = Date.now();
    const diff = 24*60*60*1000 - (now-last);
    if(!data.package){ document.getElementById('collectBtn').disabled=true; document.getElementById('nextCollect').innerText='No package purchased'; }
    else if(diff<=0){ document.getElementById('collectBtn').disabled=false; document.getElementById('nextCollect').innerText='Now Available'; }
    else startCountdown(diff);
  });
}

function startCountdown(ms){
  clearInterval(countdownInterval);
  function update(){
    if(ms<=0){ clearInterval(countdownInterval); document.getElementById('collectBtn').disabled=false; document.getElementById('nextCollect').innerText='Now Available'; return;}
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    document.getElementById('nextCollect').innerText=`${h}h ${m}m ${s}s`;
    ms-=1000;
  }
  update();
  countdownInterval=setInterval(update,1000);
}

// --- COLLECT DAILY INCOME ---
function collectIncome(){
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).once('value').then(snap=>{
    const data = snap.val();
    const now = Date.now();
    if(now-(data.lastCollected||0)>=24*60*60*1000){
      const newTotal = data.totalBalance + data.dailyIncome;
      const newEarned = data.earnedIncome + data.dailyIncome;
      db.ref('users/'+uid).update({ totalBalance:newTotal, earnedIncome:newEarned, lastCollected:now });
      alert(`You collected $${data.dailyIncome} today!`);
    } else alert('Daily income not yet available');
  });
}

// --- BUY PACKAGE ---
function buyPackage(price,dailyIncome){
  const uid = auth.currentUser.uid;
  db.ref('users/'+uid).once('value').then(snap=>{
    const balance = snap.val().totalBalance||0;
    if(balance<price) return alert('Insufficient balance. Deposit first!');
    db.ref('users/'+uid).update({
      package:`$${price}`,
      dailyIncome:dailyIncome,
      totalBalance:balance-price
    });
    alert(`Package $${price} purchased! Daily income $${dailyIncome}`);
  });
}

// --- DEPOSIT ---
document.getElementById('depositAmountPKR')?.addEventListener('input',()=>{
  const val=parseFloat(document.getElementById('depositAmountPKR').value)||0;
  document.getElementById('convertedUSD').innerText=(val/PKR_TO_USD).toFixed(2);
});

function showDepositPage(){ document.getElementById('dashboard-container').style.display='none'; document.getElementById('deposit-container').style.display='block'; loadDepositHistory(); }

function submitDeposit(){
  const uid = auth.currentUser.uid;
  const amountPKR=parseFloat(document.getElementById('depositAmountPKR').value);
  const amountUSD=amountPKR/PKR_TO_USD;
  const file=document.getElementById('depositScreenshot').files[0];
  if(!amountPKR || !file) return alert('Enter amount and upload screenshot');

  const storageRef=storage.ref('deposits/'+uid+'/'+Date.now());
  storageRef.put(file).then(snap=>{
    snap.ref.getDownloadURL().then(url=>{
      db.ref('deposits/'+uid).push({
        amountUSD:amountUSD,
        amountPKR:amountPKR,
        screenshot:url,
        timestamp:Date.now(),
        status:'Approved'
      });
      db.ref('users/'+uid).once('value').then(snap=>{
        const current=snap.val().totalBalance||0;
        db.ref('users/'+uid).update({ totalBalance: current+amountUSD });
      });
      alert('Deposit successful!');
      loadDepositHistory();
    });
  });
}

function loadDepositHistory(){
  const uid=auth.currentUser.uid;
  const list=document.getElementById('depositHistory');
  list.innerHTML='';
  db.ref('deposits/'+uid).once('value').then(snap=>{
    snap.forEach(c=>{
      const d=c.val();
      const li=document.createElement('li');
      li.innerHTML=`PKR ${d.amountPKR} = $${d.amountUSD.toFixed(2)} - ${d.status} - <a href="${d.screenshot}" target="_blank">View</a>`;
      list.appendChild(li);
    });
  });
}

// --- WITHDRAW ---
function showWithdrawPage(){ document.getElementById('dashboard-container').style.display='none'; document.getElementById('withdraw-container').style.display='block'; loadWithdrawHistory(); }

function submitWithdraw(){
  const uid=auth.currentUser.uid;
  const amount=parseFloat(document.getElementById('withdrawAmount').value);
  const method=document.getElementById('withdrawMethod').value;
  const account=document.getElementById('withdrawAccount').value;
  if(!amount || !account) return alert('Enter amount and account');

  db.ref('users/'+uid).once('value').then(snap=>{
    const balance=snap.val().totalBalance||0;
    if(amount>balance) return alert('Insufficient balance');
    db.ref('withdrawals/'+uid).push({ amount, method, account, timestamp:Date.now(), status:'Pending' });
    db.ref('users/'+uid).update({ totalBalance: balance-amount });
    alert('Withdraw request submitted!');
    loadWithdrawHistory();
  });
}

function loadWithdrawHistory(){
  const uid=auth.currentUser.uid;
  const list=document.getElementById('withdrawHistory');
  list.innerHTML='';
  db.ref('withdrawals/'+uid).once('value').then(snap=>{
    snap.forEach(c=>{
      const w=c.val();
      const li=document.createElement('li');
      li.innerText=`$${w.amount} - ${w.method} - ${w.status}`;
      list.appendChild(li);
    });
  });
}

function backToDashboard(){ document.getElementById('deposit-container').style.display='none'; document.getElementById('withdraw-container').style.display='none'; document.getElementById('dashboard-container').style.display='block'; }

// --- REFERRAL LINK COPY ---
function copyReferralLink(){
  const uid=auth.currentUser.uid;
  db.ref('users/'+uid).once('value').then(snap=>{
    const code=snap.val().myReferralCode;
    const link=`${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied! Share: '+link);
  });
}
