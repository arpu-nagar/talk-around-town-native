import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCQ5FKEmRdjopvTruLWRqkQyY7ATJIPzs",
  authDomain: "talk-around-town-423916-ec889.firebaseapp.com",
  projectId: "talk-around-town-423916-ec889",
  storageBucket: "talk-around-town-423916-ec889.firebasestorage.app",
  messagingSenderId: "96534916371",
  appId: "1:96534916371:android:9de26ff9db83dc02b6bee6"
};

// Initialize Firebase if it hasn't been initialized yet
if (!auth().app) {
  initializeApp(firebaseConfig);
}

export default auth;