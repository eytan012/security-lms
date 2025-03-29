require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');

const COLLECTION_NAME = 'materialProgress';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetProgress() {
  try {
    console.log('Starting progress reset...');

    // Delete all progress documents
    const progressRef = collection(db, COLLECTION_NAME);
    const progressSnapshot = await getDocs(progressRef);
    const deletePromises = [];

    progressSnapshot.forEach((doc) => {
      console.log(`Deleting progress document: ${doc.id}`);
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    console.log(`Successfully deleted ${progressSnapshot.size} progress records`);

    process.exit(0);
  } catch (error) {
    console.error('Error resetting progress:', error);
    process.exit(1);
  }
}

resetProgress();
