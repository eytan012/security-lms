import { useState, useEffect, useMemo } from 'react';
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
import { doc, getDoc, collection, addDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '../../context/UserContext';
import Layout from '../../components/Layout';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

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
  const [isRtl, setIsRtl] = useState(true); // ברירת מחדל: עברית (RTL)
  
  // יצירת קונפיגורציית קאש לפי כיוון הטקסט
  const cacheRtl = useMemo(() => createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  }), []);
  
  const cacheLtr = useMemo(() => createCache({
    key: 'muiltr',
    stylisPlugins: [prefixer],
  }), []);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const blockDoc = await getDoc(doc(db, 'blocks', blockId));
        if (blockDoc.exists()) {
          console.log('Block found:', blockDoc.data());
          const blockData = blockDoc.data();
          const questionsWithIds = (blockData.questions || []).map((q, idx) => {
            // בדיקה אם השאלה כבר מכילה מזהה
            const questionId = q.id || `quiz-${blockDoc.id}-${idx}`;
            
            // בדיקה אם האפשרויות כבר מכילות מזהים
            let processedOptions;
            if (Array.isArray(q.options)) {
              // בדיקה אם האפשרויות הן כבר אובייקטים
              if (q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null) {
                // האפשרויות כבר בפורמט הנכון
                processedOptions = q.options.map((opt, optIdx) => ({
                  text: opt.text || `אפשרות ${optIdx + 1}`,
                  id: opt.id || `${questionId}-opt-${optIdx}`,
                  value: opt.value !== undefined ? opt.value : optIdx
                }));
              } else {
                // האפשרויות הן מחרוזות פשוטות
                processedOptions = q.options.map((opt, optIdx) => ({
                  text: opt,
                  id: `${questionId}-opt-${optIdx}`,
                  value: optIdx
                }));
              }
            } else {
              // אם אין אפשרויות, ניצור מערך ריק
              processedOptions = [];
            }
            
            return {
              ...q,
              id: questionId,
              options: processedOptions
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
      [currentQuestionId]: Number(event.target.value)
    });
  };

  const handleNext = () => {
    setCurrentQuestion(currentQuestion + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestion(currentQuestion - 1);
  };

  const calculateScore = () => {
    const totalQuestions = block.questions.length;
    const correctAnswers = block.questions.filter(
      question => answers[question.id] === question.correctAnswer
    ).length;
    
    return (correctAnswers / totalQuestions) * 100;
  };

  const handleSubmit = async () => {
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    setShowResults(true);
    setConfirmSubmit(false);
    
    try {
      // בדיקה אם יש כבר תוצאה קיימת למשתמש זה בבלוק זה
      const quizResultsRef = collection(db, 'quizResults');
      const existingResultsQuery = query(
        quizResultsRef,
        where('userId', '==', user.uid),
        where('blockId', '==', blockId)
      );
      const existingResultsSnapshot = await getDocs(existingResultsQuery);
      
      const quizResultData = {
        userId: user.uid,
        blockId: blockId,
        score: calculatedScore,
        answers: answers,
        completedAt: Timestamp.now(),
        passed: calculatedScore >= 70
      };
      
      if (!existingResultsSnapshot.empty) {
        // עדכון תוצאה קיימת
        const existingResultDoc = existingResultsSnapshot.docs[0];
        await updateDoc(doc(db, 'quizResults', existingResultDoc.id), quizResultData);
      } else {
        // יצירת תוצאה חדשה
        await addDoc(quizResultsRef, quizResultData);
      }
      
      // עדכון סטטוס השלמה של הבלוק עבור המשתמש
      if (calculatedScore >= 70) {
        const userProgressRef = doc(db, 'userProgress', user.uid);
        const userProgressDoc = await getDoc(userProgressRef);
        
        if (userProgressDoc.exists()) {
          const completedBlocks = userProgressDoc.data().completedBlocks || [];
          if (!completedBlocks.includes(blockId)) {
            await updateDoc(userProgressRef, {
              completedBlocks: [...completedBlocks, blockId]
            });
          }
        } else {
          await setDoc(userProgressRef, {
            completedBlocks: [blockId]
          });
        }
      }
    } catch (err) {
      console.error('Error saving quiz results:', err);
    }
  };

  if (loading) {
    return (
      <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <Layout>
            <Container>
              <Box sx={{ mt: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }} align="center">
                  טוען את המבחן...
                </Typography>
              </Box>
            </Container>
          </Layout>
        </div>
      </CacheProvider>
    );
  }

  if (error) {
    return (
      <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <Layout>
            <Container>
              <Alert severity="error">{error}</Alert>
            </Container>
          </Layout>
        </div>
      </CacheProvider>
    );
  }

  if (!block?.questions) {
    return (
      <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <Layout>
            <Container>
              <Alert severity="error">לא נמצאו שאלות בבוחן זה</Alert>
            </Container>
          </Layout>
        </div>
      </CacheProvider>
    );
  }

  if (showResults) {
    return (
      <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
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
                              color={answers[question.id] === question.correctAnswer ? 'success.main' : 'error.main'}
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
          
          {/* כפתור החלפת שפה */}
          <Box 
            sx={{ 
              position: 'fixed', 
              bottom: 20, 
              right: isRtl ? 20 : 'auto',
              left: isRtl ? 'auto' : 20,
              zIndex: 1000 
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setIsRtl(!isRtl)}
              sx={{ 
                borderRadius: '50%', 
                minWidth: 'auto', 
                width: 56, 
                height: 56,
                boxShadow: 3
              }}
            >
              {isRtl ? 'EN' : 'עב'}
            </Button>
          </Box>
        </div>
      </CacheProvider>
    );
  }

  return (
    <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
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

              <Box sx={{ mb: 4 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(currentQuestion / (block.questions.length - 1)) * 100} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    mb: 2,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    התחלה
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    סיום
                  </Typography>
                </Box>
              </Box>

              <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'primary.contrastText',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6">
                    שאלה {currentQuestion + 1} מתוך {block.questions.length}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 10 
                  }}>
                    <Typography variant="body2">
                      {Math.round((currentQuestion / block.questions.length) * 100)}%
                    </Typography>
                  </Box>
                </Box>
                
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h5" 
                    paragraph 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 3,
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {block.questions[currentQuestion].text}
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={answers[block.questions[currentQuestion].id] === null ? '' : answers[block.questions[currentQuestion].id]}
                      onChange={handleAnswerChange}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Array.isArray(block.questions[currentQuestion].options) && 
                          block.questions[currentQuestion].options.map((option, index) => {
                            // וידוא שהאופציה היא אובייקט תקין
                            const optionValue = typeof option === 'object' && option !== null
                              ? (option.value !== undefined ? option.value : index)
                              : index;
                              
                            const optionText = typeof option === 'object' && option !== null
                              ? (option.text || `אפשרות ${index + 1}`)
                              : (typeof option === 'string' ? option : `אפשרות ${index + 1}`);
                              
                            const isSelected = answers[block.questions[currentQuestion].id] === optionValue;
                            
                            return (
                              <Paper 
                                key={`option-${typeof option === 'object' ? (option.id || index) : index}`}
                                elevation={isSelected ? 3 : 1}
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  border: '2px solid',
                                  borderColor: isSelected ? 'primary.main' : 'transparent',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                                onClick={() => {
                                  const event = { target: { value: optionValue } };
                                  handleAnswerChange(event);
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Radio 
                                    checked={isSelected}
                                    value={optionValue}
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="body1">
                                    {optionText}
                                  </Typography>
                                </Box>
                              </Paper>
                            );
                          })
                        }
                      </Box>
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  startIcon={<PrevIcon />}
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  הקודם
                </Button>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {block.questions.map((_, idx) => (
                    <Box 
                      key={`dot-${idx}`}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        mx: 0.5,
                        bgcolor: idx === currentQuestion ? 'primary.main' : 'grey.300',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.2)'
                        }
                      }}
                      onClick={() => {
                        if (answers[block.questions[currentQuestion].id] !== null) {
                          setCurrentQuestion(idx);
                        }
                      }}
                    />
                  ))}
                </Box>
                
                {currentQuestion === block.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setConfirmSubmit(true)}
                    disabled={block.questions.some(q => answers[q.id] === null)}
                    endIcon={<CheckCircleIcon />}
                    size="large"
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      boxShadow: 2
                    }}
                  >
                    סיים בוחן
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={answers[block.questions[currentQuestion].id] === null}
                    endIcon={<NextIcon />}
                    size="large"
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      boxShadow: 2
                    }}
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
        
        {/* כפתור החלפת שפה */}
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: isRtl ? 20 : 'auto',
            left: isRtl ? 'auto' : 20,
            zIndex: 1000 
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsRtl(!isRtl)}
            sx={{ 
              borderRadius: '50%', 
              minWidth: 'auto', 
              width: 56, 
              height: 56,
              boxShadow: 3
            }}
          >
            {isRtl ? 'EN' : 'עב'}
          </Button>
        </Box>
      </div>
    </CacheProvider>
  );
}

export default QuizPage;
