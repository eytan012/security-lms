import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import BlockManagement from '../components/admin/BlockManagement';
import DashboardStats from '../components/admin/DashboardStats';
import UserManagement from '../components/admin/UserManagement';
import DepartmentManagement from '../components/admin/DepartmentManagement';

function AdminPage() {
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: // לוח בקרה
        return (
          <Box sx={{ mt: 3 }}>
            <DashboardStats />
          </Box>
        );
      case 1: // ניהול משתמשים
        return (
          <Box sx={{ mt: 3 }}>
            <UserManagement />
          </Box>
        );
      case 2: // ניהול מחלקות
        return (
          <Box sx={{ mt: 3 }}>
            <DepartmentManagement />
          </Box>
        );
      case 3: // ניהול תוכן
        return (
          <Box sx={{ mt: 3 }}>
            <BlockManagement />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Container>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            ניהול מערכת
          </Typography>
          
          <Paper sx={{ mt: 3 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              aria-label="admin tabs"
            >
              <Tab icon={<DashboardIcon />} label="לוח בקרה" />
              <Tab icon={<PeopleIcon />} label="ניהול משתמשים" />
              <Tab icon={<BusinessIcon />} label="ניהול מחלקות" />
              <Tab icon={<SchoolIcon />} label="ניהול תוכן" />
            </Tabs>
          </Paper>

          {renderTabContent()}
        </Box>
      </Container>
    </Layout>
  );
}

export default AdminPage;
