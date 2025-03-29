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
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '../../context/UserContext';
import Layout from '../../components/Layout';

function VideoPage() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    // אם המשתמש הוא אדמין, נסמן את הסרטון כנצפה אוטומטית
    if (user?.role === 'admin') {
      setWatched(true);
      setCompleted(true);
    }

    const fetchBlock = async () => {
      try {
        const blockDoc = await getDoc(doc(db, 'blocks', blockId));
        if (blockDoc.exists()) {
          setBlock({ id: blockDoc.id, ...blockDoc.data() });
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

  const handleVideoComplete = async () => {
    try {
      // Mark video as watched
      setWatched(true);

      // Add completion record
      const progressRef = collection(db, 'progress');
      await addDoc(progressRef, {
        userId: user.id,
        blockId,
        completed: true,
        completedAt: Timestamp.now(),
        type: 'video'
      });

      // Force parent page to refresh
      window.dispatchEvent(new Event('focus'));

      setCompleted(true);
    } catch (error) {
      console.error('Error marking video as complete:', error);
      setError('שגיאה בשמירת ההתקדמות');
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

          {completed && (
            <Alert
              icon={<CheckCircleIcon />}
              severity="success"
              sx={{ mb: 2 }}
            >
              כל הכבוד! השלמת את הצפייה בסרטון
            </Alert>
          )}

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box
              sx={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden',
                '& iframe': {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }
              }}
            >
              <iframe
                src={block.content}
                title={block.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          </Paper>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                מידע על השיעור
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" paragraph>
                {block.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                זמן משוער: {block.estimatedTime} דקות
              </Typography>
            </CardContent>
          </Card>

          {user?.role !== 'admin' && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={watched ? <CheckCircleIcon /> : <PlayIcon />}
                onClick={handleVideoComplete}
                disabled={completed}
              >
                {completed ? 'הסרטון הושלם' : 'סמן כנצפה'}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Layout>
  );
}

export default VideoPage;
