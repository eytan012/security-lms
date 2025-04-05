import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@mui/material';

/**
 * קומפוננטת כרטיס עם אנימציה
 * מקבלת את אותם props כמו Card של Material UI
 * ומוסיפה אנימציות כניסה והאינטראקציה
 */
const AnimatedCard = ({ children, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0px 10px 20px rgba(0,0,0,0.1)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card {...props}>
        {children}
      </Card>
    </motion.div>
  );
};

export default AnimatedCard;
