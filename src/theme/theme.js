import { createTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import createCache from '@emotion/cache';

// Create rtl cache
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

export const theme = createTheme({
  palette: {
    background: {
      default: '#f8f9fa', // רקע בהיר לכל האפליקציה
      paper: '#ffffff', // רקע לבן לכרטיסים ואלמנטים
    },
    primary: {
      main: '#1976d2', // צבע עיקרי
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0', // צבע משני
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#212121', // טקסט כהה לניגודיות טובה
      secondary: '#757575',
    },
    divider: 'rgba(0, 0, 0, 0.12)', // צבע מפריד ברור יותר
  },
  typography: {
    fontFamily: [
      'Rubik',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          body: {
            backgroundColor: '#f8f9fa',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)', // צל עדין יותר לאלמנטים
          border: '1px solid rgba(0, 0, 0, 0.08)', // גבול דק לאלמנטים
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.08)', // צל עדין לכרטיסים
          border: '1px solid rgba(0, 0, 0, 0.08)', // גבול דק לכרטיסים
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // צל עדין יותר לסרגל העליון
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.12)', // גבול ברור יותר לתפריט הצדדי
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // ללא המרה לאותיות גדולות בכפתורים
        },
      },
    },
  },
});
