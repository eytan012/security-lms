require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

const mockBlocks = [
  {
    title: 'מבוא לאבטחת מידע',
    type: 'video',
    content: 'https://example.com/intro-video',
    order: 1,
    estimatedTime: 15,
    description: 'סקירה כללית של עקרונות אבטחת מידע בסיסיים'
  },
  {
    title: 'סיסמאות חזקות',
    type: 'simulation',
    content: 'password-strength-simulator',
    order: 2,
    estimatedTime: 20,
    description: 'תרגול יצירת סיסמאות חזקות וזיהוי סיסמאות חלשות'
  },
  {
    title: 'בוחן סיסמאות',
    type: 'quiz',
    content: 'password-quiz',
    order: 3,
    estimatedTime: 10,
    description: 'בחן את הידע שלך בנושא סיסמאות חזקות'
  },
  {
    title: 'אבטחת דואר אלקטרוני',
    type: 'video',
    content: 'https://example.com/email-security',
    order: 4,
    estimatedTime: 25,
    description: 'למד כיצד לזהות ולהתמודד עם איומי דואר אלקטרוני'
  },
  {
    title: 'סימולטור פישינג',
    type: 'simulation',
    content: 'phishing-simulator',
    order: 5,
    estimatedTime: 30,
    description: 'תרגול זיהוי הודעות פישינג ודואר זדוני'
  }
];

async function uploadMockBlocks() {
  try {
    const blocksRef = collection(db, 'blocks');
    
    for (const block of mockBlocks) {
      const docRef = await addDoc(blocksRef, {
        ...block,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Added block with ID:', docRef.id);
    }

    console.log('Successfully uploaded all blocks to Firestore');
  } catch (error) {
    console.error('Error uploading blocks:', error);
  }
}

uploadMockBlocks();
