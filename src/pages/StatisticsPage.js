import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Box
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function StatisticsPage() {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const statsRef = doc(collection(db, 'statistics'), user.id);
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          setStats(statsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user.id]);

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
    labels: ['הושלם', 'בתהליך', 'טרם התחיל'],
    datasets: [
      {
        data: [
          stats?.completedBlocks || 0,
          stats?.inProgressBlocks || 0,
          (stats?.totalBlocks || 0) - (stats?.completedBlocks || 0) - (stats?.inProgressBlocks || 0)
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
      `בלוק ${blockId}`
    ),
    datasets: [
      {
        label: 'ציון הטוב ביותר',
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
                  התקדמות כללית
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
                  ציונים לפי בלוק
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
                  סיכום
                </Typography>
                <Typography variant="body1">
                  זמן כולל בלומדה: {stats?.totalTimeSpent || 0} דקות
                </Typography>
                <Typography variant="body1">
                  ממוצע ציונים: {stats?.averageScore || 0}
                </Typography>
                <Typography variant="body1">
                  בלוקים שהושלמו: {stats?.completedBlocks || 0} מתוך {stats?.totalBlocks || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}

export default StatisticsPage;
