import { useState, useEffect } from 'react';
import QuestionDialog from './QuestionDialog';
import SimulationEditor from './SimulationEditor';
import { phishingScenarios } from '../../data/phishingScenarios';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Autocomplete
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

function BlockManagement() {
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
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

  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  // טעינת בלוקים וחומרי לימוד
  const fetchData = async () => {
    try {
      // טעינת בלוקים
      const blocksRef = collection(db, 'blocks');
      const blocksQuery = query(blocksRef, orderBy('order'));
      const blocksSnapshot = await getDocs(blocksQuery);
      const blocksData = blocksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlocks(blocksData);


    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // פתיחת דיאלוג עריכה/יצירה
  const handleOpenDialog = (block = null) => {
    if (block) {
      setEditingBlock(block);
      setFormData({
        title: block.title,
        description: block.description || '',
        type: block.type,
        content: block.content || '',
        dependencies: block.dependencies || [],
        order: block.order,
        estimatedTime: block.estimatedTime || 30,
        questions: block.questions || [],
        simulationData: block.type === 'simulation' ? {
          type: block.simulationData?.type || 'phishing',
          scenarioId: block.simulationData?.scenarioId || '',
          difficulty: block.simulationData?.difficulty || 2,
          time_limit: block.simulationData?.time_limit || 45,
          content: block.simulationData?.content || null
        } : null
      });
    } else {
      setEditingBlock(null);
      setFormData({
        title: '',
        description: '',
        type: 'document',
        content: '',
        dependencies: [],
        order: blocks.length, // ברירת מחדל לסוף הרשימה
        estimatedTime: 30,
        questions: [],
        simulationData: null
      });
    }
    setOpenDialog(true);
  };

  // שמירת בלוק
  const handleSaveBlock = async () => {
    try {
      const blockData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        dependencies: formData.dependencies,
        order: formData.order,
        estimatedTime: formData.estimatedTime,
        updatedAt: new Date().toISOString()
      };

      // הוספת תוכן בהתאם לסוג הבלוק
      if (formData.type === 'quiz') {
        blockData.questions = formData.questions.map((q, idx) => ({
          id: `quiz-${editingBlock?.id || 'new'}-${idx}`,
          text: q.text,
          options: q.options.map((opt, optIdx) => ({
            id: `quiz-${editingBlock?.id || 'new'}-${idx}-opt-${optIdx}`,
            text: opt,
            value: optIdx
          })),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
      } else if (formData.type === 'simulation') {
        if (formData.simulationData.type === 'phishing') {
          const scenario = phishingScenarios.find(s => s.id === formData.simulationData.scenarioId);
          if (scenario) {
            blockData.simulationData = {
              type: 'phishing',
              scenarioId: scenario.id,
              content: scenario.content,
              difficulty: scenario.difficulty,
              time_limit: scenario.time_limit
            };
          }
        } else {
          blockData.simulationData = formData.simulationData;
        }
      } else {
        blockData.content = formData.content;
      }

      if (editingBlock) {
        // עדכון בלוק קיים
        await updateDoc(doc(db, 'blocks', editingBlock.id), blockData);
      } else {
        // יצירת בלוק חדש
        blockData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'blocks'), blockData);
      }

      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving block:', error);
    }
  };

  // מחיקת בלוק
  const handleDeleteBlock = async (blockId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הבלוק?')) {
      try {
        await deleteDoc(doc(db, 'blocks', blockId));
        fetchData();
      } catch (error) {
        console.error('Error deleting block:', error);
      }
    }
  };

  // שינוי סדר הבלוקים
  const handleReorderBlock = async (blockId, direction) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newBlocks = [...blocks];
    const block = newBlocks[blockIndex];
    const otherIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    if (otherIndex < 0 || otherIndex >= newBlocks.length) return;

    const otherBlock = newBlocks[otherIndex];
    const tempOrder = block.order;
    block.order = otherBlock.order;
    otherBlock.order = tempOrder;

    try {
      await updateDoc(doc(db, 'blocks', block.id), { order: block.order });
      await updateDoc(doc(db, 'blocks', otherBlock.id), { order: otherBlock.order });
      fetchData();
    } catch (error) {
      console.error('Error reordering blocks:', error);
    }
  };



  // מציאת שמות הבלוקים לפי מזהים
  const getDependencyTitles = (dependencies) => {
    return dependencies.map(depId => {
      const block = blocks.find(b => b.id === depId);
      return block ? block.title : 'לא נמצא';
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">ניהול בלוקי למידה</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          בלוק חדש
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>סדר</TableCell>
              <TableCell>כותרת</TableCell>
              <TableCell>סוג</TableCell>
              <TableCell>חומר לימוד</TableCell>
              <TableCell>שאלות</TableCell>
              <TableCell>תלויות</TableCell>
              <TableCell>זמן משוער</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((block) => (
              <TableRow key={block.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {block.order + 1}
                    <IconButton
                      size="small"
                      onClick={() => handleReorderBlock(block.id, 'up')}
                      disabled={block.order === 0}
                    >
                      <ArrowUpIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleReorderBlock(block.id, 'down')}
                      disabled={block.order === blocks.length - 1}
                    >
                      <ArrowDownIcon />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>{block.title}</TableCell>
                <TableCell>{block.type}</TableCell>
                <TableCell>
                  {block.type === 'quiz' ? '-' : (
                    <Tooltip title={block.content}>
                      <span>{block.content?.substring(0, 50)}{block.content?.length > 50 ? '...' : ''}</span>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {block.type === 'quiz' ? (
                    `${block.questions?.length || 0} שאלות`
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {getDependencyTitles(block.dependencies || []).map((title, index) => (
                      <Chip key={index} label={title} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>{block.estimatedTime} דקות</TableCell>
                <TableCell>
                  <Tooltip title="ערוך">
                    <IconButton onClick={() => handleOpenDialog(block)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="מחק">
                    <IconButton onClick={() => handleDeleteBlock(block.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBlock ? 'עריכת בלוק למידה' : 'בלוק למידה חדש'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
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
              <InputLabel>סוג</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  console.log('Selected type:', newType);
                  if (newType === 'simulation') {
                    console.log('Setting simulation data');
                    setFormData({
                      ...formData,
                      type: newType,
                      simulationData: {
                        type: 'phishing',
                        scenarioId: '',
                        difficulty: 2,
                        time_limit: 45
                      }
                    });
                  } else {
                    setFormData({
                      ...formData,
                      type: newType,
                      simulationData: null
                    });
                  }
                }}
                label="סוג"
              >
                <MenuItem value="document">מסמך</MenuItem>
                <MenuItem value="video">וידאו</MenuItem>
                <MenuItem value="quiz">בוחן</MenuItem>
                <MenuItem value="simulation">סימולציה</MenuItem>
              </Select>
            </FormControl>
            {formData.type === 'simulation' ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>סוג סימולציה</InputLabel>
                  <Select
                    value={formData.simulationData?.type || 'phishing'}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        simulationData: {
                          type: newType,
                          scenarioId: '',
                          difficulty: 2,
                          time_limit: 45
                        }
                      });
                    }}
                    label="סוג סימולציה"
                  >
                    <MenuItem value="phishing">פישינג</MenuItem>
                    <MenuItem value="password">סיסמה חזקה</MenuItem>
                  </Select>
                </FormControl>

                {(() => {
                  console.log('formData:', formData);
                  console.log('simulationData:', formData.simulationData);
                  console.log('phishingScenarios:', phishingScenarios);
                  return formData.simulationData?.type === 'phishing' && (
                    <FormControl fullWidth>
                      <InputLabel id="phishing-scenario-label">תרחיש פישינג</InputLabel>
                      <Select
                        labelId="phishing-scenario-label"
                        value={formData.simulationData?.scenarioId || ''}
                        onChange={(e) => {
                          console.log('Selected value:', e.target.value);
                          const scenario = phishingScenarios.find(s => s.id === e.target.value);
                          console.log('Found scenario:', scenario);
                          if (scenario) {
                            setFormData({
                              ...formData,
                              simulationData: {
                                ...formData.simulationData,
                                scenarioId: e.target.value,
                                content: scenario.content,
                                difficulty: scenario.difficulty,
                                time_limit: scenario.time_limit
                              }
                            });
                          }
                        }}
                        label="תרחיש פישינג"
                      >
                        {phishingScenarios.map((scenario) => {
                          console.log('Mapping scenario:', scenario);
                          return (
                            <MenuItem key={scenario.id} value={scenario.id}>
                              {scenario.content.subject}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  );
                })()
                }
              </>
            ) : formData.type !== 'quiz' ? (
              <TextField
                label="תוכן"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                fullWidth
                multiline
                rows={4}
                helperText={formData.type === 'video' ? 'הכנס קישור לסרטון' : 'הכנס את התוכן'}
              />
            ) : null
          }
            {formData.type === 'quiz' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  שאלות ({formData.questions.length})
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {formData.questions.map((question, index) => (
                    <Paper key={`question-${index}`} sx={{ p: 2, mb: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">
                          {question.text.substring(0, 50)}{question.text.length > 50 ? '...' : ''}
                        </Typography>
                        <Box>
                          <IconButton onClick={() => {
                            setEditingQuestionIndex(index);
                            setQuestionForm({
                              text: question.text,
                              options: question.options,
                              correctAnswer: question.correctAnswer,
                              explanation: question.explanation || ''
                            });
                            setQuizDialogOpen(true);
                          }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => {
                            const newQuestions = [...formData.questions];
                            newQuestions.splice(index, 1);
                            setFormData({ ...formData, questions: newQuestions });
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingQuestionIndex(-1);
                    setQuestionForm({
                      text: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      explanation: ''
                    });
                    setQuizDialogOpen(true);
                  }}
                >
                  הוסף שאלה
                </Button>
              </Box>
            )}
            <Autocomplete
              multiple
              options={blocks.filter(b => b.id !== editingBlock?.id)}
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
            />
            <TextField
              label="זמן משוער (דקות)"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button onClick={handleSaveBlock} variant="contained" color="primary">
            שמור
          </Button>
        </DialogActions>
      </Dialog>

      <QuestionDialog
        open={quizDialogOpen}
        onClose={() => setQuizDialogOpen(false)}
        question={editingQuestionIndex >= 0 ? formData.questions[editingQuestionIndex] : null}
        onSave={(questionData) => {
          const newQuestions = [...formData.questions];
          if (editingQuestionIndex >= 0) {
            newQuestions[editingQuestionIndex] = questionData;
          } else {
            newQuestions.push(questionData);
          }
          setFormData({ ...formData, questions: newQuestions });
          setQuizDialogOpen(false);
        }}
      />
    </Box>
  );
}

export default BlockManagement;
