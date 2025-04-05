import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
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
  Edit as EditIcon,
  EmojiEvents as AchievementIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import Layout from '../components/Layout';

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { direction, isRtl } = useLanguage();
  const { user, loading, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || ''
  });
  
  // State for progress data
  const [progressData, setProgressData] = useState({
    totalBlocks: 0,
    completedBlocks: 0,
    progressPercentage: 0
  });

  // State for achievements and tests
  const [achievements, setAchievements] = useState([]);
  const [recentTests, setRecentTests] = useState([]);

  // עדכון הטופס כשהמשתמש משתנה
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        department: user.department || ''
      });
    }
  }, [user]);



  // Language is now handled by the LanguageContext

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return;
      
      await updateUser(user.id, {
        name: formData.name,
        department: formData.department
      });
      
      setEditError(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setEditError(t('errors.general'));
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

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
      
      // סינון כפילויות - רק בלוק אחד לכל blockId
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

  // Fetch completed blocks
  const fetchCompletedBlocks = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get all blocks first
      const blocksRef = collection(db, 'blocks');
      const blocksSnap = await getDocs(blocksRef);
      const allBlocks = blocksSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() };
        return acc;
      }, {});
      
      // Get user's completed blocks
      const progressRef = collection(db, 'progress');
      const progressSnap = await getDocs(query(
        progressRef, 
        where('userId', '==', user.id),
        where('completed', '==', true)
      ));
      
      // Map completed blocks with their details
      const completedBlocks = progressSnap.docs
        .map(doc => {
          const progress = doc.data();
          const block = allBlocks[progress.blockId];
          if (!block) return null;
          
          return {
            id: progress.blockId,
            name: block.title || 'בלוק לימוד',
            description: block.description || 'הושלם בהצלחה',
            completedAt: progress.completedAt ? 
              (progress.completedAt.toDate ? progress.completedAt.toDate() : new Date(progress.completedAt)) : 
              new Date(),
            score: progress.score || 0
          };
        })
        .filter(block => block !== null)
        // Sort by completion date (newest first)
        .sort((a, b) => b.completedAt - a.completedAt);
      
      setAchievements(completedBlocks);
    } catch (error) {
      console.error('Error fetching completed blocks:', error);
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



  // Fetch all data when user changes
  useEffect(() => {
    if (user?.id) {
      fetchProgressData();
      fetchCompletedBlocks();
      fetchRecentTests();
    }
  }, [user?.id, fetchProgressData, fetchCompletedBlocks, fetchRecentTests]);

  return (
    <Layout>
      <Container>
        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="sm" fullWidth>
          <DialogTitle>עריכת פרופיל</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="שם"
                value={formData.name}
                onChange={handleInputChange('name')}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <Select
                  value={formData.department}
                  onChange={handleInputChange('department')}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>לא משויך</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditing(false)}>ביטול</Button>
            <Button onClick={handleSaveProfile} variant="contained" color="primary">שמור</Button>
          </DialogActions>
        </Dialog>

        <Grid container justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h4" gutterBottom>
                  {t('profile.title')}
                  </Typography>
                  <IconButton onClick={handleEditProfile} size="large">
                    <EditIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Personal Information */}
                <Typography variant="h6" gutterBottom>
                  {t('profile.title')}
                </Typography>
                <List>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary={t('profile.welcome')} 
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
                          primary={t('profile.welcome')} 
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
                          primary={t('auth.email')} 
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
                          primary={t('auth.email')} 
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
                          primary={t('admin.title')} 
                          secondary={departments.find(d => d.id === user?.department)?.name || t('common.loading')} 
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
                          primary={t('admin.title')} 
                          secondary={departments.find(d => d.id === user?.department)?.name || t('common.loading')} 
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary={t('profile.lastActivity')} 
                          secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : t('common.loading')} 
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
                          primary={t('profile.lastActivity')} 
                          secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : t('common.loading')} 
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                  <ListItem sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    {isRtl ? (
                      <>
                        <ListItemText 
                          primary={t('profile.language')} 
                          secondary={
                            i18n.language === 'he' ? 'עברית' :
                            i18n.language === 'en' ? 'English' :
                            i18n.language === 'ar' ? 'العربية' :
                            i18n.language
                          }
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
                          primary={t('profile.language')} 
                          secondary={
                            i18n.language === 'he' ? 'עברית' :
                            i18n.language === 'en' ? 'English' :
                            i18n.language === 'ar' ? 'العربية' :
                            i18n.language
                          }
                          sx={{ textAlign: 'left' }}
                        />
                      </>
                    )}
                  </ListItem>
                </List>

                {editError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {editError}
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Progress Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    התקדמות כללית
                  </Typography>
                  <Button
                    onClick={checkAdminStatus}
                    color="primary"
                    variant="outlined"
                    size="small"
                  >
                    בדוק הרשאות אדמין
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant={loading ? "indeterminate" : "determinate"}
                      value={progressData.progressPercentage}
                      sx={{ height: 10, borderRadius: 5, opacity: loading ? 0.7 : 1 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ opacity: loading ? 0.7 : 1 }}
                    >
                      {Math.round(progressData.progressPercentage)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ opacity: loading ? 0.7 : 1 }}
                >
                  {progressData.completedBlocks} {t('profile.completedBlocks')} {progressData.totalBlocks} {t('profile.totalBlocks')}
                </Typography>



                {/* Achievements and Recent Exams */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('statistics.title')}
                  </Typography>

                  {/* Completed Blocks */}
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                    {t('learning.status.completed')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                    {achievements.length > 0 ? (
                      achievements.map(block => (
                        <Chip
                          key={block.id}
                          sx={{ margin: 1 }}
                          icon={<AchievementIcon />}
                          label={block.name}
                          color="success"
                          variant="outlined"
                          title={`${block.description} | ציון: ${block.score}`}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('profile.noActivity')}
                      </Typography>
                    )}
                  </Box>

                  {/* Recent Completed Blocks with Scores */}
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 3 }}>
                    {t('statistics.quizResults')}
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
                        {t('profile.noActivity')}
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
