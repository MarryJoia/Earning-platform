const firebaseConfig={apiKey:"YOUR_KEY",authDomain:"YOUR_DOMAIN",projectId:"YOUR_ID"};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();

function generateRef(){return Math.random().toString(36).substring(2,8).toUpperCase();}

function signup(){
 const e=email.value,p=password.value,r=referral.value;
 auth.createUserWithEmailAndPassword(e,p).then(()=>{
  db.collection("users").doc(e).set({
   earnings:0,package:"None",refCode:generateRef(),referredBy:r
  });
  location.href="login.html";
 });
}

function login(){
 auth.signInWithEmailAndPassword(email.value,password.value)
 .then(()=>location.href="dashboard.html");
}

function selectPackage(pkg,daily){
 const u=auth.currentUser.email;
 db.collection("users").doc(u).update({
  package:pkg,
  earnings:firebase.firestore.FieldValue.increment(daily)
 });
 loadData();
}

function loadData(){
 const u=auth.currentUser.email;
 db.collection("users").doc(u).get().then(d=>{
  earnings.innerText=d.data().earnings;
  package.innerText=d.data().package;
 });
}

function withdraw(){
 db.collection("withdraws").add({
  user:auth.currentUser.email,
  amount:amount.value,
  method:method.value,
  number:number.value,
  status:"Pending"
 });
 alert("Request Submitted");
}
