import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from './HeroSection.jsx';
import BookingForm from './BookingForm.jsx';
import WhyIslaGO from './WhyIslaGO.jsx';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// Animation variants for page sections
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.3
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.6
    }
  }
};

const sectionVariants = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      toast[location.state.type || 'success'](location.state.message);
    }
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="homepage"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="flex flex-col"
      >
        <motion.div 
          variants={sectionVariants}
          className="-mt-16 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
        >
          <HeroSection />
        </motion.div>
        
        <motion.div 
          variants={sectionVariants}
          id="booking" 
          className="relative bg-white w-full"
        >
          <BookingForm />
        </motion.div>
        
        <motion.div
          variants={sectionVariants}
        >
          <WhyIslaGO />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}