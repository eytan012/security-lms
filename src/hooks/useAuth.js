import { useUser } from '../context/UserContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export function useAuth() {
  const { setUser, setLoading } = useUser();

  const login = async (personalCode) => {
    if (!personalCode?.trim()) {
      throw new Error('נא להזין קוד אישי');
    }

    setLoading(true);
    try {
      // Find user with matching personal code
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('personalCode', '==', personalCode.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`קוד אישי ${personalCode} לא נמצא`);
      }

      const userDoc = querySnapshot.docs[0];
      const userData = {
        id: userDoc.id,
        ...userDoc.data(),
        lastLoginAt: new Date().toISOString()
      };

      // Update last login time in Firestore
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLoginAt: userData.lastLoginAt
      });

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return { login, logout };
}
