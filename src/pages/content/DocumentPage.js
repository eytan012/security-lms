import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Layout from '../../components/Layout';

function DocumentPage() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const blockDoc = await getDoc(doc(db, 'blocks', blockId));
        if (blockDoc.exists()) {
          setBlock({
            id: blockDoc.id,
            ...blockDoc.data()
          });
        } else {
          console.error('Block not found');
          navigate('/blocks');
        }
      } catch (error) {
        console.error('Error fetching block:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlock();
  }, [blockId, navigate]);

  if (loading) {
    return (
      <Layout>
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!block) {
    return (
      <Layout>
        <Container>
          <Typography variant="h5" color="error">
            חומר הלימוד לא נמצא
          </Typography>
        </Container>
      </Layout>
    );
  }
  
  // בדיקת סוג הבלוק והתוכן שלו
  console.log('Block data:', block);
  
  // בדיקה אם זה בלוק מסוג document
  if (block.type !== 'document') {
    console.error('Block type is not document:', block.type);
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

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
              {/* בדיקה של מיקום התוכן - ישירות בבלוק או בתוך documentData */}
              {block.documentData?.content || block.content || 'אין תוכן זמין לתצוגה'}
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
}

export default DocumentPage;
