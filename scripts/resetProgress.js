/**
 * סקריפט לאיפוס התקדמות משתמשים במערכת הלמידה
 * משתמש ב-Firebase Admin SDK לגישה ישירה לבסיס הנתונים
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// האוסף הנוכחי שבו נשמרת ההתקדמות
const PROGRESS_COLLECTION = 'progress';

// נתיב לקובץ האימות של Firebase Admin
// יש ליצור קובץ כזה בלוח הבקרה של Firebase
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../admin.json');

// בדיקה אם קובץ האימות קיים
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`Service account file not found at: ${SERVICE_ACCOUNT_PATH}`);
  console.error('Please download the service account key from Firebase console and save it to this location.');
  console.error('Instructions:');
  console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.error('2. Click "Generate new private key"');
  console.error('3. Save the file as "serviceAccountKey.json" in the root of your project');
  process.exit(1);
}

// אתחול Firebase Admin עם קובץ האימות
try {
  admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH))
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

// יצירת חיבור ל-Firestore
const db = admin.firestore();

/**
 * פונקציה לאיפוס ההתקדמות של כל המשתמשים
 */
async function resetProgress() {
  try {
    console.log('Starting progress reset for all users...');

    // קבלת כל רשומות ההתקדמות
    const progressSnapshot = await db.collection(PROGRESS_COLLECTION).get();

    if (progressSnapshot.empty) {
      console.log('No progress records found to delete.');
      return;
    }

    // מחיקת הרשומות באצווה
    const batch = db.batch();
    let count = 0;

    progressSnapshot.docs.forEach(doc => {
      console.log(`Queuing deletion for document: ${doc.id}`);
      batch.delete(doc.ref);
      count++;
    });

    // ביצוע המחיקה
    await batch.commit();
    console.log(`Successfully deleted ${count} progress records`);
  } catch (error) {
    console.error('Error resetting progress:', error);
    throw error;
  }
}

// הוספת אפשרות לאפס התקדמות רק עבור משתמש מסוים
/**
 * פונקציה לאיפוס ההתקדמות של משתמש ספציפי
 * @param {string} userId - מזהה המשתמש שאת ההתקדמות שלו רוצים לאפס
 */
async function resetProgressForUser(userId) {
  try {
    console.log(`Starting progress reset for user: ${userId}...`);

    // קבלת רשומות ההתקדמות של המשתמש
    const progressSnapshot = await db.collection(PROGRESS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    if (progressSnapshot.empty) {
      console.log(`No progress records found for user: ${userId}`);
      return;
    }

    // מחיקת הרשומות באצווה
    const batch = db.batch();
    let count = 0;

    progressSnapshot.docs.forEach(doc => {
      console.log(`Queuing deletion for user ${userId}, document: ${doc.id}`);
      batch.delete(doc.ref);
      count++;
    });

    // ביצוע המחיקה
    await batch.commit();
    console.log(`Successfully deleted ${count} progress records for user: ${userId}`);
  } catch (error) {
    console.error(`Error resetting progress for user ${userId}:`, error);
    throw error;
  }
}

/**
 * הפעלת הסקריפט וטיפול בפרמטרים
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      // אם הועבר פרמטר, מניחים שזה מזהה משתמש
      const userId = args[0];
      await resetProgressForUser(userId);
      console.log(`Progress reset for user ${userId} completed successfully.`);
    } else {
      // אם לא הועברו פרמטרים, אפס את ההתקדמות של כל המשתמשים
      await resetProgress();
      console.log('Progress reset for all users completed successfully.');
    }
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
}

/**
 * הוראות שימוש
 */
function printUsage() {
  console.log('\nUsage:');
  console.log('  node resetProgress.js                  - Reset progress for all users');
  console.log('  node resetProgress.js [userId]         - Reset progress for a specific user\n');
  console.log('Before running this script:');
  console.log('1. Download a service account key from Firebase console');
  console.log('2. Save it as "serviceAccountKey.json" in the root directory of the project\n');
}

// הצגת הוראות שימוש
printUsage();

// הפעלת הסקריפט
main().then(() => {
  console.log('Script completed successfully.');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
