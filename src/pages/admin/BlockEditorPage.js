import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Alert,
  Autocomplete,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Layout from '../../components/Layout';
import QuizEditor from '../../components/admin/QuizEditor';
import SimulationEditor from '../../components/admin/SimulationEditor';
import { useUser } from '../../context/UserContext';

export default function BlockEditorPage() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    content: '',
    dependencies: [],
    order: 0,
    simulationData: null,
    estimatedTime: 30,
    questions: []
  });
  
  // מצב עורך המבחנים במסך מלא
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  
  // טעינת נתוני הבלוק אם מדובר בעריכה
  useEffect(() => {
    const fetchData = async () => {
      try {
        // טעינת כל הבלוקים לצורך תלויות
        const blocksRef = collection(db, 'blocks');
        const blocksQuery = query(blocksRef, orderBy('order'));
        const blocksSnapshot = await getDocs(blocksQuery);
        const blocksData = blocksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBlocks(blocksData);
        
        // אם יש מזהה בלוק, טען את הנתונים שלו
        if (blockId && blockId !== 'new') {
          const blockDoc = await getDoc(doc(db, 'blocks', blockId));
          if (blockDoc.exists()) {
            const blockData = blockDoc.data();
            setFormData({
              title: blockData.title || '',
              description: blockData.description || '',
              type: blockData.type || 'document',
              content: blockData.content || '',
              dependencies: blockData.dependencies || [],
              order: blockData.order || 0,
              estimatedTime: blockData.estimatedTime || 30,
              questions: blockData.questions || [],
              simulationData: blockData.type === 'simulation' ? {
                type: blockData.simulationData?.type || 'phishing',
                scenarioId: blockData.simulationData?.scenarioId || '',
                difficulty: blockData.simulationData?.difficulty || 2,
                time_limit: blockData.simulationData?.time_limit || 45,
                content: blockData.simulationData?.content || null
              } : null
            });
            
            // אם זה מבחן, הצג את עורך המבחנים אוטומטית
            if (blockData.type === 'quiz') {
              setShowQuizEditor(true);
            }
          } else {
            // אם הבלוק לא נמצא, חזור לדף הניהול
            navigate('/admin');
          }
        } else {
          // בלוק חדש - הגדר את הסדר לסוף הרשימה
          setFormData(prev => ({
            ...prev,
            order: blocksData.length
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [blockId, navigate]);
  
  // שמירת הבלוק
  // פונקציה להמרת URL רגיל של יוטיוב ל-URL להטמעה
  const convertYoutubeUrl = (url) => {
    if (!url) return url;
    
    // בדיקה אם ה-URL כבר בפורמט להטמעה
    if (url.includes('/embed/')) return url;
    
    // המרת URL רגיל לפורמט להטמעה
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = url.match(regex);
    
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    return url;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // וידוא שיש כותרת
      if (!formData.title.trim()) {
        alert('נא להזין כותרת לבלוק');
        setSaving(false);
        return;
      }
      
      const blockData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        dependencies: formData.dependencies,
        order: formData.order,
        estimatedTime: formData.estimatedTime,
      };
      
      // הוספת נתונים ספציפיים לסוג הבלוק
      if (formData.type === 'quiz') {
        blockData.questions = formData.questions;
      } else if (formData.type === 'document' || formData.type === 'video') {
        // המרת URL של יוטיוב לפורמט הטמעה אם זה בלוק מסוג וידאו
        blockData.content = formData.type === 'video' ? convertYoutubeUrl(formData.content) : formData.content;
      } else if (formData.type === 'simulation') {
        blockData.simulationData = formData.simulationData;
      }
      
      // שמירה או עדכון
      if (blockId && blockId !== 'new') {
        await updateDoc(doc(db, 'blocks', blockId), blockData);
        console.log('Block updated:', blockId);
      } else {
        const docRef = await addDoc(collection(db, 'blocks'), blockData);
        console.log('Block created with ID:', docRef.id);
      }
      
      // חזרה לדף הניהול
      navigate('/admin');
    } catch (error) {
      console.error('Error saving block:', error);
      alert('שגיאה בשמירת הבלוק');
    } finally {
      setSaving(false);
    }
  };
  
  // שינוי סוג הבלוק
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setFormData(prev => ({
      ...prev,
      type: newType,
      // איפוס נתונים ספציפיים לסוג
      ...(newType === 'quiz' ? { questions: prev.questions || [] } : {}),
      ...(newType === 'simulation' ? { 
        simulationData: prev.simulationData || {
          type: 'phishing',
          scenarioId: '',
          difficulty: 2,
          time_limit: 45,
          content: null
        } 
      } : {})
    }));
    
    // אם זה מבחן, הצג את עורך המבחנים אוטומטית
    if (newType === 'quiz') {
      setShowQuizEditor(true);
    } else {
      setShowQuizEditor(false);
    }
  };
  
  // עדכון שאלות המבחן
  const handleQuizQuestionsUpdate = (updatedQuestions) => {
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
    setShowQuizEditor(false);
  };
  
  if (loading) {
    return (
      <Layout>
        <Container sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }
  
  // אם מוצג עורך המבחנים במסך מלא
  if (showQuizEditor) {
    return (
      <QuizEditor
        initialQuestions={formData.questions}
        blockId={blockId}
        blockTitle={formData.title}
        onSave={handleQuizQuestionsUpdate}
      />
    );
  }
  
  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {blockId && blockId !== 'new' ? 'עריכת בלוק' : 'בלוק חדש'}
          </Typography>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin')}
          >
            חזרה לניהול
          </Button>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="כותרת"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="תיאור"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControl fullWidth>
              <InputLabel>סוג בלוק</InputLabel>
              <Select
                value={formData.type}
                onChange={handleTypeChange}
                label="סוג בלוק"
              >
                <MenuItem value="document">מסמך</MenuItem>
                <MenuItem value="video">סרטון</MenuItem>
                <MenuItem value="quiz">מבחן</MenuItem>
                <MenuItem value="simulation">סימולציה</MenuItem>
              </Select>
            </FormControl>
            
            {/* תוכן ספציפי לסוג הבלוק */}
            {formData.type === 'document' || formData.type === 'video' ? (
              <TextField
                label={formData.type === 'video' ? 'קישור לסרטון' : 'תוכן המסמך'}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                fullWidth
                multiline={formData.type === 'document'}
                rows={formData.type === 'document' ? 6 : 1}
                placeholder={formData.type === 'video' ? 'הכנס קישור לסרטון (URL רגיל או להטמעה)' : 'הכנס את תוכן המסמך'}
                helperText={formData.type === 'video' ? 'ניתן להכניס URL רגיל של יוטיוב, המערכת תמיר אותו אוטומטית לפורמט הטמעה' : ''}
              />
            ) : null}
            
            {formData.type === 'quiz' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  שאלות ({formData.questions.length})
                </Typography>
                
                {formData.questions.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      יש {formData.questions.length} שאלות במבחן זה.
                    </Alert>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setShowQuizEditor(true)}
                      sx={{ mb: 2 }}
                    >
                      פתח עורך מבחנים מלא
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      אין שאלות במבחן זה. השתמש בעורך המבחנים כדי להוסיף שאלות.
                    </Alert>
                    <Button
                      variant="contained"
                      onClick={() => setShowQuizEditor(true)}
                    >
                      פתח עורך מבחנים
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            
            {formData.type === 'simulation' && (
              <SimulationEditor
                data={formData.simulationData}
                onChange={(simulationData) => setFormData({ ...formData, simulationData })}
              />
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <Autocomplete
              multiple
              options={blocks.filter(b => b.id !== blockId)}
              getOptionLabel={(block) => block.title}
              value={blocks.filter(b => formData.dependencies.includes(b.id))}
              onChange={(_, newValue) => setFormData({
                ...formData,
                dependencies: newValue.map(b => b.id)
              })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="תלויות"
                  placeholder="בחר בלוקים שצריך להשלים לפני"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.title}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
            />
            
            <TextField
              label="זמן משוער (דקות)"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
              fullWidth
            />
            
            <TextField
              label="סדר הצגה"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              fullWidth
              helperText="סדר הצגת הבלוק ברשימה (מספר נמוך יותר = מוצג קודם)"
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              {blockId && blockId !== 'new' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק בלוק זה?')) {
                      // מחיקת הבלוק
                      // TODO: הוסף קוד למחיקת הבלוק
                      navigate('/admin');
                    }
                  }}
                >
                  מחק בלוק
                </Button>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin')}
                >
                  ביטול
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'שומר...' : 'שמור בלוק'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
}
