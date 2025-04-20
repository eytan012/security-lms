import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Button,
  Box,
  List,
  Paper,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  TextField
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Language as LanguageIcon,
  EmojiEvents as AchievementIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import Layout from '../components/Layout';

function ProfilePage() {
  // הגדרת כיוון טקסט קבוע לעברית
  const isRtl = true;
  const { user, loading, updateUser } = useUser();
  const [departments, setDepartments] = useState([]);
  
  // State for progress data
  const [progressData, setProgressData] = useState({
    totalBlocks: 0,     // סך כל הלומדות
    completedBlocks: 0, // לומדות שהושלמו
    progressPercentage: 0
  });

  // State for user activities and statistics
  const [userActivities, setUserActivities] = useState({
    completedActivities: [],  // All completed activities
    quizCount: 0,            // Number of quizzes completed
    simulationCount: 0,      // Number of simulations completed
    lessonCount: 0,          // Number of lessons completed
    totalCount: 0            // Total number of activities completed
  });
  const [recentTests, setRecentTests] = useState([]);
  
  // State for additional statistics
  const [userStats, setUserStats] = useState({
    totalTimeSpent: 0,        // Total time spent in minutes
    averageScore: 0,          // Average score across all quizzes
    bestScore: 0,             // Best score achieved
    quizzesTaken: 0,          // Total number of quizzes taken
    lastActive: null,         // Last activity date
    strongestCategory: '',    // Category with best performance
    weakestCategory: ''       // Category that needs improvement
  });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const departmentsRef = collection(db, 'departments');
      const snapshot = await getDocs(departmentsRef);
      const departmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch progress data
  const fetchProgressData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get all blocks
      const blocksRef = collection(db, 'blocks');
      const blocksSnap = await getDocs(blocksRef);
      const totalBlocks = blocksSnap.size;
      
      // Get user's completed blocks
      const progressRef = collection(db, 'progress');
      const q = query(progressRef, where('userId', '==', user.id), where('completed', '==', true));
      const progressSnap = await getDocs(q);
      
      // סינון כפילויות - רק לומדה אחת לכל blockId
      const uniqueBlockIds = new Set();
      progressSnap.docs.forEach(doc => {
        const data = doc.data();
        uniqueBlockIds.add(data.blockId);
      });
      
      const completedBlocks = uniqueBlockIds.size;
      
      // Calculate percentage
      const progressPercentage = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;
      
      setProgressData({
        totalBlocks,
        completedBlocks,
        progressPercentage
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  }, [user?.id]);

  // Fetch all user activities from a single source
  const fetchUserActivities = useCallback(async () => {
    if (!user?.id) return;
    console.log('טוען את כל הפעילויות עבור המשתמש:', user.id);
    
    try {
      // Get all blocks first for reference
      const blocksRef = collection(db, 'blocks');
      const blocksSnap = await getDocs(blocksRef);
      console.log('נמצאו סך הכל לומדות במערכת:', blocksSnap.docs.length);
      const allBlocks = blocksSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() };
        return acc;
      }, {});
      
      // Get all user's completed activities from progress collection
      const progressRef = collection(db, 'progress');
      const progressQuery = query(
        progressRef, 
        where('userId', '==', user.id),
        where('completed', '==', true)
      );
      const progressSnap = await getDocs(progressQuery);
      console.log('נמצאו פעילויות שהושלמו:', progressSnap.docs.length);
      
      // Process all activities
      let quizCount = 0;
      let simulationCount = 0;
      let lessonCount = 0;
      
      // Map all completed activities with their details
      const completedActivities = progressSnap.docs
        .map(doc => {
          const progress = doc.data();
          const block = allBlocks[progress.blockId];
          if (!block) return null;
          
          // Determine activity type
          const activityType = progress.type || 'lesson';
          
          // Count by type
          if (activityType === 'quiz') {
            quizCount++;
          } else if (activityType === 'simulation') {
            simulationCount++;
          } else {
            lessonCount++;
          }
          
          return {
            id: progress.blockId,
            name: block.title || 'פעילות',
            description: block.description || 'הושלם בהצלחה',
            completedAt: progress.completedAt ? 
              (progress.completedAt.toDate ? progress.completedAt.toDate() : new Date(progress.completedAt)) : 
              new Date(),
            score: progress.score || 0,
            type: activityType
          };
        })
        .filter(activity => activity !== null)
        // Sort by completion date (newest first)
        .sort((a, b) => b.completedAt - a.completedAt);
      
      console.log('סיכום פעילויות:', {
        quizzes: quizCount,
        simulations: simulationCount,
        lessons: lessonCount,
        total: completedActivities.length
      });
      
      // Update state with all activity data
      setUserActivities({
        completedActivities,
        quizCount,
        simulationCount,
        lessonCount,
        totalCount: completedActivities.length
      });
      
      // Set recent tests (top 5 activities with scores)
      const recentWithScores = completedActivities
        .filter(activity => activity.score !== undefined)
        .slice(0, 5);
      setRecentTests(recentWithScores);
      
    } catch (error) {
      console.error('Error fetching user activities:', error);
    }
  }, [user?.id]);

  // Fetch recent completed blocks with scores
  const fetchRecentTests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get user's completed blocks with scores
      const progressRef = collection(db, 'progress');
      const q = query(
        progressRef, 
        where('userId', '==', user.id),
        where('completed', '==', true)
      );
      const progressSnap = await getDocs(q);
      const completedProgress = progressSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get block details for each completed block
      const blocksRef = collection(db, 'blocks');
      const blocksSnap = await getDocs(blocksRef);
      const blocks = blocksSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() };
        return acc;
      }, {});
      
      // Combine progress with block details
      const tests = completedProgress
        .map(progress => ({
          id: progress.id,
          title: blocks[progress.blockId]?.title || 'לומדה',
          score: progress.score !== undefined ? progress.score : '-',
          hasScore: progress.score !== undefined,
          date: progress.completedAt ? 
            (progress.completedAt.toDate ? progress.completedAt.toDate() : new Date(progress.completedAt)).toISOString().split('T')[0] : 
            ''
        }));
      
      // Sort by date (newest first) and take the 5 most recent
      const sortedTests = tests
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5);
      
      setRecentTests(sortedTests);
    } catch (error) {
      console.error('Error fetching recent tests:', error);
    }
  }, [user?.id]);

  // בדיקת הרשאות אדמין
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData);
        console.log('Is admin?', userData.role === 'admin');
        
        // הצגת הודעה למשתמש
        if (userData.role === 'admin') {
          alert('יש לך הרשאות אדמין!');
        } else {
          alert('אין לך הרשאות אדמין. תפקיד נוכחי: ' + (userData.role || 'לא מוגדר'));
        }
      } else {
        console.log('User document does not exist');
        alert('המשתמש שלך לא קיים באוסף users');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      alert('שגיאה בבדיקת הרשאות: ' + error.message);
    }
  }, [user?.id]);

  // Load data on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch user statistics and activity summary
  const fetchUserStatistics = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get quiz results for statistics
      const quizResultsRef = collection(db, 'quizResults');
      const quizResultsQuery = query(quizResultsRef, where('userId', '==', user.id));
      const quizResultsSnap = await getDocs(quizResultsQuery);
      
      // Get progress data for activity summary
      const progressRef = collection(db, 'progress');
      const progressQuery = query(progressRef, where('userId', '==', user.id), where('completed', '==', true));
      const progressSnap = await getDocs(progressQuery);
      
      // Count different activity types
      let quizCount = 0;
      let simulationCount = 0;
      let lessonCount = 0;
      
      // Process progress data to count activity types
      progressSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.type === 'quiz') {
          quizCount++;
        } else if (data.type === 'simulation') {
          simulationCount++;
        } else {
          lessonCount++;
        }
      });
      
      // Log activity counts for debugging
      console.log('Activity counts in statistics:', {
        quizzes: quizCount,
        simulations: simulationCount,
        lessons: lessonCount,
        total: progressSnap.docs.length
      });
      
      // Calculate statistics
      let totalTimeSpent = 0;
      let totalScore = 0;
      let bestScore = 0;
      let quizzesTaken = 0;
      let lastActive = null;
      
      // Category performance tracking
      const categoryPerformance = {};
      
      quizResultsSnap.docs.forEach(doc => {
        const data = doc.data();
        
        // Time spent
        if (data.timeSpent) {
          totalTimeSpent += data.timeSpent;
        }
        
        // Quiz scores
        if (data.score !== undefined) {
          totalScore += data.score;
          quizzesTaken++;
          
          if (data.score > bestScore) {
            bestScore = data.score;
          }
        }
        
        // Last activity
        const completedAt = data.completedAt ? 
          (data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt)) : 
          null;
          
        if (completedAt && (!lastActive || completedAt > lastActive)) {
          lastActive = completedAt;
        }
        
        // Category performance
        if (data.category && data.score !== undefined) {
          if (!categoryPerformance[data.category]) {
            categoryPerformance[data.category] = {
              totalScore: 0,
              count: 0,
              avgScore: 0
            };
          }
          
          categoryPerformance[data.category].totalScore += data.score;
          categoryPerformance[data.category].count++;
          categoryPerformance[data.category].avgScore = 
            categoryPerformance[data.category].totalScore / categoryPerformance[data.category].count;
        }
      });
      
      // Calculate average score
      const averageScore = quizzesTaken > 0 ? Math.round(totalScore / quizzesTaken) : 0;
      
      // Find strongest and weakest categories
      let strongestCategory = '';
      let weakestCategory = '';
      let highestAvg = 0;
      let lowestAvg = 100;
      
      Object.entries(categoryPerformance).forEach(([category, data]) => {
        const avgScore = data.avgScore;
        
        if (avgScore > highestAvg) {
          highestAvg = avgScore;
          strongestCategory = category;
        }
        
        if (avgScore < lowestAvg && data.count > 0) {
          lowestAvg = avgScore;
          weakestCategory = category;
        }
      });
      
      // Update user stats
      setUserStats({
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
        averageScore,
        bestScore: Math.round(bestScore),
        quizzesTaken,
        lastActive,
        strongestCategory,
        weakestCategory
      });
      
      console.log('User statistics updated:', { 
        totalTimeSpent: Math.round(totalTimeSpent / 60),
        averageScore,
        bestScore,
        quizzesTaken,
        lastActive,
        strongestCategory,
        weakestCategory
      });
      
    } catch (error) {
      console.error('Error fetching user statistics:', error);
    }
  }, [user?.id]);

  // Fetch all data when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('מתחיל לטעון נתונים עבור המשתמש:', user.id);
      fetchProgressData();
      fetchUserActivities(); // Single function to fetch all activity data
      fetchUserStatistics();
    }
  }, [user?.id, fetchProgressData, fetchUserActivities, fetchUserStatistics]);

  return (
    <Layout>
      <Container>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  פרופיל
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Personal Information */}
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 }}>
                  פרטים אישיים
                </Typography>
                <List>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary="שם" 
                          secondary={user?.name} 
                          sx={{  }}
                        />
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                      </>
                    ) : (
                      <>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="שם" 
                          secondary={user?.name} 
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary="דוא״ל" 
                          secondary={user?.email} 
                          sx={{ }}
                        />
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                      </>
                    ) : (
                      <>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="דוא״ל" 
                          secondary={user?.email} 
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary="מחלקה" 
                          secondary={departments.find(d => d.id === user?.department)?.name || 'טוען...'} 
                          sx={{  }}
                        />
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                      </>
                    ) : (
                      <>
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="מחלקה" 
                          secondary={departments.find(d => d.id === user?.department)?.name || 'טוען...'} 
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary="פעילות אחרונה" 
                          secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'טוען...'} 
                          sx={{ }}
                        />
                        <ListItemIcon>
                          <AccessTimeIcon />
                        </ListItemIcon>
                      </>
                    ) : (
                      <>
                        <ListItemIcon>
                          <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="פעילות אחרונה" 
                          secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'טוען...'} 
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary="שפה" 
                          secondary="עברית"
                          sx={{}}
                        />
                        <ListItemIcon>
                          <LanguageIcon />
                        </ListItemIcon>
                      </>
                    ) : (
                      <>
                        <ListItemIcon>
                          <LanguageIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="שפה" 
                          secondary="עברית"
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                </List>

                {/* Achievements and Recent Exams */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.light', pb: 1, mt: 2 }}>
                    סטטיסטיקות מפורטות
                  </Typography>
                  
                  {/* User Performance Statistics */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', border: '1px solid', borderColor: 'info.light' }}>
                        <Typography variant="subtitle2" color="info.main" gutterBottom>
                          זמן למידה כולל
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                          {userStats.totalTimeSpent} דקות
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', border: '1px solid', borderColor: 'success.light' }}>
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                          ציון ממוצע
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                          {userStats.averageScore}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', border: '1px solid', borderColor: 'warning.light' }}>
                        <Typography variant="subtitle2" color="warning.main" gutterBottom>
                          ציון הטוב ביותר
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                          {userStats.bestScore}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2, bgcolor: 'rgba(156, 39, 176, 0.05)', border: '1px solid', borderColor: 'secondary.light' }}>
                        <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                          מבחנים שבוצעו
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.dark' }}>
                          {userStats.quizzesTaken}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.light', pb: 1, mt: 2 }}>
                    היסטוריית למידה
                  </Typography>
                  
                  {/* Activity Summary */}
                  <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'info.main', fontWeight: 'bold' }}>
                      סיכום פעילויות
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                          <Typography variant="body2" color="text.secondary">מבחנים</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {userActivities.quizCount}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                          <Typography variant="body2" color="text.secondary">סימולציות</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                            {userActivities.simulationCount}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                          <Typography variant="body2" color="text.secondary">לומדות</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {userActivities.lessonCount}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
                      סך הכל {userActivities.totalCount} פעילויות הושלמו
                    </Typography>
                  </Paper>

                  {/* Completed Activities */}
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold', color: 'success.dark' }}>
                    פעילויות שהושלמו
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                    {userActivities.completedActivities.length > 0 ? (
                      userActivities.completedActivities.map(activity => (
                        <Chip
                          key={activity.id}
                          sx={{ 
                            margin: 1, 
                            borderRadius: '8px',
                            transition: 'all 0.3s',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: 2
                            }
                          }}
                          icon={<AchievementIcon />}
                          label={activity.name}
                          color={activity.type === 'quiz' ? 'primary' : activity.type === 'simulation' ? 'secondary' : 'success'}
                          variant="outlined"
                          title={`${activity.description || 'פעילות'} | סוג: ${activity.type === 'quiz' ? 'מבחן' : activity.type === 'simulation' ? 'סימולציה' : 'לומדה'} | ציון: ${activity.score}`}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        אין פעילות להצגה
                      </Typography>
                    )}
                  </Box>

                  {/* Recent Completed Blocks with Scores */}
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 'bold', color: 'info.dark' }}>
                    תוצאות מבחנים אחרונים
                  </Typography>
                  <List>
                    {recentTests.length > 0 ? (
                      recentTests.map(test => (
                        <ListItem key={test.id}>
                          <ListItemText
                            primary={test.title}
                            secondary={
                              <Typography variant="body2" component="span">
                                {test.hasScore ? `ציון: ${test.score}%` : 'הושלם ללא ציון'} | {test.date ? new Date(test.date).toLocaleDateString('he-IL') : 'לא זמין'}
                              </Typography>
                            }
                            sx={{  ml: 'auto' }}
                          />
                          <ListItemIcon>
                            {test.hasScore ? (
                              <GradeIcon sx={{ 
                                color: test.score >= 90 ? '#4caf50' : 
                                       test.score >= 70 ? '#2196f3' : 
                                       '#ff9800' 
                              }} />
                            ) : (
                              <AchievementIcon sx={{ color: '#4caf50', direction: 'right' }} />
                            )}
                          </ListItemIcon>
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        אין פעילות להצגה
                      </Typography>
                    )}
                  </List>
                </Box>


              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}

export default ProfilePage;
