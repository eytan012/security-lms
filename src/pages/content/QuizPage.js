import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  LinearProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '../../context/UserContext';
import Layout from '../../components/Layout';

function QuizPage() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const blockDoc = await getDoc(doc(db, 'blocks', blockId));
        if (blockDoc.exists()) {
          const blockData = blockDoc.data();
          const questionsWithIds = (blockData.questions || []).map((q, idx) => {
            // הוספת מזהה לשאלה
            const questionId = `quiz-${blockDoc.id}-${idx}`;
            // הוספת מזההים לאפשרויות
            const optionsWithIds = (q.options || []).map((opt, optIdx) => ({
              text: opt,
              id: `${questionId}-opt-${optIdx}`,
              value: optIdx
            }));
            
            return {
              ...q,
              id: questionId,
              options: optionsWithIds
            };
          });
          
          setBlock({
            id: blockDoc.id,
            ...blockData,
            questions: questionsWithIds
          });
          // Initialize answers object
          const initialAnswers = {};
          questionsWithIds.forEach(question => {
            initialAnswers[question.id] = null;
          });
          setAnswers(initialAnswers);
        } else {
          setError('בלוק הלמידה לא נמצא');
        }
      } catch (err) {
        setError('שגיאה בטעינת בלוק הלמידה');
        console.error('Error fetching block:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlock();
  }, [blockId]);

  const handleAnswerChange = (event) => {
    const currentQuestionId = block.questions[currentQuestion].id;
    setAnswers({
      ...answers,
      [currentQuestionId]: parseInt(event.target.value)
    });
  };

  const handleNext = () => {
    setCurrentQuestion(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestion(prev => prev - 1);
  };

  const calculateScore = () => {
    let correct = 0;
    block.questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / block.questions.length) * 100;
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    try {
      // Add completion record
      const progressRef = collection(db, 'progress');
      const newProgress = {
        userId: user.id,
        blockId,
        completed: finalScore >= 70, // Only mark as completed if score is 70% or higher
        completedAt: Timestamp.now(),
        type: 'quiz',
        score: finalScore
      };

      await addDoc(progressRef, newProgress);
      console.log('Saved quiz progress:', newProgress);

      // Force parent page to refresh
      window.dispatchEvent(new Event('focus'));
    } catch (error) {
      console.error('Error saving quiz results:', error);
      setError('שגיאה בשמירת התוצאות');
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <LinearProgress />
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!block?.questions) {
    return (
      <Layout>
        <Container>
          <Alert severity="error">לא נמצאו שאלות בבוחן זה</Alert>
        </Container>
      </Layout>
    );
  }

  if (showResults) {
    return (
      <Layout>
        <Container>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/blocks')}
              >
                חזרה לבלוקי למידה
              </Button>
              {score < 70 && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    setShowResults(false);
                    setAnswers({});
                    setCurrentQuestion(0);
                    setScore(null);
                    setRetryCount(prev => prev + 1);
                  }}
                  startIcon={<RestartAltIcon />}
                >
                  נסה שוב
                </Button>
              )}
            </Box>

            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom align="center">
                  תוצאות הבוחן
                </Typography>

                <Box sx={{ textAlign: 'center', my: 4, p: 3, bgcolor: score >= 70 ? 'success.light' : 'error.light', borderRadius: 2 }}>
                  <Typography variant="h1" color={score >= 70 ? 'success.main' : 'error.main'}>
                    {Math.round(score)}%
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, color: score >= 70 ? 'success.main' : 'error.main' }}>
                    {score >= 70 ? 'כל הכבוד! עברת את הבוחן בהצלחה' : 'טרם השגת את הציון הנדרש'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    {score >= 70 ? (
                      <>
                        הבלוק הבא נפתח עבורך!
                        {retryCount > 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            (הצלחת לאחר {retryCount} נסיונות)
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        נדרש ציון של 70% לפחות כדי להשלים את הבוחן.
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          זהו נסיון מספר {retryCount + 1}. באפשרותך לנסות שוב.
                        </Typography>
                      </>
                    )}
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      סיכום ביצועים:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="h6" color="primary">
                          {block.questions.filter(question => answers[question.id] === question.correctAnswer).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          תשובות נכונות
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="h6" color="error">
                          {block.questions.filter(question => answers[question.id] !== question.correctAnswer).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          תשובות שגויות
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 4 }}>
                  {block.questions.map((question, index) => (
                    <Paper key={`result-${question.id}`} sx={{ p: 3, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        שאלה {index + 1}: {question.text}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body1"
                          color={answers[index] === question.correctAnswer ? 'success.main' : 'error.main'}
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          {answers[question.id] === question.correctAnswer ? 
                            <CheckCircleIcon sx={{ mr: 1 }} /> : 
                            <ErrorIcon sx={{ mr: 1 }} />
                          }
                          תשובתך: {question.options.find(opt => opt.value === answers[question.id])?.text || 'לא נבחרה תשובה'}
                        </Typography>
                        {answers[question.id] !== question.correctAnswer && (
                          <Typography color="success.main" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                            <CheckCircleIcon sx={{ mr: 1 }} />
                            התשובה הנכונה: {question.options.find(opt => opt.value === question.correctAnswer)?.text}
                          </Typography>
                        )}
                        {question.explanation && (
                          <Paper sx={{ mt: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <InfoIcon sx={{ mr: 1 }} />
                              הסבר: {question.explanation}
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/blocks')}
            sx={{ mb: 2 }}
          >
            חזרה לבלוקי למידה
          </Button>

          <Typography variant="h4" gutterBottom>
            {block.title}
          </Typography>

          <Stepper activeStep={currentQuestion} sx={{ mb: 4 }}>
            {block.questions.map((question, index) => (
              <Step key={`step-${question.id}`}>
                <StepLabel>{`שאלה ${index + 1}`}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                שאלה {currentQuestion + 1} מתוך {block.questions.length}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {block.questions[currentQuestion].text}
              </Typography>

              <FormControl component="fieldset">
                <RadioGroup
                  value={answers[block.questions[currentQuestion].id] === null ? '' : answers[block.questions[currentQuestion].id]}
                  onChange={handleAnswerChange}
                >
                  {block.questions[currentQuestion].options.map((option, index) => (
                    <FormControlLabel
                      key={`option-${option.id}`}
                      value={option.value}
                      control={<Radio />}
                      label={option.text}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              startIcon={<PrevIcon />}
            >
              הקודם
            </Button>
            
            {currentQuestion === block.questions.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setConfirmSubmit(true)}
                disabled={block.questions.some(q => answers[q.id] === null)}
                endIcon={<CheckCircleIcon />}
              >
                סיים בוחן
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={answers[block.questions[currentQuestion].id] === null}
                endIcon={<NextIcon />}
              >
                הבא
              </Button>
            )}
          </Box>
        </Box>

        <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
          <DialogTitle>האם להגיש את הבוחן?</DialogTitle>
          <DialogContent>
            <Typography paragraph>
              לאחר ההגשה לא תוכל לשנות את תשובותיך. האם אתה בטוח שברצונך להמשיך?
            </Typography>
            <Typography variant="body2" color="info.main" sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} />
              נדרש ציון של 70% לפחות כדי להשלים את הבוחן ולפתוח את הבלוק הבא
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmSubmit(false)}>
              חזור לבוחן
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
            >
              הגש בוחן
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}

export default QuizPage;
