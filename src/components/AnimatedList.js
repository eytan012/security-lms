import React from 'react';
import { motion } from 'framer-motion';
import { List, ListItem } from '@mui/material';

/**
 * קומפוננטת רשימה עם אנימציה
 * מציגה את פריטי הרשימה בזה אחר זה עם אנימציית כניסה
 */
const AnimatedList = ({ children, staggerDelay = 0.05, ...props }) => {
  // אנימציה למיכל הרשימה
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  // אנימציה לכל פריט ברשימה
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  // עטיפת כל ילד בקומפוננטת אנימציה
  const wrappedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    
    return (
      <motion.div variants={itemVariants}>
        {child}
      </motion.div>
    );
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <List {...props}>
        {wrappedChildren}
      </List>
    </motion.div>
  );
};

/**
 * פריט רשימה עם אנימציה
 * ניתן להשתמש בו בנפרד אם לא משתמשים ב-AnimatedList
 */
export const AnimatedListItem = ({ children, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.02)' }}
    >
      <ListItem {...props}>
        {children}
      </ListItem>
    </motion.div>
  );
};

export default AnimatedList;
