import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Rating,
  TextField,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '../../context/UserContext';
import Layout from '../../components/Layout';
import PhishingSimulation from '../../components/simulations/PhishingSimulation';

// סימולטור סיסמה חזקה
const PasswordStrengthSimulator = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.match(/[A-Z]/)) score++;
    if (pwd.match(/[0-9]/)) score++;
    if (pwd.match(/[^A-Za-z0-9]/)) score++;
    return score;
  };

  const handleChange = (event) => {
    const pwd = event.target.value;
    setPassword(pwd);
    setStrength(calculateStrength(pwd));
    if (calculateStrength(pwd) >= 3) {
      onComplete();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        סימולטור סיסמה חזקה
      </Typography>
      <TextField
        fullWidth
        type="text"
        label="הזן סיסמה"
        value={password}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography component="legend">חוזק הסיסמה:</Typography>
        <Rating
          value={strength}
          max={4}
          readOnly
          sx={{ ml: 2 }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        * סיסמה חזקה צריכה להכיל לפחות 8 תווים, אות גדולה, מספר ותו מיוחד
      </Typography>
    </Box>
  );
};

// סימולטור פישינג
const PhishingSimulator = ({ scenario, onComplete }) => {
  return (
    <PhishingSimulation
      scenario={scenario}
      onComplete={onComplete}
    />
  );
};

function SimulationPage() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [blockData, setBlockData] = useState(null);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const blockDoc = await getDoc(doc(db, 'blocks', blockId));
        if (blockDoc.exists()) {
          const data = blockDoc.data();
          setBlock({ id: blockDoc.id, ...data });
          setBlockData(data);
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

  const handleSimulationComplete = async () => {
    try {
      // Add completion record
      const progressRef = collection(db, 'progress');
      await addDoc(progressRef, {
        userId: user.id,
        blockId,
        completed: true,
        completedAt: Timestamp.now(),
        type: 'simulation'
      });

      // Force parent page to refresh
      window.dispatchEvent(new Event('focus'));

      setCompleted(true);
    } catch (error) {
      console.error('Error marking simulation as complete:', error);
      setError('שגיאה בשמירת ההתקדמות');
    }
  };

  const renderSimulation = () => {
    if (!block || !block.type) return null;

    if (block.type === 'simulation') {
      console.log('Simulation block:', block);
      console.log('Block data:', blockData);
      if (blockData?.simulationData?.type === 'password') {
        return <PasswordStrengthSimulator onComplete={handleSimulationComplete} />;
      } else if (blockData?.simulationData?.type === 'phishing') {
        return blockData?.simulationData ? (
          <PhishingSimulator
            scenario={blockData.simulationData}
            onComplete={handleSimulationComplete}
          />
        ) : null;
      }
    }
    
    return (
      <Typography color="error">
        סימולציה לא נמצאה
      </Typography>
    );
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

          {block && (
            <>
              <Typography variant="h4" gutterBottom>
                {block.title}
              </Typography>

              {block.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {block.description}
                </Typography>
              )}
            </>
          )}

          {completed && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                כל הכבוד! סיימת את הסימולציה בהצלחה
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/blocks')}
                startIcon={<ArrowBackIcon />}
              >
                חזרה לבלוקי למידה
              </Button>
            </Box>
          )}

          {!completed && block && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {block.type === 'password' ? (
                    <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  ) : (
                    <EmailIcon color="primary" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="h6">
                    סימולציה אינטראקטיבית
                  </Typography>
                </Box>
                {renderSimulation()}
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </Layout>
  );
}

export default SimulationPage;
