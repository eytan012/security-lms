import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

// סטטיסטיקה בודדת עם אייקון
const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Box
          sx={{
            backgroundColor: `${color}22`,
            borderRadius: '50%',
            p: 1,
            mr: 2
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" align="center">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // משתמשים
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const totalUsers = usersSnap.size;
        
        // משתמשים לפי תפקיד
        const studentsSnap = await getDocs(query(usersRef, where('role', '==', 'student')));
        const studentCount = studentsSnap.size;
        const adminCount = totalUsers - studentCount;



        // בלוקי למידה והתקדמות
        const blocksRef = collection(db, 'blocks');
        const blocksSnap = await getDocs(blocksRef);
        const totalBlocks = blocksSnap.size;

        // התקדמות
        const progressRef = collection(db, 'progress');
        const progressSnap = await getDocs(progressRef);
        const completedBlocks = progressSnap.docs.filter(doc => doc.data().completed).length;
        const completionRate = totalBlocks > 0 
          ? Math.round((completedBlocks / (totalBlocks * studentCount)) * 100)
          : 0;

        setStats({
          totalUsers,
          studentCount,
          adminCount,

          totalBlocks,
          completionRate
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('אירעה שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="סה״כ משתמשים"
          value={stats?.totalUsers || 0}
          icon={<PeopleIcon sx={{ color: '#2196f3' }} />}
          color="#2196f3"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="בלוקי למידה"
          value={stats?.totalBlocks || 0}
          icon={<AssignmentIcon sx={{ color: '#ff9800' }} />}
          color="#ff9800"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="אחוז השלמה"
          value={`${stats?.completionRate || 0}%`}
          icon={<TimelineIcon sx={{ color: '#9c27b0' }} />}
          color="#9c27b0"
        />
      </Grid>
    </Grid>
  );
}

export default DashboardStats;
