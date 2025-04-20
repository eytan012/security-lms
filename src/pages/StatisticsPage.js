import { useEffect, useState } from 'react';

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import GridOnIcon from '@mui/icons-material/GridOn';
import SvgIcon from '@mui/material/SvgIcon';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

function StatisticsPage() {

  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // פונקציה להורדת הנתונים כקובץ CSV
  const exportToExcel = () => {
    console.log('exportToExcel function called');
    console.log('stats:', stats);
    
    if (!stats) {
      console.error('אין נתונים סטטיסטיים זמינים');
      alert('אין נתונים סטטיסטיים זמינים להורדה');
      return;
    }
    
    try {
      // יצירת נתוני הסיכום
      const summaryData = [
        ['סיכום כללי'],
        ['זמן שהושקע (דקות)', stats.totalTimeSpent || 0],
        ['ציון ממוצע', stats.averageScore || 0],
        ['לומדות שהושלמו', `${stats.completedBlocks || 0} מתוך ${stats.totalBlocks || 0}`],
        [''],
        ['התקדמות'],
        ['הושלמו', stats.completedBlocks || 0],
        ['בתהליך', stats.inProgressBlocks || 0],
        ['זמינים', (stats.totalBlocks || 0) - (stats.completedBlocks || 0) - (stats.inProgressBlocks || 0)],
        [''],
        ['ציונים לפי לומדה']
      ];
      
      // בדיקה אם יש נתוני לומדות
      if (stats.blockStatistics && Object.keys(stats.blockStatistics).length > 0) {
        // הוספת נתוני הציונים לפי לומדה
        Object.entries(stats.blockStatistics).forEach(([blockId, block]) => {
          // שימוש בשם הלומדה אם זמין, אחרת שימוש ב-ID
          const blockName = stats.blockNameMap && stats.blockNameMap[blockId] ? stats.blockNameMap[blockId] : `לומדה ${blockId}`;
          summaryData.push([blockName, block.bestScore]);
        });
      } else {
        summaryData.push(['אין נתוני ציונים זמינים ללומדות']);
      }
      
      console.log('summaryData:', summaryData);
      
      // המרה לפורמט CSV
      let csvContent = summaryData.map(row => row.join(',')).join('\n');
      
      // הוספת BOM כדי שהעברית תוצג נכון באקסל
      const BOM = '\uFEFF';
      csvContent = BOM + csvContent;
      
      console.log('Creating and downloading file...');
      
      // יצירת קובץ והורדתו
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `סטטיסטיקות_${user?.name || user?.id || 'משתמש'}_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // שחרור משאבים
      URL.revokeObjectURL(url);
      
      console.log('File download initiated');
    } catch (error) {
      console.error('שגיאה בייצוא הנתונים:', error);
      alert('אירעה שגיאה בייצוא הנתונים: ' + error.message);
    }
  };

  // פונקציה לרענון הנתונים
  const fetchStatistics = async () => {
      try {
        console.log('Fetching statistics for user:', user.id);
        setLoading(true);
        
        // קבלת כל הלומדות
        const blocksRef = collection(db, 'blocks');
        const blocksQuery = query(blocksRef, orderBy('order'));
        const blocksSnapshot = await getDocs(blocksQuery);
        const totalBlocks = blocksSnapshot.size;
        const blocks = blocksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // יצירת מיפוי מ-ID לשם הלומדה
        const blockNameMap = {};
        blocks.forEach(block => {
          blockNameMap[block.id] = block.title || `לומדה ${block.id}`;
        });
        
        // קבלת התקדמות המשתמש
        const progressRef = collection(db, 'progress');
        const progressQuery = query(progressRef, where('userId', '==', user.id));
        const progressSnapshot = await getDocs(progressQuery);
        
        // קבלת תוצאות המבחנים
        const quizResultsRef = collection(db, 'quizResults');
        const quizResultsQuery = query(quizResultsRef, where('userId', '==', user.id));
        const quizResultsSnapshot = await getDocs(quizResultsQuery);
        const quizResults = quizResultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const progressDocs = progressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // חישוב לומדות שהושלמו ובתהליך
        let completedBlocks = 0;
        let inProgressBlocks = 0;
        let totalTimeSpent = 0;
        let totalScore = 0;
        let scoreCount = 0;
        
        // מבנה נתונים לסטטיסטיקות לפי לומדה
        const blockStatistics = {};
        
        // עיבוד נתוני ההתקדמות
        progressDocs.forEach(progress => {
          if (progress.completed) {
            completedBlocks++;
          } else if (progress.started) {
            inProgressBlocks++;
          }
          
          // חישוב זמן שהושקע
          if (progress.timeSpent) {
            totalTimeSpent += progress.timeSpent;
          }
        });
        
        // עיבוד תוצאות המבחנים
        quizResults.forEach(result => {
          // חישוב ציונים
          if (result.score !== undefined && result.score !== null) {
            totalScore += result.score;
            scoreCount++;
            
            // בדיקה אם כבר יש סטטיסטיקה לבלוק זה
            if (!blockStatistics[result.blockId] || result.score > blockStatistics[result.blockId].bestScore) {
              // הוספה או עדכון הסטטיסטיקות לפי לומדה
              blockStatistics[result.blockId] = {
                bestScore: result.score,
                attempts: result.attempts || 1,
                timeSpent: result.timeSpent || 0,
                completedAt: result.completedAt ? new Date(result.completedAt.toDate()) : new Date()
              };
            }
          }
        });
        
        // חישוב ציון ממוצע
        const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
        
        // וידוא שמספר הבלוקים הכולל אינו קטן מסכום הבלוקים המושלמים והבלוקים בתהליך
        const adjustedTotalBlocks = Math.max(totalBlocks, completedBlocks + inProgressBlocks);
        
        // יצירת אובייקט הסטטיסטיקות המלא
        const calculatedStats = {
          totalTimeSpent: Math.round(totalTimeSpent / 60), // המרה לדקות
          averageScore,
          completedBlocks,
          inProgressBlocks,
          totalBlocks: adjustedTotalBlocks, // שימוש במספר הבלוקים המתוקן
          blockStatistics,
          blockNameMap // הוספת מיפוי השמות
        };
        
        console.log('Calculated statistics:', calculatedStats);
        setStats(calculatedStats);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // יצירת נתוני ברירת מחדל במקרה של שגיאה
        const defaultStats = {
          totalTimeSpent: 0,
          averageScore: 0,
          completedBlocks: 0,
          inProgressBlocks: 0,
          totalBlocks: 0,
          blockStatistics: {}
        };
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
  };

  // טעינת נתונים בעת טעינת הדף
  useEffect(() => {
    fetchStatistics();
    
    // הוספת מאזין לאירוע התמקדות כדי לרענן את הנתונים כשחוזרים לדף
    const handleFocus = () => {
      console.log('Page focused, refreshing statistics...');
      fetchStatistics();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // ניקוי המאזין בעת פריקת הקומפוננטה
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Layout>
        <Container>
          <LinearProgress />
        </Container>
      </Layout>
    );
  }

  // Prepare data for the completion chart
  const completionData = {
    labels: ['הושלמו', 'בתהליך', 'זמינים'],
    datasets: [
      {
        data: [
          stats?.completedBlocks || 0,
          stats?.inProgressBlocks || 0,
          Math.max(0, (stats?.totalBlocks || 0) - (stats?.completedBlocks || 0) - (stats?.inProgressBlocks || 0))
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the scores chart
  const scoresData = {
    labels: Object.keys(stats?.blockStatistics || {}).map(blockId => 
      stats?.blockNameMap && stats?.blockNameMap[blockId] ? stats.blockNameMap[blockId] : `לומדה ${blockId}`
    ),
    datasets: [
      {
        label: 'ציון ממוצע',
        data: Object.values(stats?.blockStatistics || {}).map(block => 
          block.bestScore
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Layout>
      <Container>
        <Typography variant="h4" gutterBottom align="center">
          סטטיסטיקות
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  התקדמות
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut 
                    data={completionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  תוצאות מבחנים
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={scoresData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  סיכום כללי
                </Typography>
                <Typography variant="body1">
                  זמן שהושקע: {stats?.totalTimeSpent || 0} דקות
                </Typography>
                <Typography variant="body1">
                  ציון ממוצע: {stats?.averageScore || 0}
                </Typography>
                <Typography variant="body1">
                  לומדות שהושלמו: {stats?.completedBlocks || 0} מתוך {stats?.totalBlocks || 0}
                </Typography>
                
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    <strong>ייצוא נתונים:</strong> 
                  </Typography>
                  <Tooltip title="הורד כקובץ אקסל">
                    <Box 
                      onClick={exportToExcel}
                      sx={{ 
                        bgcolor: '#217346', // צבע של Excel
                        '&:hover': {
                          bgcolor: '#1e6e41',
                          cursor: 'pointer',
                        },
                        color: 'white',
                        borderRadius: '4px',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: 1,
                        height: 40
                      }}
                      aria-label="הורד כקובץ אקסל"
                    >
                      <GridOnIcon sx={{ mr: 1 }} />
                      <Typography variant="button" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                        Excel
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
        </Grid>
      </Container>
    </Layout>
  );
}

export default StatisticsPage;
