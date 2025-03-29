import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating
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

// Mock simulation components
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

const PhishingSimulator = ({ onComplete }) => {
  const [selectedEmails, setSelectedEmails] = useState({});

  const mockEmails = [
    {
      id: 1,
      from: 'bank@secure-bank.com',
      subject: 'חשבונך נחסם - פעולה דחופה נדרשת',
      content: 'לקוח יקר, חשבונך נחסם עקב פעילות חשודה. אנא לחץ כאן להסרת החסימה.',
      isPhishing: true
    },
    {
      id: 2,
      from: 'support@microsoft.com',
      subject: 'עדכון אבטחה חשוב',
      content: 'משתמש יקר, נדרש עדכון אבטחה למערכת שלך. לחץ לעדכון.',
      isPhishing: false
    },
    {
      id: 3,
      from: 'prize@win-lottery.xyz',
      subject: 'זכית בפרס הגדול!',
      content: 'ברכות! זכית ב-1,000,000₪! שלח פרטים לקבלת הפרס.',
      isPhishing: true
    }
  ];

  const handleEmailClassification = (emailId, isPhishing) => {
    const email = mockEmails.find(e => e.id === emailId);
    const isCorrect = email.isPhishing === isPhishing;
    
    setSelectedEmails(prev => ({
      ...prev,
      [emailId]: isCorrect
    }));

    const allCorrect = Object.values(selectedEmails).every(v => v);
    if (allCorrect && Object.keys(selectedEmails).length === mockEmails.length - 1) {
      onComplete();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        זיהוי הודעות פישינג
      </Typography>
      {mockEmails.map(email => (
        <Card key={email.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2">מאת: {email.from}</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              נושא: {email.subject}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {email.content}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>סווג את ההודעה</InputLabel>
                <Select
                  value={selectedEmails[email.id] !== undefined ? 'answered' : ''}
                  label="סווג את ההודעה"
                  onChange={(e) => handleEmailClassification(email.id, e.target.value === 'phishing')}
                >
                  <MenuItem value="legitimate">הודעה לגיטימית</MenuItem>
                  <MenuItem value="phishing">הודעת פישינג</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
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

  useEffect(() => {
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
    switch (block.content) {
      case 'password-strength-simulator':
        return <PasswordStrengthSimulator onComplete={handleSimulationComplete} />;
      case 'phishing-simulator':
        return <PhishingSimulator onComplete={handleSimulationComplete} />;
      default:
        return (
          <Typography color="error">
            סימולציה לא נמצאה
          </Typography>
        );
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
              כל הכבוד! השלמת את הסימולציה בהצלחה
            </Alert>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {block.content === 'password-strength-simulator' ? (
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                ) : (
                  <EmailIcon color="primary" sx={{ mr: 1 }} />
                )}
                <Typography variant="h6">
                  {block.description}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              {renderSimulation()}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Layout>
  );
}

export default SimulationPage;
