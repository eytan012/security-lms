import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  TextField,
  Paper,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  ContentCopy as DuplicateIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Help as HelpIcon,
  Translate as TranslateIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Layout from '../Layout';
import { useUser } from '../../context/UserContext';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// עורך מבחנים במסך מלא
export default function QuizEditor({ initialQuestions = [], onSave, blockId, blockTitle }) {
  const { user } = useUser();
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editForm, setEditForm] = useState({ 
    text: '', 
    options: ['', '', '', ''], 
    correctAnswer: 0, 
    explanation: '' 
  });
  const [activeTab, setActiveTab] = useState(0); // 0 = עריכה, 1 = תצוגה מקדימה
  const [previewAnswer, setPreviewAnswer] = useState(null);
  const [isRtl, setIsRtl] = useState(true); // ברירת מחדל: עברית (RTL)
  const [blockOrder, setBlockOrder] = useState(0); // סדר הצגת הבלוק
  
  // טעינת סדר הבלוק מפיירסטור
  useEffect(() => {
    const fetchBlockOrder = async () => {
      if (blockId && blockId !== 'new') {
        try {
          const blockDoc = await getDoc(doc(db, 'blocks', blockId));
          if (blockDoc.exists()) {
            const blockData = blockDoc.data();
            setBlockOrder(blockData.order || 0);
          }
        } catch (error) {
          console.error('Error fetching block order:', error);
        }
      }
    };
    
    fetchBlockOrder();
  }, [blockId]);
  
  // יצירת קונפיגורציית קאש לפי כיוון הטקסט - עם useMemo למניעת יצירה מחדש בכל רנדור
  const cacheRtl = useMemo(() => createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  }), []);
  
  const cacheLtr = useMemo(() => createCache({
    key: 'muiltr',
    stylisPlugins: [prefixer],
  }), []);

  // אתחול העורך
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      // בחר את השאלה הראשונה כברירת מחדל
      setSelectedIdx(0);
      setEditForm(initialQuestions[0]);
    }
  }, [initialQuestions]);

  // פונקציות לניהול שאלות
  const handleSelect = (idx) => {
    setSelectedIdx(idx);
    setEditForm(questions[idx]);
    setActiveTab(0); // חזרה ללשונית העריכה
  };

  const handleAdd = () => {
    setEditForm({ 
      text: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0, 
      explanation: '' 
    });
    setSelectedIdx(null);
    setActiveTab(0);
  };

  const handleDelete = (idx) => {
    const newQuestions = questions.filter((_, i) => i !== idx);
    setQuestions(newQuestions);
    
    // עדכון בחירת השאלה הנוכחית
    if (selectedIdx === idx) {
      if (newQuestions.length > 0) {
        const newIdx = Math.min(idx, newQuestions.length - 1);
        setSelectedIdx(newIdx);
        setEditForm(newQuestions[newIdx]);
      } else {
        setSelectedIdx(null);
        setEditForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });
      }
    } else if (selectedIdx > idx) {
      // עדכון האינדקס אם נמחקה שאלה לפני השאלה הנבחרת
      setSelectedIdx(selectedIdx - 1);
    }
    
    if (onSave) onSave(newQuestions);
  };

  const handleMove = (idx, dir) => {
    if ((dir < 0 && idx === 0) || (dir > 0 && idx === questions.length - 1)) return;
    
    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(idx, 1);
    newQuestions.splice(idx + dir, 0, removed);
    setQuestions(newQuestions);
    setSelectedIdx(idx + dir);
    
    if (onSave) onSave(newQuestions);
  };

  // פונקציות לטיפול בטופס העריכה - אופטימיזציה עם useCallback
  const handleFormChange = useCallback((field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleOptionChange = useCallback((optIdx, value) => {
    setEditForm(prev => {
      const newOptions = [...prev.options];
      newOptions[optIdx] = value;
      return { ...prev, options: newOptions };
    });
  }, []);

  const handleAddOption = useCallback(() => {
    setEditForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  }, []);

  const handleRemoveOption = useCallback((optIdx) => {
    setEditForm(prev => {
      if (prev.options.length <= 2) return prev; // מינימום 2 אפשרויות
      
      const newOptions = prev.options.filter((_, i) => i !== optIdx);
      const newCorrectAnswer = prev.correctAnswer >= optIdx ? 
        (prev.correctAnswer > 0 ? prev.correctAnswer - 1 : 0) : 
        prev.correctAnswer;
      
      return { 
        ...prev, 
        options: newOptions, 
        correctAnswer: newCorrectAnswer 
      };
    });
  }, []);

  // שמירת השאלה הנוכחית
  const handleSaveQuestion = () => {
    // וידוא שיש טקסט לשאלה
    if (!editForm.text.trim()) {
      alert('נא להזין טקסט לשאלה');
      return;
    }
    
    // וידוא שיש לפחות 2 אפשרויות תשובה
    const validOptions = editForm.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('נא להזין לפחות 2 אפשרויות תשובה');
      return;
    }
    
    // עדכון או הוספת שאלה
    const newQuestions = [...questions];
    if (selectedIdx !== null) {
      newQuestions[selectedIdx] = { ...editForm };
    } else {
      newQuestions.push({ ...editForm });
      setSelectedIdx(newQuestions.length - 1);
    }
    
    setQuestions(newQuestions);
    if (onSave) onSave(newQuestions);
  };

  // שמירת סדר הבלוק
  const handleSaveBlockOrder = async () => {
    if (blockId && blockId !== 'new') {
      try {
        await updateDoc(doc(db, 'blocks', blockId), {
          order: blockOrder
        });
        alert('סדר הבלוק נשמר בהצלחה');
      } catch (error) {
        console.error('Error saving block order:', error);
        alert('שגיאה בשמירת סדר הבלוק');
      }
    }
  };

  // ייצוא/ייבוא שאלות
  const handleExportQuestions = () => {
    try {
      // יצירת קובץ JSON להורדה
      const dataStr = JSON.stringify(questions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'quiz_questions.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting questions:', error);
      alert('שגיאה בייצוא השאלות');
    }
  };

  const handleImportQuestions = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedQuestions = JSON.parse(e.target.result);
        
        // וידוא שהמבנה תקין
        if (!Array.isArray(importedQuestions)) {
          throw new Error('פורמט לא תקין - לא מערך');
        }
        
        // בדיקת תקינות כל שאלה
        const validQuestions = importedQuestions.filter(q => 
          q.text && 
          Array.isArray(q.options) && 
          q.options.length >= 2 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 && 
          q.correctAnswer < q.options.length
        );
        
        setQuestions(validQuestions);
        if (validQuestions.length > 0) {
          setSelectedIdx(0);
          setEditForm(validQuestions[0]);
        }
        
        if (onSave) onSave(validQuestions);
        
        alert(`יובאו ${validQuestions.length} שאלות בהצלחה`);
      } catch (error) {
        console.error('Error importing questions:', error);
        alert('שגיאה בייבוא השאלות - פורמט לא תקין');
      }
    };
    reader.readAsText(file);
  };

  // שכפול שאלה
  const handleDuplicate = () => {
    if (selectedIdx === null) return;
    
    const duplicatedQuestion = { ...questions[selectedIdx] };
    const newQuestions = [...questions];
    newQuestions.splice(selectedIdx + 1, 0, duplicatedQuestion);
    
    setQuestions(newQuestions);
    setSelectedIdx(selectedIdx + 1);
    
    if (onSave) onSave(newQuestions);
  };

  // רנדור העורך
  return (
    <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <Layout>
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* כותרת וכפתורים עליונים */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => window.location.href = '/admin'}
                >
                  חזרה לדף הניהול
                </Button>
                <Typography variant="h4">
                  {blockTitle ? `עריכת מבחן: ${blockTitle}` : 'עורך מבחנים'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsRtl(!isRtl)}
                  sx={{ mr: 2 }}
                  startIcon={isRtl ? <TranslateIcon /> : null}
                  endIcon={!isRtl ? <TranslateIcon /> : null}
                >
                  {isRtl ? 'English' : 'עברית'}
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={isRtl ? <DownloadIcon /> : null}
                    endIcon={!isRtl ? <DownloadIcon /> : null}
                    onClick={handleExportQuestions}
                    disabled={questions.length === 0}
                  >
                    ייצא שאלות
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={isRtl ? <UploadIcon /> : null}
                    endIcon={!isRtl ? <UploadIcon /> : null}
                    component="label"
                  >
                    ייבא שאלות
                    <input
                      type="file"
                      accept=".json"
                      hidden
                      onChange={handleImportQuestions}
                    />
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={isRtl ? <SaveIcon /> : null}
                    endIcon={!isRtl ? <SaveIcon /> : null}
                    onClick={() => onSave && onSave(questions)}
                    disabled={questions.length === 0}
                  >
                    שמור מבחן
                  </Button>
                </Box>
              </Box>
            </Box>
            
            {/* סדר הצגת הבלוק */}
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  סדר הצגת הבלוק בדף הלמידה
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  שינוי הסדר ישפיע על מיקום הבלוק ברשימת הלמידה. מספר נמוך יותר = מוצג קודם.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <TextField
                    label="סדר הצגה"
                    type="number"
                    value={blockOrder}
                    onChange={(e) => setBlockOrder(parseInt(e.target.value) || 0)}
                    size="small"
                    fullWidth
                  />
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleSaveBlockOrder}
                    startIcon={<SaveIcon />}
                  >
                    שמור סדר
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            {/* אזור תוכן המבחן */}
            <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 300px)' }}>
              {/* רשימת שאלות */}
              <Paper 
                sx={{ 
                  width: '30%', 
                  overflow: 'auto',
                  p: 2,
                  textAlign: isRtl ? 'right' : 'left'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    שאלות ({questions.length})
                  </Typography>
                  <Button 
                    startIcon={isRtl ? <AddIcon /> : null}
                    endIcon={!isRtl ? <AddIcon /> : null}
                    onClick={handleAdd} 
                    variant="outlined"
                    size="small"
                  >
                    הוסף שאלה
                  </Button>
                </Box>
                
                <List>
                  {questions.map((q, idx) => (
                    <ListItem 
                      key={idx} 
                      selected={selectedIdx === idx} 
                      button 
                      onClick={() => handleSelect(idx)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: selectedIdx === idx ? 'primary.main' : 'divider'
                      }}
                    >
                      <ListItemText 
                        primary={`${idx + 1}. ${q.text.substring(0, 50)}${q.text.length > 50 ? '...' : ''}`}
                        secondary={`${q.options.length} אפשרויות`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="העבר למעלה">
                          <span>
                            <IconButton 
                              edge="end" 
                              onClick={(e) => { e.stopPropagation(); handleMove(idx, -1); }}
                              disabled={idx === 0}
                              size="small"
                            >
                              <ArrowUpIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="העבר למטה">
                          <span>
                            <IconButton 
                              edge="end" 
                              onClick={(e) => { e.stopPropagation(); handleMove(idx, 1); }}
                              disabled={idx === questions.length - 1}
                              size="small"
                            >
                              <ArrowDownIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="שכפל שאלה">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                            size="small"
                          >
                            <DuplicateIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחק שאלה">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                {questions.length === 0 && (
                  <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    <Typography variant="body2" gutterBottom>
                      אין שאלות במבחן
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={isRtl ? <AddIcon /> : null}
                      endIcon={!isRtl ? <AddIcon /> : null}
                      onClick={handleAdd}
                      sx={{ mt: 1 }}
                    >
                      הוסף שאלה ראשונה
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {/* עורך שאלה */}
              <Paper 
                sx={{ 
                  width: '70%', 
                  overflow: 'auto',
                  p: 2,
                  textAlign: isRtl ? 'right' : 'left'
                }}
              >
                {selectedIdx !== null || (selectedIdx === null && editForm.text) ? (
                  <>
                    <Tabs 
                      value={activeTab} 
                      onChange={(_, newValue) => setActiveTab(newValue)}
                      sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                      <Tab 
                        icon={<EditIcon />} 
                        label="עריכה" 
                        iconPosition={isRtl ? "start" : "end"}
                      />
                      <Tab 
                        icon={<PreviewIcon />} 
                        label="תצוגה מקדימה" 
                        iconPosition={isRtl ? "start" : "end"}
                      />
                    </Tabs>
                    
                    {activeTab === 0 ? (
                      <Box>
                        <TextField
                          label="טקסט השאלה"
                          value={editForm.text}
                          onChange={(e) => handleFormChange('text', e.target.value)}
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          sx={{ mb: 3 }}
                        />
                        
                        <Typography variant="h6" gutterBottom>
                          אפשרויות תשובה
                          <Tooltip title="התשובה הנכונה מסומנת בכחול">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <HelpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Typography>
                        
                        {editForm.options.map((option, idx) => (
                          <Box 
                            key={idx} 
                            sx={{ 
                              display: 'flex', 
                              mb: 2, 
                              alignItems: 'center',
                              bgcolor: editForm.correctAnswer === idx ? 'primary.light' : 'transparent',
                              borderRadius: 1,
                              p: 1
                            }}
                          >
                            <Radio
                              checked={editForm.correctAnswer === idx}
                              onChange={() => handleFormChange('correctAnswer', idx)}
                            />
                            <TextField
                              label={`אפשרות ${idx + 1}`}
                              value={option}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                            <Tooltip title="הסר אפשרות">
                              <span>
                                <IconButton 
                                  onClick={() => handleRemoveOption(idx)}
                                  disabled={editForm.options.length <= 2}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        ))}
                        
                        <Button 
                          startIcon={isRtl ? <AddIcon /> : null}
                          endIcon={!isRtl ? <AddIcon /> : null}
                          onClick={handleAddOption}
                          sx={{ mb: 3 }}
                        >
                          הוסף אפשרות
                        </Button>
                        
                        <TextField
                          label="הסבר (יוצג לאחר בחירת תשובה)"
                          value={editForm.explanation}
                          onChange={(e) => handleFormChange('explanation', e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                          variant="outlined"
                          sx={{ mt: 2, mb: 3 }}
                        />
                        
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={isRtl ? <SaveIcon /> : null}
                          endIcon={!isRtl ? <SaveIcon /> : null}
                          onClick={handleSaveQuestion}
                          sx={{ mr: 1 }}
                        >
                          שמור שאלה
                        </Button>
                        
                        <Button 
                          variant="outlined"
                          startIcon={isRtl ? <PreviewIcon /> : null}
                          endIcon={!isRtl ? <PreviewIcon /> : null}
                          onClick={() => setActiveTab(1)}
                        >
                          תצוגה מקדימה
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Card variant="outlined" sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              תצוגה מקדימה
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Typography variant="body1" paragraph>
                              {editForm.text}
                            </Typography>

                            <FormControl component="fieldset" fullWidth>
                              <RadioGroup
                                value={previewAnswer}
                                onChange={(e) => setPreviewAnswer(Number(e.target.value))}
                              >
                                {editForm.options.map((option, index) => (
                                  <FormControlLabel
                                    key={index}
                                    value={index}
                                    control={<Radio />}
                                    label={option}
                                    disabled={!option}
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>
                            
                            {previewAnswer !== null && (
                              <Box sx={{ mt: 2 }}>
                                <Alert 
                                  severity={previewAnswer === editForm.correctAnswer ? "success" : "error"}
                                >
                                  {previewAnswer === editForm.correctAnswer 
                                    ? 'תשובה נכונה!' 
                                    : `תשובה שגויה. התשובה הנכונה היא: ${editForm.options[editForm.correctAnswer]}`}
                                </Alert>
                                
                                {editForm.explanation && (
                                  <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                    {editForm.explanation}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => setPreviewAnswer(null)}
                          disabled={previewAnswer === null}
                          sx={{ mr: 1 }}
                        >
                          נסה שוב
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%' 
                  }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      בחר שאלה מהרשימה או צור שאלה חדשה
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={isRtl ? <AddIcon /> : null}
                      endIcon={!isRtl ? <AddIcon /> : null}
                      onClick={handleAdd}
                      sx={{ mt: 2 }}
                    >
                      הוסף שאלה חדשה
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          </Container>
        </Layout>
      </div>
    </CacheProvider>
  );
}
