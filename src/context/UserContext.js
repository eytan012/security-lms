import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';


const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [userCourses, setUserCourses] = useState([]);


  // שמור את המשתמש ב-localStorage כשהוא משתנה
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Function to fetch user data
  const fetchUserData = useCallback(async (userId, role) => {
    if (!userId || !role) return;
    
    try {
      if (role === 'student') {
        // Get student's enrollments
        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', userId));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const enrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const courseIds = enrollments.map(e => e.courseId);

        // Get enrolled courses
        let courses = [];
        if (courseIds.length > 0) {
          const coursesRef = collection(db, 'courses');
          const coursesSnap = await getDocs(coursesRef);
          courses = coursesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(course => courseIds.includes(course.id));
        }
        setUserCourses(courses);


      } else if (role === 'admin') {
        // Admins can see all courses and materials
        const coursesRef = collection(db, 'courses');
        const coursesSnap = await getDocs(coursesRef);
        const courses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserCourses(courses);


      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMaterialProgress([]);
    }
  }, []);

  // Update user-related data when user changes
  useEffect(() => {
    if (!user?.id || !user?.role) {
      setUserCourses([]);

      return;
    }

    setLoading(true);
    fetchUserData(user.id, user.role).finally(() => setLoading(false));
  }, [user?.id]); // Only depend on user ID

  const markCompleted = async (materialId) => {
    if (!user?.id || !user?.role) return false;
    try {
      const success = await markMaterialAsCompleted(user.id, materialId);
      if (success) {
        // Update progress data
        const progress = await getUserMaterialProgress(user.id);
        setMaterialProgress(progress || []);
      }
      return success;
    } catch (error) {
      console.error('Error marking material as completed:', error);
      return false;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    setLoading,
    userCourses

  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
