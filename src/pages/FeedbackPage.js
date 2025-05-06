import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Feedback as FeedbackIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getAllRatings } from '../firebase/ratingService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Layout from '../components/Layout';

/**
 * דף משובים - מציג את כל המשובים שהתקבלו מהמשתמשים (למנהלים בלבד)
 */
const FeedbackPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [allRatings, setAllRatings] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingStats, setRatingStats] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  });

  // וידוא שרק מנהלים יכולים לגשת לדף זה
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/blocks');
    }
  }, [user, navigate]);

  // טעינת כל המשובים
  useEffect(() => {
    const loadAllRatings = async () => {
      if (!user?.id || user.role !== 'admin') return;
      
      setLoading(true);
      setError(null);
      
      try {
        // טעינת כל המשובים
        const ratings = await getAllRatings();
        setAllRatings(ratings);
        
        // חישוב דירוג ממוצע
        if (ratings.length > 0) {
          const sum = ratings.reduce((total, r) => total + r.rating, 0);
          setAverageRating(sum / ratings.length);
          
          // חישוב סטטיסטיקות דירוג
          const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratings.forEach(r => {
            if (stats[r.rating] !== undefined) {
              stats[r.rating]++;
            }
          });
          setRatingStats(stats);
        }
        
        // טעינת פרטי המשתמשים
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = {};
        
        // טעינת נתוני המחלקות
        const departmentsRef = collection(db, 'departments');
        const departmentsSnapshot = await getDocs(departmentsRef);
        const departmentsData = {};
        
        // יצירת מיפוי של ID לשם המחלקה
        departmentsSnapshot.docs.forEach(doc => {
          const deptData = doc.data();
          departmentsData[doc.id] = deptData.name || 'מחלקה לא ידועה';
        });
        
        setDepartmentsMap(departmentsData);
        console.log('Departments map:', departmentsData);
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          console.log('User data for', doc.id, ':', userData); // לוג לבדיקת הנתונים
          usersData[doc.id] = {
            name: userData.displayName || userData.name || 'משתמש',
            departmentId: userData.department || userData.unit || '', // שמירת ה-ID של המחלקה
            email: userData.email || '',
            employeeId: userData.employeeId || userData.personalCode || ''
          };
        });
        
        setUserMap(usersData);
      } catch (error) {
        console.error('Error loading ratings:', error);
        setError('אירעה שגיאה בטעינת המשובים. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllRatings();
  }, [user?.id, user?.role]);

  // פורמט תאריך
  const formatDate = (timestamp) => {
    if (!timestamp) return 'לא זמין';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // חישוב אחוז הדירוגים מסוג מסוים
  const calculatePercentage = (ratingValue) => {
    if (allRatings.length === 0) return 0;
    return (ratingStats[ratingValue] / allRatings.length) * 100;
  };

  // רכיב להצגת דירוג כוכבים
  const StarRating = ({ rating, size = 'medium' }) => (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box 
          key={star} 
          sx={{ 
            color: rating >= star ? 'secondary.main' : 'text.disabled',
            mx: size === 'small' ? 0.1 : 0.2
          }}
        >
          {rating >= star ? 
            <StarIcon fontSize={size} /> : 
            <StarBorderIcon fontSize={size} />}
        </Box>
      ))}
    </Box>
  );

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            <FeedbackIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            ניהול משובים
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            צפייה וניתוח המשובים שהתקבלו מהמשתמשים במערכת
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <>
            {/* סיכום דירוגים */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      סיכום דירוגים
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        דירוג ממוצע:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarRating rating={averageRating} />
                        <Typography variant="h5" sx={{ ml: 1, fontWeight: 'bold' }}>
                          {averageRating.toFixed(1)}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${allRatings.length} משובים`} 
                        color="primary" 
                        sx={{ ml: 'auto' }} 
                      />
                    </Box>
                    
                    {/* התפלגות דירוגים */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      התפלגות דירוגים:
                    </Typography>
                    
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: 50 }}>
                          <StarIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ ml: 0.5 }}>
                            {rating}
                          </Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, mx: 1 }}>
                          <Box
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: 'grey.300',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${calculatePercentage(rating)}%`,
                                bgcolor: rating > 3 ? 'success.main' : rating > 2 ? 'warning.main' : 'error.main',
                                transition: 'width 1s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                          {ratingStats[rating]} ({calculatePercentage(rating).toFixed(1)}%)
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      סטטיסטיקות משובים
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          סך הכל משובים
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {allRatings.length}
                        </Typography>
                      </Paper>
                      
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          משובים חיוביים (4-5 כוכבים)
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {ratingStats[4] + ratingStats[5]}
                          <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                            ({((ratingStats[4] + ratingStats[5]) / allRatings.length * 100).toFixed(1)}%)
                          </Typography>
                        </Typography>
                      </Paper>
                      
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          משובים שליליים (1-2 כוכבים)
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="error.main">
                          {ratingStats[1] + ratingStats[2]}
                          <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                            ({((ratingStats[1] + ratingStats[2]) / allRatings.length * 100).toFixed(1)}%)
                          </Typography>
                        </Typography>
                      </Paper>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* רשימת משובים */}
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  <FeedbackIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  רשימת משובים
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {allRatings.length > 0 ? (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {allRatings.map((item) => {
                      // לוג לבדיקת ה-userId והנתונים המתאימים
                      console.log('Rating item userId:', item.userId);
                      console.log('User data from map:', userMap[item.userId]);
                      
                      const user = userMap[item.userId] || { 
                        name: 'משתמש', 
                        departmentId: '',
                        email: '',
                        employeeId: ''
                      };
                      
                      // קבלת שם המחלקה מהמיפוי
                      const departmentName = user.departmentId ? departmentsMap[user.departmentId] || 'מחלקה לא ידועה' : 'לא צוין';
                      
                      const userData = {
                        ...user,
                        department: departmentName
                      };
                      
                      return (
                        <ListItem
                          key={item.id}
                          alignItems="flex-start"
                          sx={{ 
                            mb: 2, 
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: item.rating > 3 ? 'success.main' : item.rating > 2 ? 'warning.main' : 'error.main' }}>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography component="span" variant="subtitle1" fontWeight="bold">
                                    {userData.name}
                                  </Typography>
                                  <Typography component="span" variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'normal' }}>
                                    {userData.department && userData.department !== 'undefined' ? `(${userData.department})` : ''}
                                  </Typography>
                                </Box>
                                {userData.employeeId && (
                                  <Chip 
                                    label={`מס' עובד: ${userData.employeeId}`} 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ fontSize: '0.7rem' }} 
                                  />
                                )}
                                {userData.email && (
                                  <Chip 
                                    label={userData.email} 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ fontSize: '0.7rem' }} 
                                  />
                                )}
                                <Box sx={{ display: 'flex', flexDirection: 'row', ml: 'auto' }}>
                                  <StarRating rating={item.rating} size="small" />
                                </Box>
                              </Box>
                            }
                            // שינוי המבנה כדי להימנע משגיאת הידרציה
                            secondary={
                              <Typography component="div" variant="body2">
                                {item.comment ? (
                                  <Typography
                                    component="div"
                                    variant="body2"
                                    color="text.primary"
                                    sx={{ mt: 1, mb: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}
                                  >
                                    "{item.comment}"
                                  </Typography>
                                ) : (
                                  <Typography
                                    component="div"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1, mb: 1, fontStyle: 'italic' }}
                                  >
                                    לא הוזנה הערה
                                  </Typography>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    נשלח: {formatDate(item.createdAt)}
                                  </Typography>
                                  {item.updatedAt && item.updatedAt !== item.createdAt && (
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      עודכן: {formatDate(item.updatedAt)}
                                    </Typography>
                                  )}
                                </div>
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      אין משובים להצגה
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Layout>
  );
};

export default FeedbackPage;
