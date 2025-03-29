import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ListItemText
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
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'right', paddingRight: 2 }}>
            לומדת אבטחת מידע
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
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
                    '&:hover': {
                      bgcolor: 'primary.light',
                      '& .MuiListItemIcon-root, & .MuiTypography-root': {
                        color: 'white'
                      }
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: 'primary.main',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiTypography-root': {
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'text.primary'
                      }
                    }}
                  />
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
                  '&:hover': {
                    bgcolor: 'error.main',
                    '& .MuiListItemIcon-root, & .MuiTypography-root': {
                      color: 'white'
                    }
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: 'white'
                  }}
                >
                  <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText
                  primary="התנתקות"
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'white'
                    }
                  }}
                />
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
