import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
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
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../context/UserContext';

// RTL languages
const RTL_LANGUAGES = ['he', 'ar'];

function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [languageMenu, setLanguageMenu] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const { direction } = useLanguage();
  
  // Check if current language is RTL
  const isRtl = RTL_LANGUAGES.includes(i18n.language);
  
  // Language options
  const languages = [
    { code: 'he', name: t('languages.hebrew') },
    { code: 'en', name: t('languages.english') },
  ];

  const menuItems = [
    // Add admin page for admin users
    ...(user?.role === 'admin' ? [{ text: t('app.menu.admin'), icon: <BarChartIcon />, path: '/admin' }] : []),
    { text: t('app.menu.profile'), icon: <HomeIcon />, path: '/progress' },
    { text: t('app.menu.course'), icon: <SchoolIcon />, path: '/blocks' },
    { text: t('app.menu.statistics'), icon: <BarChartIcon />, path: '/statistics' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Language menu handlers
  const handleLanguageIconClick = (event) => {
    setLanguageMenu(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenu(null);
  };

  const handleLanguageSelect = (language) => {
    i18n.changeLanguage(language.code);
    handleLanguageMenuClose();
  };

  return (
    <Box sx={{ display: 'flex' }} dir={direction}>
      <AppBar position="fixed">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {isRtl ? (
            // RTL Layout (Hebrew)
            <>
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
                {t('app.title')}
              </Typography>
              
              {/* Left side - Language icon */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  color="inherit" 
                  onClick={handleLanguageIconClick}
                  sx={{ ml: 1 }}
                >
                  <LanguageIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            // LTR Layout (English)
            <>
              {/* Left side - Menu icon */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  color="inherit" 
                  onClick={() => setDrawerOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
              
              {/* Center - Title (aligned to left) */}
              <Typography 
                variant="h6" 
                sx={{ 
                  flexGrow: 1,
                  textAlign: 'left',
                  pl: 2
                }}
              >
                {t('app.title')}
              </Typography>
              
              {/* Right side - Language icon */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  color="inherit" 
                  onClick={handleLanguageIconClick}
                  sx={{ ml: 1 }}
                >
                  <LanguageIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Menu
        id="language-menu"
        anchorEl={languageMenu}
        keepMounted
        open={Boolean(languageMenu)}
        onClose={handleLanguageMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isRtl ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isRtl ? 'right' : 'left',
        }}
      >
        {languages.map((language) => (
          <MenuItem 
            key={language.code} 
            onClick={() => handleLanguageSelect(language)}
            selected={i18n.language === language.code}
          >
            {language.name}
          </MenuItem>
        ))}
      </Menu>

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
                    flexDirection: isRtl ? 'row-reverse' : 'row',
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
                        textAlign: isRtl ? 'right' : 'left'
                      }
                    }}
                  />
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: 'primary.main',
                      marginRight: isRtl ? 'auto' : 'unset',
                      marginLeft: isRtl ? 'unset' : 'auto'
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
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: 'error.main',
                    '& .MuiListItemIcon-root, & .MuiTypography-root': {
                      color: 'white'
                    }
                  },
                }}
              >
                <ListItemText
                  primary={t('app.menu.logout')}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'white',
                      textAlign: isRtl ? 'right' : 'left'
                    }
                  }}
                />
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: 'white',
                    marginRight: isRtl ? 'auto' : 'unset',
                    marginLeft: isRtl ? 'unset' : 'auto'
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
