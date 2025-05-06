import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  IconButton
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Send as SendIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Feedback as FeedbackIcon
} from '@mui/icons-material';
import { saveRating, getUserRating, getUserRatings, getAllRatings } from '../firebase/ratingService';
import { useUser } from '../context/UserContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * קומפוננטת דירוג - מאפשרת למשתמשים לדרג את המערכת
 */
const RatingSystem = () => {
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastRatingDate, setLastRatingDate] = useState(null);
  const [userRatings, setUserRatings] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // טעינת הדירוגים של המשתמש הנוכחי (אם קיימים)
  useEffect(() => {
    const loadUserRatings = async () => {
      if (!user?.id || user?.role === 'admin') return;
      
      try {
        // טעינת כל הדירוגים של המשתמש
        const ratings = await getUserRatings(user.id);
        setUserRatings(ratings);
        
        // טעינת הדירוג האחרון לצורך הצגת התאריך
        const userRating = await getUserRating(user.id);
        if (userRating) {
          setLastRatingDate(userRating.lastRatingDate || userRating.updatedAt || userRating.createdAt);
        }
      } catch (error) {
        console.error('Error loading user ratings:', error);
      }
    };
    
    loadUserRatings();
  }, [user?.id, user?.role]);



  // שמירת דירוג
  const handleSubmitRating = async () => {
    if (!user?.id || rating === 0) return;
    
    try {
      await saveRating(user.id, rating, comment);
      
      // ניקוי הטופס אחרי שליחה מוצלחת
      setRating(0);
      setComment('');
      // עדכון תאריך המשוב האחרון לעכשיו
      setLastRatingDate(new Date());
      
      // טעינה מחדש של כל הדירוגים של המשתמש
      const updatedRatings = await getUserRatings(user.id);
      setUserRatings(updatedRatings);
      
      setSnackbar({
        open: true,
        message: 'הדירוג נשמר בהצלחה!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSnackbar({
        open: true,
        message: 'אירעה שגיאה בשמירת הדירוג',
        severity: 'error'
      });
    }
  };

  // סגירת הודעת Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  // תצוגת דירוג למשתמש רגיל
  const renderUserRating = () => (
    <Accordion elevation={3} sx={{ borderRadius: 2, mb: 3, overflow: 'hidden' }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="rating-content"
        id="rating-header"
        sx={{ 
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText',
          '&.Mui-expanded': {
            minHeight: 64,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <FeedbackIcon sx={{ mr: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold">
              דרג את המערכת
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {lastRatingDate ? 
                `משוב אחרון: ${formatDate(lastRatingDate)}` : 
                'משוב אחרון: לא נשלח משוב'}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography component="legend">הדירוג שלך:</Typography>
            
            {/* קומפוננת דירוג מותאמת אישית ל-RTL */}
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton 
                  key={star}
                  onClick={() => setRating(star)}
                  sx={{ p: 0.5 }}
                  color={rating >= star ? 'primary' : 'default'}
                >
                  {rating >= star ? 
                    <StarIcon fontSize="large" /> : 
                    <StarBorderIcon fontSize="large" />}
                </IconButton>
              ))}
            </Box>
            
            <Typography sx={{ ml: 1 }}>
              {rating > 0 ? `${rating}/5` : 'לא דורג'}
            </Typography>
          </Box>
          
          <TextField
            label="הערות (אופציונלי)"
            multiline
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="שתף את חוויתך עם המערכת..."
            dir="rtl"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSubmitRating}
              disabled={rating === 0}
            >
              שלח דירוג
            </Button>
            
            {userRatings.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'הסתר היסטוריה' : 'הצג היסטוריית משובים'}
              </Button>
            )}
          </Box>
          
          {/* היסטוריית משובים */}
          {showHistory && userRatings.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                היסטוריית המשובים שלך
              </Typography>
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {userRatings.map((item, index) => (
                  <React.Fragment key={item.id || index}>
                    {index > 0 && <Divider variant="inset" component="li" />}
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: item.rating > 3 ? 'success.main' : item.rating > 2 ? 'warning.main' : 'error.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component="div" variant="subtitle1">
                              דירוג: {item.rating}/5
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon 
                                  key={star} 
                                  fontSize="small" 
                                  color={item.rating >= star ? 'primary' : 'disabled'}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
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
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                              <Typography component="span" variant="caption" color="text.secondary">
                                נשלח: {formatDate(item.createdAt)}
                              </Typography>
                            </div>
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );



  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
        משוב והערכה
      </Typography>
      
      {renderUserRating()}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RatingSystem;
