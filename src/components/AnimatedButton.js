import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';

/**
 * קומפוננטת כפתור עם אנימציה
 * מקבלת את אותם props כמו Button של Material UI
 * ומוסיפה אנימציות אינטראקציה
 */
const AnimatedButton = ({ children, ...props }) => {
  // יצירת גרסה של Button עם אנימציה
  const MotionButton = motion(Button);
  
  return (
    <MotionButton
      {...props}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
    >
      {children}
    </MotionButton>
  );
};

export default AnimatedButton;
