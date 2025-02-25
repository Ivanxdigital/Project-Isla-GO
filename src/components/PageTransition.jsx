import React from 'react';
import { motion } from 'framer-motion';

// Different transition styles you can use
const transitions = {
  fade: {
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  slide: {
    variants: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    transition: {
      duration: 0.4,
      ease: "anticipate"
    }
  },
  scale: {
    variants: {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.04 }
    },
    transition: {
      duration: 0.3,
      ease: "backOut"
    }
  },
  slideUp: {
    variants: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export default function PageTransition({ children, type = "slideUp" }) {
  const { variants, transition } = transitions[type] || transitions.fade;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}