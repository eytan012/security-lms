import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Language as LanguageIcon,
  Edit as EditIcon,
  EmojiEvents as AchievementIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import Layout from '../components/Layout';

function ProfilePage() {
  const { user, loading, updateUser } = useUser();
  const [language, setLanguage] = useState('he');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    department: user?.department || ''
  });

  // Handle progress reset
  const handleReset = useCallback(async () => {
    if (!user?.id) return;
    setIsResetting(true);
    setResetError(null);

    try {
      // איפוס התקדמות המשתמש
      const progressRef = collection(db, 'progress');
      const q = query(progressRef, where('userId', '==', user.id));
      const progressDocs = await getDocs(q);
      
      const batch = writeBatch(db);
      progressDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setResetError(null);
    } catch (error) {
      console.error('Error resetting progress:', error);
      setResetError('שגיאה באיפוס ההתקדמות');
    } finally {
      setIsResetting(false);
    }
  }, [user?.id]);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return;
      
      await updateUser(user.id, {
        displayName: formData.displayName,
        department: formData.department
      });
      
      setEditError(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setEditError('שגיאה בשמירת הפרופיל');
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Calculate progress
  const totalBlocks = 0; // TODO: להוסיף לוגיקה של בלוקים
  const completedBlocks = 0;
  const progressPercentage = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;

  // Mock data - יש להחליף עם נתונים אמיתיים מהשרת
  const achievements = [
    { id: 1, title: 'מסיים מצטיין', description: 'סיים את כל המבחנים בציון מעל 90', icon: '🏆' },
    { id: 2, title: 'לומד מתמיד', description: 'השלים 30 ימי לימוד רצופים', icon: '⭐' },
    { id: 3, title: 'מקצוען', description: 'השלים את כל הסימולציות בהצלחה', icon: '🎯' }
  ];

  const recentTests = [
    { id: 1, title: 'מבחן אבטחת מידע בסיסית', score: 95, date: '2025-03-20' },
    { id: 2, title: 'מבחן הגנת סייבר', score: 88, date: '2025-03-15' },
    { id: 3, title: 'מבחן אבטחת רשתות', score: 92, date: '2025-03-10' }
  ];

  return (
    <Layout>
      <Container>
        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="sm" fullWidth>
          <DialogTitle>עריכת פרופיל</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="שם"
                value={formData.displayName}
                onChange={handleInputChange('displayName')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="מחלקה"
                value={formData.department}
                onChange={handleInputChange('department')}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditing(false)}>ביטול</Button>
            <Button onClick={handleSaveProfile} variant="contained" color="primary">שמור</Button>
          </DialogActions>
        </Dialog>

        <Grid container justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    פרופיל משתמש
                  </Typography>
                  <IconButton onClick={handleEditProfile} size="large">
                    <EditIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Personal Information */}
                <Typography variant="h6" gutterBottom>
                  פרטים אישיים
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText primary="שם" secondary={user?.displayName} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText primary="אימייל" secondary={user?.email} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BusinessIcon />
                    </ListItemIcon>
                    <ListItemText primary="מחלקה" secondary={user?.department || 'לא צוין'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText primary="כניסה אחרונה" secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('he-IL') : 'לא ידוע'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LanguageIcon />
                    </ListItemIcon>
                    <ListItemText primary="שפה" />
                    <ListItemSecondaryAction>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={language}
                          onChange={handleLanguageChange}
                          displayEmpty
                        >
                          <MenuItem value="he">עברית</MenuItem>
                          <MenuItem value="en">English</MenuItem>
                        </Select>
                      </FormControl>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                {editError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {editError}
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Progress Section */}
                <Typography variant="h6" gutterBottom>
                  התקדמות כללית
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant={loading ? "indeterminate" : "determinate"}
                      value={progressPercentage}
                      sx={{ height: 10, borderRadius: 5, opacity: loading ? 0.7 : 1 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ opacity: loading ? 0.7 : 1 }}
                    >
                      {Math.round(progressPercentage)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ opacity: loading ? 0.7 : 1 }}
                >
                  {completedBlocks} מתוך {totalBlocks} יחידות הושלמו
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    onClick={handleReset}
                    color="error"
                    variant="outlined"
                    size="small"
                    disabled={loading || isResetting}
                  >
                    {isResetting ? 'מאפס...' : 'אפס התקדמות'}
                  </Button>
                </Box>

                {resetError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {resetError}
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Achievements and Recent Tests */}
                <Typography variant="h6" gutterBottom>
                  הישגים ומבחנים אחרונים
                </Typography>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
                  הישגים
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {achievements.map((achievement) => (
                    <Tooltip key={achievement.id} title={achievement.description}>
                      <Chip
                        icon={<AchievementIcon />}
                        label={achievement.title}
                        variant="outlined"
                        color="primary"
                      />
                    </Tooltip>
                  ))}
                </Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                  ציוני מבחנים אחרונים
                </Typography>
                <List>
                  {recentTests.map((test) => (
                    <ListItem key={test.id}>
                      <ListItemIcon>
                        <GradeIcon color={test.score >= 90 ? 'success' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={test.title}
                        secondary={`ציון: ${test.score}% | ${new Date(test.date).toLocaleDateString('he-IL')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}

export default ProfilePage;
