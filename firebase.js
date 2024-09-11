// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "flashcards-saas-fa7bc.firebaseapp.com",
  projectId: "flashcards-saas-fa7bc",
  storageBucket: "flashcards-saas-fa7bc.appspot.com",
  messagingSenderId: "957767039114",
  appId: "1:957767039114:web:b292e9fb63cb2711f25573",
  measurementId: "G-FQ1HWE0X1S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export {db}