import React from 'react';
import { motion } from 'framer-motion';

/**
 * קומפוננטת מעבר עמודים עם אנימציה
 * מקבלת children ומציגה אותם עם אנימציית מעבר
 */
const PageTransition = ({ children }) => {
  // הגדרת האנימציות
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    in: {
      opacity: 1,
      y: 0
    },
    out: {
      opacity: 0,
      y: -20
    }
  };

  // הגדרת מעברים
  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
