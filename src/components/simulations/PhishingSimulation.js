import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Flag as FlagIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { saveSimulationResult, getUserBestScore } from '../../firebase/simulationService';

const PhishingSimulation = ({ scenario, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(scenario.time_limit);
  const [isActive, setIsActive] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { user, updateUserProgress } = useUser();

  // טיימר יורד
  useEffect(() => {
    if (!isActive || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // חישוב הניקוד הסופי
  const calculateScore = (action) => {
    let points = 0;
    
    // ניקוד בסיס לפעולה
    const actionConfig = [...scenario.content.correct_actions, ...scenario.content.wrong_actions]
      .find(a => a.action === action);
    
    if (actionConfig) {
      points += actionConfig.points || actionConfig.penalty || 0;
    }

    // בונוס על זמן תגובה מהיר
    const timeBonus = Math.floor((timeLeft / scenario.time_limit) * 50);
    points += timeBonus;

    return points;
  };

  // טיפול בפעולות המשתמש
  const handleAction = async (action) => {
    setIsActive(false);
    const actionScore = calculateScore(action);
    setScore(actionScore);

    const actionConfig = [...scenario.content.correct_actions, ...scenario.content.wrong_actions]
      .find(a => a.action === action);
    
    setFeedback(actionConfig?.feedback || '');
    setShowFeedback(true);

    // חישוב הזמן שלקח למשתמש
    const timeSpent = scenario.time_limit - timeLeft;

    try {
      // שמירת התוצאה בפיירבייס
      await saveSimulationResult(user.uid, {
        simulationId: scenario.id,
        blockId: scenario.blockId,
        score: actionScore,
        action: action,
        timeSpent,
        completedAt: new Date()
      });

      // עדכון התקדמות המשתמש במערכת
      updateUserProgress({
        simulationId: scenario.id,
        score: actionScore,
        completedAt: new Date(),
        action: action
      });
    } catch (error) {
      console.error('Error saving simulation result:', error);
      setFeedback('אירעה שגיאה בשמירת התוצאה. אנא נסה שוב.');
    }
  };

  // טיפול בסיום הזמן
  const handleTimeout = () => {
    setScore(0);
    setFeedback('נגמר הזמן! חשוב לזהות הודעות פישינג במהירות.');
    setShowFeedback(true);
  };

  // הצגת URL בריחוף מעל לינק
  const handleHover = (event) => {
    // בסימולציה אמיתית, כאן נציג את ה-URL המזויף
    const tooltip = document.createElement('div');
    tooltip.textContent = 'http://malicious-site.com/microsoft365';
    // הצגת הטולטיפ ליד הסמן
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* טיימר */}
      <LinearProgress 
        variant="determinate" 
        value={(timeLeft / scenario.time_limit) * 100} 
        sx={{ mb: 2 }}
      />
      
      {/* תצוגת האימייל */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            מאת: {scenario.content.sender.name} &lt;{scenario.content.sender.email}&gt;
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {scenario.content.subject}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
            {scenario.content.body}
          </Typography>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <Tooltip title="דווח כפישינג">
              <IconButton 
                onClick={() => handleAction('report_phishing')}
                disabled={!isActive}
              >
                <FlagIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="מחק">
              <IconButton 
                onClick={() => handleAction('delete_email')}
                disabled={!isActive}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => handleAction('click_link')}
            disabled={!isActive}
            onMouseOver={handleHover}
          >
            הגדל נפח אחסון עכשיו
          </Button>
        </CardActions>
      </Card>

      {/* דיאלוג משוב */}
      <Dialog open={showFeedback} onClose={() => onComplete(score)}>
        <DialogTitle>
          {score >= 0 ? 'כל הכבוד!' : 'אופס...'}
        </DialogTitle>
        <DialogContent>
          <Typography>{feedback}</Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            ניקוד: {score}
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            סימנים מחשידים שהיית צריך לשים לב אליהם:
          </Typography>
          <ul>
            {scenario.content.suspicious_elements.map((element, index) => (
              <li key={index}>
                <Typography>
                  {element.detail} ({element.points} נקודות)
                </Typography>
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onComplete(score)}>המשך</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhishingSimulation;
