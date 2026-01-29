// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to write data
function writeUserData(userId, name, email) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email
  })
  .then(() => {
    console.log('Data saved successfully!');
  })
  .catch((error) => {
    console.error('Error writing data: ', error);
  });
}

// Function to read data
function readUserData(userId) {
  const userRef = firebase.database().ref('users/' + userId);
  userRef.on('value', (snapshot) => {
    const data = snapshot.val();
    console.log('User data:', data);
  }, (error) => {
    console.error('Error reading data: ', error);
  });
}

// Example usage
writeUserData('user1', 'Umair Ashraf', 'umair@example.com');
readUserData('user1');
