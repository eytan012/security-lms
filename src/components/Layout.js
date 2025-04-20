import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../context/UserContext';

function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user } = useUser();
  const theme = useTheme();

  const menuItems = [
    // Add admin page for admin users
    ...(user?.role === 'admin' ? [{ text: 'ניהול', icon: <BarChartIcon />, path: '/admin' }] : []),
    { text: 'פרופיל', icon: <HomeIcon />, path: '/progress' },
    { text: 'לומדה', icon: <SchoolIcon />, path: '/blocks' },
    { text: 'סטטיסטיקות', icon: <BarChartIcon />, path: '/statistics' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }} dir="rtl">
      <AppBar position="fixed">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Right side - Menu icon */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color="inherit" 
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          {/* Center - Title (aligned to right) */}
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              pr: 2
            }}
          >
            לומדת אבטחת מידע
          </Typography>
          
          {/* Empty box for spacing */}
          <Box sx={{ width: 48 }} />
        </Toolbar>
      </AppBar>

      <Drawer

        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            bgcolor: '#f5f5f5',
            p: 2
          },
        }}
      >
        <Box sx={{ width: '100%' }} role="presentation">
          <List sx={{ pt: 2 }}>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ mb: 1 }}
              >
                <Box
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    p: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s',
                    flexDirection: 'row-reverse',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      '& .MuiListItemIcon-root, & .MuiTypography-root': {
                        color: 'white'
                      }
                    },
                  }}
                >
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiTypography-root': {
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'text.primary',
                        // textAlign: 'right'
                      }
                    }}
                  />
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: 'primary.main',
                      marginRight: 'auto'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Box>
              </ListItem>
            ))}
            <ListItem
              disablePadding
              sx={{ mt: 2 }}
            >
              <Box
                onClick={handleLogout}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  p: 2,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: 'error.light',
                  flexDirection: 'row-reverse',
                  // justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: 'error.main',
                    '& .MuiListItemIcon-root, & .MuiTypography-root': {
                      color: 'white'
                    }
                  },
                }}
              >
                <ListItemText
                  primary="התנתקות"
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'white',
                    }
                  }}
                />
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: 'white',
                    marginRight: 'auto'
                  }}
                >
                  <ExitToAppIcon />
                </ListItemIcon>
              </Box>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;