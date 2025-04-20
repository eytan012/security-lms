import React, { useState, useEffect } from 'react';
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
  Translate as TranslateIcon
} from '@mui/icons-material';
import Layout from '../Layout';
import { useUser } from '../../context/UserContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

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
  
  // יצירת קונפיגורציית קאש לפי כיוון הטקסט
  const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  });
  
  const cacheLtr = createCache({
    key: 'muiltr',
    stylisPlugins: [prefixer],
  });

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

  // פונקציות לטיפול בטופס העריכה
  const handleFormChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleOptionChange = (optIdx, value) => {
    const newOptions = [...editForm.options];
    newOptions[optIdx] = value;
    setEditForm({ ...editForm, options: newOptions });
  };

  const handleAddOption = () => {
    setEditForm({ ...editForm, options: [...editForm.options, ''] });
  };

  const handleRemoveOption = (optIdx) => {
    if (editForm.options.length <= 2) return; // מינימום 2 אפשרויות
    
    const newOptions = editForm.options.filter((_, i) => i !== optIdx);
    const newCorrectAnswer = editForm.correctAnswer >= optIdx ? 
      (editForm.correctAnswer > 0 ? editForm.correctAnswer - 1 : 0) : 
      editForm.correctAnswer;
    
    setEditForm({ 
      ...editForm, 
      options: newOptions, 
      correctAnswer: newCorrectAnswer 
    });
  };

  // שמירת השאלה הנוכחית
  const handleSaveQuestion = () => {
    // וידוא שיש טקסט לשאלה
    if (!editForm.text.trim()) {
      alert('נא להזין טקסט לשאלה');
      return;
    }

    // וידוא שיש לפחות 2 אפשרויות עם טקסט
    const validOptions = editForm.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('נא להזין לפחות 2 אפשרויות תשובה');
      return;
    }

    let newQuestions = [...questions];
    if (selectedIdx !== null) {
      newQuestions[selectedIdx] = { ...editForm };
    } else {
      newQuestions.push({ ...editForm });
      setSelectedIdx(newQuestions.length - 1);
    }
    
    setQuestions(newQuestions);
    if (onSave) onSave(newQuestions);
  };

  // ייצוא/ייבוא שאלות
  const handleExportQuestions = () => {
    try {
      const data = JSON.stringify(questions, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${blockId || 'new'}-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
        const importedData = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedData)) {
          throw new Error('מבנה קובץ לא תקין');
        }
        
        setQuestions(importedData);
        if (importedData.length > 0) {
          setSelectedIdx(0);
          setEditForm(importedData[0]);
        }
        
        if (onSave) onSave(importedData);
      } catch (error) {
        console.error('Error importing questions:', error);
        alert('שגיאה בייבוא השאלות: מבנה קובץ לא תקין');
      }
    };
    reader.readAsText(file);
    
    // איפוס שדה הקלט
    event.target.value = null;
  };

  // שכפול שאלה
  const handleDuplicate = () => {
    if (selectedIdx === null) return;
    
    const duplicatedQuestion = { ...questions[selectedIdx] };
    const newQuestions = [...questions];
    newQuestions.splice(selectedIdx + 1, 0, duplicatedQuestion);
    
    setQuestions(newQuestions);
    setSelectedIdx(selectedIdx + 1);
    setEditForm(duplicatedQuestion);
    
    if (onSave) onSave(newQuestions);
  };

  // רנדור העורך
  return (
    <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <Layout>
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                {blockTitle ? `עריכת מבחן: ${blockTitle}` : 'עורך מבחנים'}
              </Typography>
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
            
            <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
              {/* עורך שאלה */}
              <Paper 
                sx={{ 
                  flex: 1, 
                  p: 2,
                  overflow: 'auto',
                  textAlign: isRtl ? 'right' : 'left'
                }}
              >
                {selectedIdx !== null || activeTab === 0 ? (
                  <>
                    <Tabs 
                      value={activeTab} 
                      onChange={(e, newValue) => setActiveTab(newValue)}
                      sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                      <Tab label="עריכה" />
                      <Tab label="תצוגה מקדימה" disabled={!editForm.text} />
                    </Tabs>
                    
                    {activeTab === 0 ? (
                      // לשונית עריכה
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">
                            {selectedIdx !== null ? `עריכת שאלה #${selectedIdx + 1}` : 'שאלה חדשה'}
                          </Typography>
                          <Box>
                            {selectedIdx !== null && (
                              <Tooltip title="שכפל שאלה">
                                <IconButton onClick={handleDuplicate} sx={{ mr: 1 }}>
                                  <DuplicateIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Button 
                              variant="contained" 
                              color="primary"
                              startIcon={isRtl ? <SaveIcon /> : null}
                              endIcon={!isRtl ? <SaveIcon /> : null}
                              onClick={handleSaveQuestion}
                            >
                              שמור שאלה
                            </Button>
                          </Box>
                        </Box>
                        
                        <TextField
                          label="טקסט השאלה"
                          multiline
                          rows={3}
                          fullWidth
                          value={editForm.text}
                          onChange={(e) => handleFormChange('text', e.target.value)}
                          placeholder="הזן את טקסט השאלה כאן..."
                          variant="outlined"
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="subtitle1">
                            אפשרויות תשובה
                          </Typography>
                          <Tooltip title="בחר את התשובה הנכונה באמצעות הרדיו בוטון">
                            <HelpIcon color="info" fontSize="small" />
                          </Tooltip>
                        </Box>
                        
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <FormControl component="fieldset" fullWidth>
                            <RadioGroup
                              value={editForm.correctAnswer}
                              onChange={(e) => handleFormChange('correctAnswer', Number(e.target.value))}
                            >
                              {editForm.options.map((option, index) => (
                                <Box 
                                  key={index} 
                                  sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: editForm.correctAnswer === index ? 'rgba(46, 125, 50, 0.1)' : 'transparent'
                                  }}
                                >
                                  <FormControlLabel
                                    value={index}
                                    control={<Radio color={editForm.correctAnswer === index ? "success" : "primary"} />}
                                    sx={{ flex: 1 }}
                                    label={
                                      <TextField
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`אפשרות ${index + 1}`}
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                      />
                                    }
                                  />
                                  <IconButton
                                    onClick={() => handleRemoveOption(index)}
                                    disabled={editForm.options.length <= 2}
                                    color="error"
                                    size="small"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          
                          <Button
                            startIcon={isRtl ? <AddIcon /> : null}
                            endIcon={!isRtl ? <AddIcon /> : null}
                            onClick={handleAddOption}
                            sx={{ mt: 1 }}
                            variant="outlined"
                            size="small"
                          >
                            הוסף אפשרות
                          </Button>
                        </Paper>

                        <TextField
                          label="הסבר (אופציונלי)"
                          multiline
                          rows={2}
                          fullWidth
                          value={editForm.explanation}
                          onChange={(e) => handleFormChange('explanation', e.target.value)}
                          placeholder="הסבר שיוצג למשתמש לאחר המענה על השאלה"
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      // לשונית תצוגה מקדימה
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
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              size="small" 
                              label={`${idx + 1}`} 
                              color="primary" 
                              sx={{ mr: 1, minWidth: '30px' }} 
                            />
                            <Typography noWrap>
                              {q.text.substring(0, 40) + (q.text.length > 40 ? '...' : '')}
                            </Typography>
                          </Box>
                        }
                        secondary={`${q.options.length} אפשרויות`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="העבר למעלה">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => { e.stopPropagation(); handleMove(idx, -1); }} 
                            disabled={idx === 0}
                            size="small"
                          >
                            <ArrowUpIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="העבר למטה">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => { e.stopPropagation(); handleMove(idx, 1); }} 
                            disabled={idx === questions.length-1}
                            size="small"
                          >
                            <ArrowDownIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחק שאלה">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  
                  {questions.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      אין שאלות במבחן. לחץ על "הוסף שאלה" כדי להתחיל.
                    </Alert>
                  )}
                </List>
              </Paper>
            </Box>
          </Container>
        </Layout>
      </div>
    </CacheProvider>
  );
}
