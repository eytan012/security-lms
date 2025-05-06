import { db } from './config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

// אוסף הדירוגים ב-Firestore
const RATINGS_COLLECTION = 'ratings';

/**
 * שמירת דירוג חדש של משתמש
 * @param {string} userId - מזהה המשתמש
 * @param {number} rating - דירוג (1-5)
 * @param {string} comment - הערה (אופציונלי)
 * @returns {Promise<object>} - המסמך שנוצר
 */
export const saveRating = async (userId, rating, comment = '') => {
  try {
    // יצירת רשומת דירוג חדשה בכל פעם
    const timestamp = serverTimestamp();
    const ratingData = {
      userId,
      rating,
      comment,
      createdAt: timestamp,
      lastRatingDate: timestamp
    };
    
    const docRef = await addDoc(collection(db, RATINGS_COLLECTION), ratingData);
    return {
      id: docRef.id,
      ...ratingData,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error saving rating:', error);
    throw error;
  }
};

/**
 * קבלת הדירוג האחרון של משתמש ספציפי
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<object|null>} - הדירוג האחרון של המשתמש או null אם לא קיים
 */
export const getUserRating = async (userId) => {
  try {
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    // שימוש בשאילתה פשוטה ללא צורך באינדקס
    const q = query(
      ratingsRef, 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // מיון התוצאות בצד הלקוח (לא בשרת)
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // המרת ה-timestamp לאובייקט Date לצורך המיון
      createdAtDate: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    }));
    
    // מיון לפי תאריך יצירה (החדש ביותר קודם)
    docs.sort((a, b) => b.createdAtDate - a.createdAtDate);
    
    // החזרת הרשומה הראשונה (החדשה ביותר)
    const latestRating = docs[0];
    if (latestRating) {
      // הסרת השדה הנוסף שהוספנו לצורך המיון
      delete latestRating.createdAtDate;
      return latestRating;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user rating:', error);
    throw error;
  }
};

/**
 * קבלת כל הדירוגים במערכת
 * @param {number} limitCount - מספר הדירוגים המקסימלי להחזרה
 * @returns {Promise<Array>} - מערך של דירוגים
 */
export const getAllRatings = async (limitCount = 100) => {
  try {
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(ratingsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all ratings:', error);
    throw error;
  }
};

/**
 * קבלת כל הדירוגים של משתמש ספציפי
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - מערך של כל הדירוגים של המשתמש
 */
export const getUserRatings = async (userId) => {
  try {
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    // שימוש בשאילתה פשוטה ללא צורך באינדקס
    const q = query(
      ratingsRef, 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    // המרת התוצאות והוספת שדה תאריך לצורך המיון
    const ratings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // המרת ה-timestamp לאובייקט Date לצורך המיון
      createdAtDate: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    }));
    
    // מיון לפי תאריך יצירה (החדש ביותר קודם)
    ratings.sort((a, b) => b.createdAtDate - a.createdAtDate);
    
    // הסרת השדה הנוסף מכל הרשומות
    return ratings.map(rating => {
      const { createdAtDate, ...rest } = rating;
      return rest;
    });
  } catch (error) {
    console.error('Error getting user ratings:', error);
    throw error;
  }
};

/**
 * חישוב הדירוג הממוצע
 * @returns {Promise<number>} - הדירוג הממוצע
 */
export const getAverageRating = async () => {
  try {
    const ratings = await getAllRatings(1000); // מגביל ל-1000 דירוגים לביצועים טובים יותר
    
    if (ratings.length === 0) {
      return 0;
    }
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return sum / ratings.length;
  } catch (error) {
    console.error('Error calculating average rating:', error);
    throw error;
  }
};
