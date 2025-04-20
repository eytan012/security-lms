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
  FormControl,
  Card,
  CardContent,
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
import { doc, getDoc, collection, addDoc, updateDoc, Timestamp, query, where, getDocs, setDoc } from 'firebase/firestore';
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
          
          // וידוא שיש מערך שאלות
          if (!blockData.questions || !Array.isArray(blockData.questions)) {
            console.error('No questions array found in block data:', blockData);
            setError('מבנה הנתונים של המבחן אינו תקין');
            setLoading(false);
            return;
          }
          
          console.log(`Found ${blockData.questions.length} questions in block`);
          
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
          
          console.log(`Processed ${questionsWithIds.length} questions with IDs`);
          
          // וידוא שכל השאלות עברו עיבוד
          if (questionsWithIds.length !== blockData.questions.length) {
            console.warn(`Warning: Processed questions count (${questionsWithIds.length}) doesn't match original questions count (${blockData.questions.length})`);
          }
          
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
          
          console.log('Block data processed successfully:', {
            blockId: blockDoc.id,
            questionsCount: questionsWithIds.length,
            answersInitialized: Object.keys(initialAnswers).length
          });
        } else {
          console.error('Block not found with ID:', blockId);
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
      // וידוא שהמשתמש מחובר ושיש לו id
      if (!user || !user.id) {
        console.warn('User not logged in or user.id is undefined. Cannot save quiz results.');
        return;
      }
      
      // וידוא ש-blockId קיים
      if (!blockId) {
        console.error('blockId is undefined. Cannot save quiz results.');
        return;
      }
      
      console.log('Saving quiz results for user:', user.id, 'block:', blockId);
      
      // בדיקה אם יש כבר תוצאה קיימת למשתמש זה בבלוק זה
      const quizResultsRef = collection(db, 'quizResults');
      const existingResultsQuery = query(
        quizResultsRef,
        where('userId', '==', user.id),
        where('blockId', '==', blockId)
      );
      const existingResultsSnapshot = await getDocs(existingResultsQuery);
      
      const quizResultData = {
        userId: user.id,
        blockId: blockId,
        score: calculatedScore,
        answers: answers,
        completedAt: Timestamp.now(),
        passed: calculatedScore >= 70
      };
      
      if (!existingResultsSnapshot.empty) {
        // עדכון תוצאה קיימת
        const existingResultDoc = existingResultsSnapshot.docs[0];
        console.log('Updating existing quiz result with ID:', existingResultDoc.id);
        await updateDoc(doc(db, 'quizResults', existingResultDoc.id), quizResultData);
      } else {
        // יצירת תוצאה חדשה
        console.log('Creating new quiz result');
        await addDoc(quizResultsRef, quizResultData);
      }
      
      // עדכון סטטוס השלמה של הבלוק עבור המשתמש
      if (calculatedScore >= 70 && user && user.id) {
        try {
          const userProgressRef = doc(db, 'userProgress', user.id);
          const userProgressDoc = await getDoc(userProgressRef);
          
          if (userProgressDoc.exists()) {
            const completedBlocks = userProgressDoc.data().completedBlocks || [];
            if (!completedBlocks.includes(blockId)) {
              console.log('Adding block to completed blocks for user:', user.id);
              await updateDoc(userProgressRef, {
                completedBlocks: [...completedBlocks, blockId]
              });
            }
          } else {
            console.log('Creating new userProgress document for user:', user.id);
            await setDoc(userProgressRef, {
              completedBlocks: [blockId]
            });
          }
        } catch (err) {
          console.error('Error updating user progress:', err);
          // לא נכשל את כל הפעולה אם יש שגיאה בעדכון ההתקדמות
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

  if (!block?.questions || block.questions.length === 0) {
    return (
      <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <Layout>
            <Container>
              <Alert severity="error">לא נמצאו שאלות בבוחן זה</Alert>
              <Box sx={{ mt: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/blocks')}
                >
                  חזרה לבלוקי למידה
                </Button>
              </Box>
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
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3,
                  mt: 2,
                  flexWrap: 'wrap',
                  gap: 2
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/blocks')}
                    sx={{
                      borderRadius: 8,
                      px: 3,
                      py: 1,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    חזרה לבלוקי למידה
                  </Button>
                  {/* כפתור "נסה שוב" הוסר לפי בקשת המשתמש */}
                </Box>

                <Card sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 15px 35px rgba(0,0,0,0.15)'
                  }
                }}>
                  <Box sx={{
                    background: 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
                    p: 3,
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <Typography 
                      variant="h4" 
                      gutterBottom 
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        letterSpacing: 1
                      }}
                    >
                      תוצאות הבוחן
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      {block.title}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 4 }}>

                    <Box 
                      sx={{ 
                        position: 'relative',
                        textAlign: 'center', 
                        my: 4, 
                        p: 4, 
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        border: '1px solid',
                        borderColor: score >= 70 ? 'success.light' : 'error.light',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: score >= 70 
                            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%)'
                            : 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.2) 100%)',
                          zIndex: 0
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* ציון במעגל */}
                        <Box 
                          sx={{ 
                            width: 180, 
                            height: 180, 
                            margin: '0 auto',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: '100%', 
                              height: '100%', 
                              borderRadius: '50%',
                              background: score >= 70 
                                ? 'conic-gradient(#4caf50 0% ' + score + '%, #e0e0e0 ' + score + '% 100%)'
                                : 'conic-gradient(#f44336 0% ' + score + '%, #e0e0e0 ' + score + '% 100%)',
                              position: 'absolute',
                              transform: 'rotate(-90deg)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                          />
                          <Box 
                            sx={{ 
                              width: '80%', 
                              height: '80%', 
                              borderRadius: '50%',
                              background: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Typography 
                              variant="h2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: score >= 70 ? 'success.main' : 'error.main',
                                fontSize: { xs: '2rem', sm: '2.5rem' }
                              }}
                            >
                              {Math.round(score)}%
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            mt: 1, 
                            mb: 3,
                            color: score >= 70 ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        >
                          {score >= 70 ? 'כל הכבוד! עברת את הבוחן בהצלחה' : 'טרם השגת את הציון הנדרש'}
                        </Typography>
                        
                        <Box 
                          sx={{ 
                            mt: 2, 
                            color: 'text.secondary',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                          }}
                        >
                          {score >= 70 ? (
                            <>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                הבלוק הבא נפתח עבורך!
                              </Typography>
                              {retryCount > 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  (הצלחת לאחר {retryCount} נסיונות)
                                </Typography>
                              )}
                            </>
                          ) : (
                            <>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                נדרש ציון של 70% לפחות כדי להשלים את הבוחן.
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                זהו נסיון מספר {retryCount + 1}. באפשרותך לנסות שוב.
                              </Typography>
                            </>
                          )}
                        </Box>
                        
                        <Box sx={{ mt: 4 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 'bold', 
                              pb: 1, 
                              borderBottom: '2px solid',
                              borderColor: 'divider',
                              display: 'inline-block'
                            }}
                          >
                            סיכום ביצועים
                          </Typography>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: 3,
                              mt: 2,
                              flexWrap: { xs: 'wrap', sm: 'nowrap' }
                            }}
                          >
                            <Box 
                              sx={{ 
                                textAlign: 'center', 
                                p: 3, 
                                bgcolor: 'background.paper', 
                                borderRadius: 3,
                                flex: 1,
                                minWidth: { xs: '100%', sm: '120px' },
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                border: '1px solid',
                                borderColor: 'primary.light',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '4px',
                                  bgcolor: 'primary.main'
                                }
                              }}
                            >
                              <Typography 
                                variant="h4" 
                                color="primary"
                                sx={{ fontWeight: 'bold', mb: 1 }}
                              >
                                {block.questions.filter(question => answers[question.id] === question.correctAnswer).length}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                color="text.primary"
                                sx={{ fontWeight: 'medium' }}
                              >
                                תשובות נכונות
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                              </Box>
                            </Box>
                            
                            <Box 
                              sx={{ 
                                textAlign: 'center', 
                                p: 3, 
                                bgcolor: 'background.paper', 
                                borderRadius: 3,
                                flex: 1,
                                minWidth: { xs: '100%', sm: '120px' },
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                border: '1px solid',
                                borderColor: 'error.light',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '4px',
                                  bgcolor: 'error.main'
                                }
                              }}
                            >
                              <Typography 
                                variant="h4" 
                                color="error"
                                sx={{ fontWeight: 'bold', mb: 1 }}
                              >
                                {block.questions.filter(question => answers[question.id] !== question.correctAnswer).length}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                color="text.primary"
                                sx={{ fontWeight: 'medium' }}
                              >
                                תשובות שגויות
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                                <ErrorIcon sx={{ color: 'error.main', fontSize: 28 }} />
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 5 }}>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          mb: 3, 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.primary',
                          '&:before, &:after': {
                            content: '""',
                            height: '2px',
                            flexGrow: 1,
                            bgcolor: 'divider',
                            mx: 2
                          }
                        }}
                      >
                        פירוט השאלות והתשובות
                      </Typography>
                      
                      {block.questions.map((question, index) => (
                        <Paper 
                          key={`result-${question.id}`} 
                          sx={{ 
                            p: 0, 
                            mb: 4, 
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                          elevation={2}
                        >
                          <Box sx={{ 
                            p: 3, 
                            bgcolor: answers[question.id] === question.correctAnswer ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)',
                            color: answers[question.id] === question.correctAnswer ? 'success.dark' : 'error.dark',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                              fontSize: '1.1rem'
                            }}>
                              {index + 1}
                            </Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'bold',
                                flex: 1,
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                              }}
                            >
                              {question.text}
                            </Typography>
                            <Box>
                              {answers[question.id] === question.correctAnswer ? 
                                <CheckCircleIcon sx={{ fontSize: 28 }} /> : 
                                <ErrorIcon sx={{ fontSize: 28 }} />
                              }
                            </Box>
                          </Box>
                          
                          <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 2
                            }}>
                              <Box sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                bgcolor: answers[question.id] === question.correctAnswer ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                                border: '1px solid',
                                borderColor: answers[question.id] === question.correctAnswer ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'
                              }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    fontWeight: 'medium',
                                    color: answers[question.id] === question.correctAnswer ? 'rgba(46, 125, 50, 0.9)' : 'rgba(198, 40, 40, 0.9)'
                                  }}
                                >
                                  {answers[question.id] === question.correctAnswer ? 
                                    <CheckCircleIcon sx={{ mr: 1 }} /> : 
                                    <ErrorIcon sx={{ mr: 1 }} />
                                  }
                                  <Box sx={{ mr: 1, fontWeight: 'bold' }}>תשובתך:</Box> 
                                  {question.options.find(opt => opt.value === answers[question.id])?.text || 'לא נבחרה תשובה'}
                                </Typography>
                              </Box>
                              
                              {answers[question.id] !== question.correctAnswer && (
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 2, 
                                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                                  border: '1px solid',
                                  borderColor: 'rgba(76, 175, 80, 0.3)'
                                }}>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      fontWeight: 'medium',
                                      color: 'rgba(46, 125, 50, 0.9)'
                                    }}
                                  >
                                    <CheckCircleIcon sx={{ mr: 1 }} />
                                    <Box sx={{ mr: 1, fontWeight: 'bold' }}>התשובה הנכונה:</Box> 
                                    {question.options.find(opt => opt.value === question.correctAnswer)?.text}
                                  </Typography>
                                </Box>
                              )}
                              
                              {question.explanation && (
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 2, 
                                  bgcolor: 'rgba(33, 150, 243, 0.05)',
                                  border: '1px solid',
                                  borderColor: 'rgba(33, 150, 243, 0.3)',
                                  mt: 1
                                }}>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'flex-start',
                                      color: 'rgba(25, 118, 210, 0.9)'
                                    }}
                                  >
                                    <InfoIcon sx={{ mr: 1, mt: 0.3 }} />
                                    <Box>
                                      <Box sx={{ fontWeight: 'bold', mb: 0.5 }}>הסבר:</Box>
                                      {question.explanation}
                                    </Box>
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Container>
          </Layout>
          {/* כפתור החלפת שפה הוסר לפי בקשת המשתמש */}
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

              {/* פס ההתקדמות הוסר לפי בקשת המשתמש */}
              <Box sx={{ mb: 3 }} />

              <Card 
                elevation={6} 
                sx={{ 
                  borderRadius: 4, 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 8
                  },
                  position: 'relative',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ 
                  p: 2.5, 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        mr: 1.5, 
                        bgcolor: 'white', 
                        color: 'primary.main', 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: 1
                      }}
                    >
                      {currentQuestion + 1}
                    </Box>
                    שאלה {currentQuestion + 1} מתוך {block.questions.length}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'rgba(255,255,255,0.3)', 
                    px: 2, 
                    py: 0.7, 
                    borderRadius: 20,
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {Math.round((currentQuestion / block.questions.length) * 100)}%
                    </Typography>
                  </Box>
                </Box>
                
                <CardContent sx={{ p: 4, pt: 3 }}>
                  <Typography 
                    variant="h5" 
                    paragraph 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 4,
                      pb: 2,
                      borderBottom: '2px solid',
                      borderColor: 'primary.light',
                      lineHeight: 1.5,
                      color: 'text.primary',
                      fontSize: { xs: '1.2rem', sm: '1.5rem' }
                    }}
                  >
                    {block.questions[currentQuestion].text}
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={answers[block.questions[currentQuestion].id] === undefined || answers[block.questions[currentQuestion].id] === null ? '' : answers[block.questions[currentQuestion].id]}
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
                                elevation={isSelected ? 4 : 1}
                                sx={{
                                  p: 2.5,
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  border: '2px solid',
                                  borderColor: isSelected ? 'primary.main' : 'transparent',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:before': isSelected ? {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '6px',
                                    height: '100%',
                                    backgroundColor: 'primary.main',
                                  } : {},
                                  '&:hover': {
                                    bgcolor: isSelected ? 'rgba(33, 150, 243, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                    transform: 'translateY(-4px)',
                                    boxShadow: 3
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
                                    sx={{ 
                                      mr: 1.5,
                                      color: isSelected ? 'primary.main' : 'grey.500',
                                      '& .MuiSvgIcon-root': {
                                        fontSize: 24
                                      }
                                    }}
                                  />
                                  <Typography 
                                    variant="body1"
                                    sx={{ 
                                      fontWeight: isSelected ? 600 : 400,
                                      color: isSelected ? 'text.primary' : 'text.secondary',
                                      fontSize: '1rem',
                                      lineHeight: 1.5,
                                      flexGrow: 1
                                    }}
                                  >
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

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  startIcon={<PrevIcon />}
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderRadius: 30,
                    px: 4,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    boxShadow: currentQuestion === 0 ? 0 : 1,
                    '&:hover': {
                      boxShadow: currentQuestion === 0 ? 0 : 2,
                      backgroundColor: currentQuestion === 0 ? '' : 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  הקודם
                </Button>
                
                {/* האינדיקטורים הוסרו לגמרי לפי בקשת המשתמש */}
                <Box sx={{ width: '1px', height: '1px' }} />
                
                {currentQuestion === block.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setConfirmSubmit(true)}
                    disabled={block.questions.some(q => answers[q.id] === null)}
                    endIcon={<CheckCircleIcon />}
                    size="large"
                    sx={{ 
                      borderRadius: 30,
                      px: 4,
                      py: 1.2,
                      boxShadow: '0 4px 10px 0 rgba(33, 150, 243, 0.3)',
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      '&:hover': {
                        boxShadow: '0 6px 15px 0 rgba(33, 150, 243, 0.4)',
                      },
                      '&.Mui-disabled': {
                        background: 'linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)',
                        boxShadow: 'none'
                      }
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
                      borderRadius: 30,
                      px: 4,
                      py: 1.2,
                      boxShadow: '0 4px 10px 0 rgba(33, 150, 243, 0.3)',
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      '&:hover': {
                        boxShadow: '0 6px 15px 0 rgba(33, 150, 243, 0.4)',
                      },
                      '&.Mui-disabled': {
                        background: 'linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)',
                        boxShadow: 'none'
                      }
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
