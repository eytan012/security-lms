import { useEffect, useState } from 'react';

import {
  Container,
  Typography,
  Grid,
  CardContent,
  CardActions,
  LinearProgress,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  PlayArrow as PlayIcon,
  Assignment as AssignmentIcon,
  OndemandVideo as VideoIcon,
  Computer as SimulationIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

// Animated Components
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';


function LearningPage() {

  const { user } = useUser();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startingBlock, setStartingBlock] = useState(false);

  const title = 'לומדה'

  const fetchBlocks = async () => {
      try {
        // Fetch all blocks
        const blocksRef = collection(db, 'blocks');
        const q = query(blocksRef, orderBy('order'));
        const blocksSnapshot = await getDocs(q);
        const blocksData = blocksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch user's progress - כולל גם רשומות שהושלמו וגם שהתחילו
        const progressRef = collection(db, 'progress');
        const progressQuery = query(
          progressRef,
          where('userId', '==', user.id)
        );
        const progressSnapshot = await getDocs(progressQuery);
        const progressData = {};
        
        progressSnapshot.docs.forEach(doc => {
          const data = doc.data();
          progressData[data.blockId] = data;
        });
        
        // טעינת תוצאות המבחנים מטבלת quizResults
        const quizResultsRef = collection(db, 'quizResults');
        const quizResultsQuery = query(
          quizResultsRef,
          where('userId', '==', user.id)
        );
        const quizResultsSnapshot = await getDocs(quizResultsQuery);
        
        // שילוב תוצאות המבחנים עם נתוני ההתקדמות
        quizResultsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const blockId = data.blockId;
          
          // אם אין נתונים על הבלוק הזה או שיש נתונים אבל חסר מידע על הציון
          if (!progressData[blockId] || progressData[blockId].score === undefined) {
            // יצירת אובייקט חדש או עדכון הקיים
            progressData[blockId] = {
              ...progressData[blockId],
              blockId: blockId,
              score: data.score,
              passed: data.passed,
              completedAt: data.completedAt,
              started: true,
              completed: data.passed === true
            };
          }
        });


        // Sort blocks by order and add isLocked property
        const sortedBlocks = blocksData.sort((a, b) => a.order - b.order);
        const blocksWithLockStatus = sortedBlocks.map((block, index) => {
          // אדמין יכול לגשת לכל הבלוקים
          if (user.role === 'admin') {
            return { ...block, isLocked: false };
          }
          
          const prevBlock = index > 0 ? sortedBlocks[index - 1] : null;
          
          // בדיקה אם הבלוק הקודם הושלם
          let isLocked = false;
          if (prevBlock) {
            const prevBlockProgress = progressData[prevBlock.id];
            if (!prevBlockProgress || !prevBlockProgress.completed) {
              isLocked = true;
            }
            // אם הבלוק הקודם הוא בוחן, צריך גם לעבור אותו (ציון מעל 70)
            else if (prevBlock.type === 'quiz' && prevBlockProgress.score < 70 && !prevBlockProgress.passed) {
              // אם זה בוחן שלא עבר, הבלוק הבא נשאר נעול
              isLocked = true;
            }
          }
          
          return { ...block, isLocked };
        });

        setBlocks(blocksWithLockStatus);
        setProgress(progressData);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setLoading(false);
      }
    };

  // Fetch blocks on mount and when returning to the page
  useEffect(() => {
    fetchBlocks();
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add focus event listener to refresh data when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      fetchBlocks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartBlock = async (block) => {
    // אדמין יכול להתחיל כל בלוק
    if (block.isLocked && user.role !== 'admin') return;

    setSelectedBlock(block);
    setDialogOpen(true);
  };

  const handleConfirmStart = async () => {
    setStartingBlock(true);
    try {
      // ניסיון חדש לכתיבה לפיירבייס עם הגדרות משופרות
      if (!progress[selectedBlock.id]) {
        try {
          console.log('Attempting to write to progress collection...');
          console.log('User ID:', user.id);
          console.log('Block ID:', selectedBlock.id);
          
          // יצירת אובייקט הנתונים
          const progressData = {
            userId: user.id,
            blockId: selectedBlock.id,
            started: true,
            completed: false,
            startedAt: Timestamp.now(),
            lastAccessedAt: Timestamp.now()
          };
          
          // יצירת הפניה לאוסף
          const progressRef = collection(db, 'progress');
          
          // ניסיון כתיבה לאוסף
          const docRef = await addDoc(progressRef, progressData);
          console.log('Document written with ID:', docRef.id);
        } catch (error) {
          console.error('Error writing to progress collection:', error);
          // ממשיכים למרות השגיאה כדי לאפשר למשתמש לצפות בתוכן
        }
      }

      // Navigate based on block type
      switch (selectedBlock.type) {
        case 'quiz':
          navigate(`/quiz/${selectedBlock.id}`);
          break;
        case 'video':
          navigate(`/video/${selectedBlock.id}`);
          break;
        case 'simulation':
          navigate(`/simulation/${selectedBlock.id}`);
          break;
        case 'phishing_simulation':
          navigate(`/phishing-simulation/${selectedBlock.id}`);
          break;
        case 'document':
          navigate(`/material/${selectedBlock.id}`);
          break;
        case 'link':
          window.open(selectedBlock.content, '_blank');
          break;
        default:
          console.error('Unknown block type:', selectedBlock.type);
      }
    } catch (error) {
      console.error('Error starting block:', error);
    } finally {
      setStartingBlock(false);
      setDialogOpen(false);
    }
  };

  const getBlockIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoIcon color="primary" />;
      case 'quiz':
        return <AssignmentIcon color="secondary" />;
      case 'simulation':
        return <SimulationIcon color="success" />;
      default:
        return <SchoolIcon color="info" />;
    }
  };

  const getBlockStatus = (block) => {
    if (block.isLocked) return { label: 'נעול', color: 'error' };
    const blockProgress = progress[block.id];
    if (!blockProgress) return { label: 'זמין', color: 'default' };
    
    // בדיקה אם זה מבחן
    if (block.type === 'quiz') {
      // אם יש ציון, מציגים אותו בכל מקרה
      if (blockProgress.score !== undefined) {
        const score = Math.round(blockProgress.score);
        const passed = blockProgress.passed === true || blockProgress.score >= 70;
        
        return { 
          label: `${score}%`, 
          color: passed ? 'success' : 'error' 
        };
      }
    }
    
    // אם הבלוק הושלם בהצלחה
    if (blockProgress.completed && (block.type !== 'quiz' || blockProgress.passed === true || blockProgress.score >= 70)) {
      return { label: 'הושלם', color: 'success' };
    }
    
    // אם הבלוק בתהליך
    return { label: 'בתהליך', color: 'info' };
  };

  const getBlockDescription = (block) => {
    const typeDescriptions = {
      'video': 'סרטון הדרכה',
      'document': 'מסמך לקריאה',
      'quiz': 'מבחן',
      'simulation': 'סימולציה',
      'default': 'חומר לימוד'
    };
    return typeDescriptions[block.type] || typeDescriptions['default'];
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

  return (
    <Layout>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" gutterBottom align="center">
            {title}
          </Typography>
        </motion.div>

        <Grid container spacing={3}>
          {blocks.map((block, index) => {
            const status = getBlockStatus(block);
            return (
              <Grid item xs={12} sm={6} md={4} key={block.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                <AnimatedCard
                  sx={{
                    position: 'relative',
                    opacity: block.isLocked ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {block.isLocked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1
                      }}
                    >
                      <LockIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    </Box>
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getBlockIcon(block.type)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {block.title}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={status.label}
                        color={status.color}
                        icon={status.color === 'success' ? <CheckCircleIcon /> : undefined}
                      />
                      {progress[block.id]?.startedAt && (
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          התחלה: {new Date(progress[block.id].startedAt.toDate()).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {getBlockDescription(block)}
                    </Typography>

                    {block.estimatedTime && (
                      <Typography variant="caption" color="text.secondary">
                        זמן משוער: {block.estimatedTime} דקות
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <AnimatedButton
                      size="small"
                      color="primary"
                      startIcon={block.isLocked ? <LockIcon /> : <PlayIcon />}
                      fullWidth
                      onClick={() => handleStartBlock(block)}
                      disabled={block.isLocked}
                    >
                      {progress[block.id]?.completed ? 'צפה שוב' : 'התחל'}
                    </AnimatedButton>
                  </CardActions>
                </AnimatedCard>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        <Dialog open={dialogOpen} onClose={() => !startingBlock && setDialogOpen(false)}>
          <DialogTitle>התחלת בלוק</DialogTitle>
          <DialogContent>
            {selectedBlock && (
              <Typography>
                האם להתחיל את הבלוק "{selectedBlock.title}"?
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <AnimatedButton onClick={() => setDialogOpen(false)} disabled={startingBlock}>
              ביטול
            </AnimatedButton>
            <AnimatedButton
              onClick={handleConfirmStart}
              variant="contained"
              color="primary"
              disabled={startingBlock}
              startIcon={startingBlock ? <CircularProgress size={20} /> : undefined}
            >
              {startingBlock ? 'מתחיל...' : 'התחל'}
            </AnimatedButton>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}

export default LearningPage;
