require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

const blockUpdates = {
  'מבוא לאבטחת מידע': {
    content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video URL
    questions: []
  },
  'סיסמאות חזקות': {
    content: 'password-strength-simulator',
    questions: []
  },
  'בוחן סיסמאות': {
    content: 'password-quiz',
    questions: [
      {
        text: 'איזו מהסיסמאות הבאות היא החזקה ביותר?',
        options: [
          'password123',
          'P@ssw0rd!2023',
          'mybirthday1990',
          'abcd1234'
        ],
        correctAnswer: 1,
        explanation: 'הסיסמה P@ssw0rd!2023 מכילה אותיות גדולות וקטנות, מספרים, תווים מיוחדים ואורך מספק.'
      },
      {
        text: 'מה מהבאים אינו מומלץ בבחירת סיסמה?',
        options: [
          'שימוש בתווים מיוחדים',
          'שילוב מספרים',
          'שימוש במילה מהמילון',
          'שימוש באותיות גדולות וקטנות'
        ],
        correctAnswer: 2,
        explanation: 'שימוש במילים מהמילון הופך את הסיסמה לפגיעה למתקפות מילון.'
      },
      {
        text: 'מהו האורך המינימלי המומלץ לסיסמה?',
        options: [
          '6 תווים',
          '8 תווים',
          '12 תווים',
          '4 תווים'
        ],
        correctAnswer: 2,
        explanation: 'סיסמה באורך 12 תווים או יותר מספקת הגנה טובה יותר נגד מתקפות כוח brute.'
      }
    ]
  },
  'אבטחת דואר אלקטרוני': {
    content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video URL
    questions: []
  },
  'סימולטור פישינג': {
    content: 'phishing-simulator',
    questions: []
  }
};

async function updateBlocks() {
  try {
    const blocksRef = collection(db, 'blocks');
    const blocksSnapshot = await getDocs(blocksRef);
    
    for (const blockDoc of blocksSnapshot.docs) {
      const blockData = blockDoc.data();
      const update = blockUpdates[blockData.title];
      
      if (update) {
        await updateDoc(doc(db, 'blocks', blockDoc.id), update);
        console.log(`Updated block: ${blockData.title}`);
      }
    }

    console.log('Successfully updated all blocks');
  } catch (error) {
    console.error('Error updating blocks:', error);
  }
}

updateBlocks();
