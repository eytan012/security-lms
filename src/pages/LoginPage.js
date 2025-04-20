import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../context/UserContext';

function LoginPage() {
  const [personalCode, setPersonalCode] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loading } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userData = await login(personalCode);
      // נווט לדף המתאים לפי תפקיד המשתמש
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/progress');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.message || 'אירעה שגיאה בהתחברות. אנא נסה שוב.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            ברוכים הבאים ללומדה
          </Typography>
          <Typography variant="h6" gutterBottom align="center">
            אנא הזן מספר עובד וקוד אישי שלך
          </Typography>
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="קוד אישי"
              variant="outlined"
              margin="normal"
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              autoFocus
            />
                        <TextField
              fullWidth
              label="מספר עובד"
              variant="outlined"
              margin="normal"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              autoFocus
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth="true"
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={!personalCode || loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'כניסה'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
