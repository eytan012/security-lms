require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Your web app's Firebase configuration from environment variables
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

async function uploadMockTests() {
  try {
    // Read the mock tests file
    const mockTestsPath = path.join(__dirname, '..', 'docs', 'MOCKUP_TESTS.json');
    const mockTests = JSON.parse(fs.readFileSync(mockTestsPath, 'utf8'));

    // Upload each test as a material to Firestore
    const materialsRef = collection(db, 'materials');
    
    for (const [index, test] of mockTests.entries()) {
      const material = {
        id: `quiz-${test.id}`,
        courseId: 'course-1', // Using the default course ID from mockData
        title: test.question,
        type: 'quiz',
        content: {
          question: test.question,
          options: test.options,
          correctIndex: test.correctIndex,
          explanation: test.explanation
        },
        order: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(materialsRef, material);
      console.log('Added quiz material with ID:', docRef.id);
    }

    console.log('Successfully uploaded all quiz materials to Firestore');
  } catch (error) {
    console.error('Error uploading quiz materials:', error);
  }
}

uploadMockTests();

uploadMockTests();
