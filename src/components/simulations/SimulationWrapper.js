import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Alert, Button } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

/**
 * SimulationWrapper - מעטפת גנרית לכל סוגי הסימולציות
 * 
 * קומפוננטה זו מקבלת כל סוג של סימולציה כילד ומטפלת בהצגת הציון
 * וקריאה לפונקציית onComplete כאשר הסימולציה מסתיימת.
 * 
 * @param {Object} props - פרמטרים של הקומפוננטה
 * @param {Function} props.onComplete - פונקציה שנקראת כאשר הסימולציה מסתיימת, מקבלת את הציון כפרמטר
 * @param {React.ReactNode} props.children - קומפוננטת הסימולציה הספציפית
 * @param {string} props.title - כותרת הסימולציה
 * @param {string} props.description - תיאור הסימולציה
 * @param {string} props.simulationType - סוג הסימולציה (אופציונלי)
 */
const SimulationWrapper = ({ onComplete, children, title, description, simulationType }) => {
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // פונקציה שנקראת כאשר הסימולציה הפנימית מסתיימת
  const handleSimulationComplete = (simulationScore) => {
    // המרת הציון לאחוזים (0-100) אם הוא לא כבר באחוזים
    const normalizedScore = typeof simulationScore === 'number' 
      ? Math.max(0, Math.min(100, simulationScore)) 
      : 85; // ציון ברירת מחדל אם לא התקבל ציון
    
    setScore(normalizedScore);
    setCompleted(true);
    setShowResults(true);
    
    // קריאה לפונקציית onComplete של הדף המארח
    if (typeof onComplete === 'function') {
      onComplete(normalizedScore);
    }
  };

  // פונקציה להשלמה מיידית של הסימולציה (לשימוש בסימולציות פשוטות)
  const completeSimulation = () => {
    handleSimulationComplete(85); // ציון ברירת מחדל
  };

  // רנדור של תוכן הסימולציה
  const renderSimulationContent = () => {
    // אם יש ילדים תקינים, נעביר להם את פונקציית ה-onComplete
    if (React.Children.count(children) > 0) {
      return React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onComplete: handleSimulationComplete });
        }
        return null;
      });
    }
    
    // אם אין ילדים או שהם לא תקינים, נציג תוכן ברירת מחדל
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" paragraph>
          {simulationType 
            ? `סימולציה מסוג ${simulationType}. לחץ על הכפתור להשלמת הסימולציה.`
            : 'לחץ על הכפתור להשלמת הסימולציה.'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={completeSimulation}
        >
          סיים סימולציה
        </Button>
      </Box>
    );
  };

  if (completed && showResults) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          תוצאות הסימולציה
        </Typography>
        
        <Box sx={{ textAlign: 'center', my: 4, p: 3, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="h1" color="success.main">
            {Math.round(score)}%
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, color: 'success.main' }}>
            כל הכבוד! השלמת את הסימולציה בהצלחה
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            הבלוק הבא נפתח עבורך!
          </Typography>
        </Box>
        
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          sx={{ mt: 2 }}
        >
          הסימולציה הושלמה בהצלחה!
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {title && <Typography variant="h5" gutterBottom>{title}</Typography>}
      {description && <Typography variant="body1" paragraph>{description}</Typography>}
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderSimulationContent()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimulationWrapper;
