import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,

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
  Chip,
  Stack,
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
import QuizEditor from './QuizEditor';

function BlockManagement() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  
  // מצב עורך המבחנים במסך מלא
  const [quizEditorOpen, setQuizEditorOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    questions: []
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

  // פתיחת דף עריכה/יצירה
  const handleEditBlock = (block = null) => {
    if (block) {
      // עריכת בלוק קיים
      navigate(`/admin/block/${block.id}`);
    } else {
      // יצירת בלוק חדש
      navigate('/admin/block/new');
    }
  };

  // מחיקת בלוק
  const handleDeleteBlock = async (blockId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק בלוק זה?')) {
      try {
        await deleteDoc(doc(db, 'blocks', blockId));
        console.log('Block deleted:', blockId);
        // רענון הנתונים
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
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleEditBlock()}
        >
          הוסף בלוק חדש
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
                    <IconButton onClick={() => handleEditBlock(block)}>
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

      {/* עורך מבחנים במסך מלא */}
      {quizEditorOpen && (
        <QuizEditor
          initialQuestions={[]}
          blockId={null}
          blockTitle={'מבחן חדש'}
          onSave={(updatedQuestions) => {
            setFormData({ ...formData, questions: updatedQuestions });
            setQuizEditorOpen(false);
            setOpenDialog(true);
          }}
        />
      )}
    </Box>
  );
}

export default BlockManagement;
