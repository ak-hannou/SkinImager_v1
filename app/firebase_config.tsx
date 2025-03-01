// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {

};

// Initialize Firebase
const conf = initializeApp(firebaseConfig);

// Setup analytics (if supported, else null)
const analytics = isSupported().then((yes) =>
  yes ? getAnalytics(conf) : null
);

export const storage = getStorage(conf);
export const db = initializeFirestore();

export default conf;
