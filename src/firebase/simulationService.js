import { 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// קבועים
const USER_SIMULATIONS_COLLECTION = 'userSimulations';
const SIMULATION_STATS_COLLECTION = 'simulationStats';

// שמירת תוצאות סימולציה של משתמש
export const saveSimulationResult = async (userId, result) => {
  try {
    // וידוא שיש userId תקין
    if (!userId) {
      console.warn('saveSimulationResult: userId is undefined or null');
      return { success: false, error: 'No userId provided' };
    }
    
    const userSimRef = doc(collection(db, USER_SIMULATIONS_COLLECTION));
    
    await setDoc(userSimRef, {
      userId,
      simulationId: result.simulationId,
      blockId: result.blockId,
      score: result.score,
      action: result.action,
      timeSpent: result.timeSpent,
      completedAt: Timestamp.fromDate(result.completedAt),
      createdAt: Timestamp.now()
    });

    // עדכון סטטיסטיקות כלליות
    await updateSimulationStats(result.simulationId, result.score);

    return { success: true, id: userSimRef.id };
  } catch (error) {
    console.error('Error saving simulation result:', error);
    throw error;
  }
};

// קבלת היסטוריית סימולציות של משתמש
export const getUserSimulationHistory = async (userId) => {
  try {
    const q = query(
      collection(db, USER_SIMULATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));
  } catch (error) {
    console.error('Error getting user simulation history:', error);
    throw error;
  }
};

// קבלת סטטיסטיקות של סימולציה ספציפית
export const getSimulationStats = async (simulationId) => {
  try {
    const statsRef = doc(db, SIMULATION_STATS_COLLECTION, simulationId);
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        successRate: 0,
        commonMistakes: {}
      };
    }

    return statsDoc.data();
  } catch (error) {
    console.error('Error getting simulation stats:', error);
    throw error;
  }
};

// עדכון סטטיסטיקות של סימולציה
const updateSimulationStats = async (simulationId, newScore) => {
  try {
    const statsRef = doc(db, SIMULATION_STATS_COLLECTION, simulationId);
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      // יצירת סטטיסטיקות חדשות
      await setDoc(statsRef, {
        totalAttempts: 1,
        totalScore: newScore,
        averageScore: newScore,
        successRate: newScore > 0 ? 100 : 0,
        lastUpdated: Timestamp.now()
      });
    } else {
      const currentStats = statsDoc.data();
      const newTotalAttempts = currentStats.totalAttempts + 1;
      const newTotalScore = currentStats.totalScore + newScore;
      
      await setDoc(statsRef, {
        totalAttempts: newTotalAttempts,
        totalScore: newTotalScore,
        averageScore: newTotalScore / newTotalAttempts,
        successRate: ((newTotalScore > 0 ? 1 : 0) + currentStats.successRate * currentStats.totalAttempts) / newTotalAttempts * 100,
        lastUpdated: Timestamp.now()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error updating simulation stats:', error);
    throw error;
  }
};

// קבלת הדירוג הגבוה ביותר של משתמש בסימולציה ספציפית
export const getUserBestScore = async (userId, simulationId) => {
  try {
    const q = query(
      collection(db, USER_SIMULATIONS_COLLECTION),
      where('userId', '==', userId),
      where('simulationId', '==', simulationId),
      orderBy('score', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;
    
    return snapshot.docs[0].data().score;
  } catch (error) {
    console.error('Error getting user best score:', error);
    throw error;
  }
};
