import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Create a context for language and direction
const LanguageContext = createContext();

// RTL languages
const RTL_LANGUAGES = ['he', 'ar'];

// Create a provider component
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState('rtl'); // Default direction

  // Create rtl cache
  const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  });

  // Create ltr cache
  const cacheLtr = createCache({
    key: 'muiltr',
    stylisPlugins: [prefixer],
  });

  // Create theme with direction
  const theme = createTheme({
    direction: direction,
    typography: {
      fontFamily: 'Rubik, Arial, sans-serif',
    },
  });

  // Update direction when language changes
  useEffect(() => {
    const isRtl = RTL_LANGUAGES.includes(i18n.language);
    setDirection(isRtl ? 'rtl' : 'ltr');
  }, [i18n.language]);

  // Value to be provided to consumers
  const value = {
    direction,
    isRtl: direction === 'rtl',
  };

  return (
    <LanguageContext.Provider value={value}>
      <CacheProvider value={direction === 'rtl' ? cacheRtl : cacheLtr}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </CacheProvider>
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
