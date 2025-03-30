import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import Layout from '../components/Layout';
import DashboardStats from '../components/admin/DashboardStats';
import BlockManagement from '../components/admin/BlockManagement';
import UserManagement from '../components/UserManagement';
import DepartmentManagement from '../components/DepartmentManagement';

// TabPanel component for handling tab content
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function AdminPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <LinearProgress />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ניהול מערכת
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {`ברוך הבא, ${user?.displayName}`}
          </Typography>
        </Box>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<DashboardIcon />} label="לוח בקרה" />
            <Tab icon={<PeopleIcon />} label="ניהול משתמשים" />
            <Tab icon={<BusinessIcon />} label="ניהול מחלקות" />
            <Tab icon={<BookIcon />} label="ניהול תוכן" />
          </Tabs>

          {/* Dashboard Tab */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              סטטיסטיקות כלליות
            </Typography>
            <DashboardStats />
          </TabPanel>

          {/* Users Management Tab */}
          <TabPanel value={activeTab} index={1}>
            <UserManagement />
          </TabPanel>

          {/* Departments Management Tab */}
          <TabPanel value={activeTab} index={2}>
            <DepartmentManagement />
          </TabPanel>

          {/* Content Management Tab */}
          <TabPanel value={activeTab} index={3}>
            <BlockManagement />
          </TabPanel>
        </Paper>
      </Container>
    </Layout>
  );
}

export default AdminPage;
