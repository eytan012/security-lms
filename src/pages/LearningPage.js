import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
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

function LMSBlocksPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startingBlock, setStartingBlock] = useState(false);

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

        // Fetch user's progress
        const progressRef = collection(db, 'progress');
        const progressQuery = query(
          progressRef,
          where('userId', '==', user.id),
          where('completed', '==', true)
        );
        const progressSnapshot = await getDocs(progressQuery);
        const progressData = {};
        
        progressSnapshot.docs.forEach(doc => {
          const data = doc.data();
          progressData[data.blockId] = data;
        });

        console.log('Progress data:', progressData);

        // Sort blocks by order and add isLocked property
        const sortedBlocks = blocksData.sort((a, b) => a.order - b.order);
        const blocksWithLockStatus = sortedBlocks.map((block, index) => {
          // אדמין יכול לגשת לכל הבלוקים
          if (user.role === 'admin') {
            return { ...block, isLocked: false };
          }
          
          const prevBlock = index > 0 ? sortedBlocks[index - 1] : null;
          const isLocked = prevBlock ? !progressData[prevBlock.id]?.completed : false;
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
      // Create or update progress
      if (!progress[selectedBlock.id]) {
        const progressRef = collection(db, 'progress');
        await addDoc(progressRef, {
          userId: user.id,
          blockId: selectedBlock.id,
          started: true,
          completed: false,
          startedAt: Timestamp.now(),
          lastAccessedAt: Timestamp.now()
        });
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
    if (!blockProgress) return { label: 'לא התחיל', color: 'default' };
    if (blockProgress.completed) return { label: 'הושלם', color: 'success' };
    return { label: 'בתהליך', color: 'info' };
  };

  const getBlockDescription = (block) => {
    const descriptions = {
      video: 'צפייה בהדרכה מוקלטת',
      quiz: 'בוחן ידע אינטראקטיבי',
      simulation: 'תרגול והתנסות מעשית',
      default: 'חומר לימוד'
    };
    return descriptions[block.type] || descriptions.default;
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
        <Typography variant="h4" gutterBottom align="center">
          בלוקי למידה
        </Typography>

        <Grid container spacing={3}>
          {blocks.map((block) => {
            const status = getBlockStatus(block);
            return (
              <Grid item xs={12} sm={6} md={4} key={block.id}>
                <Card
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
                          התחלת: {new Date(progress[block.id].startedAt.toDate()).toLocaleDateString()}
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
                    <Button
                      size="small"
                      color="primary"
                      startIcon={block.isLocked ? <LockIcon /> : <PlayIcon />}
                      fullWidth
                      onClick={() => handleStartBlock(block)}
                      disabled={block.isLocked}
                    >
                      {progress[block.id]?.completed ? 'צפה שוב' : 'התחל'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Dialog open={dialogOpen} onClose={() => !startingBlock && setDialogOpen(false)}>
          <DialogTitle>התחלת בלוק למידה</DialogTitle>
          <DialogContent>
            {selectedBlock && (
              <Typography>
                האם להתחיל את הבלוק "{selectedBlock.title}"?
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={startingBlock}>
              ביטול
            </Button>
            <Button
              onClick={handleConfirmStart}
              variant="contained"
              color="primary"
              disabled={startingBlock}
              startIcon={startingBlock ? <CircularProgress size={20} /> : undefined}
            >
              {startingBlock ? 'מתחיל...' : 'התחל'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}

export default LMSBlocksPage;
