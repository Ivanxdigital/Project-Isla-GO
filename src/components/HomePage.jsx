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

  // Add inline style to ensure proper mobile display
  const containerStyle = {
    maxWidth: '100vw',
    overflowX: 'hidden',
    width: '100%'
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="homepage"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="flex flex-col w-full overflow-hidden"
        style={containerStyle}
      >
        {/* Hero Section - Full height on desktop */}
        <motion.div 
          variants={sectionVariants}
          className="w-full h-screen"
          style={containerStyle}
        >
          <HeroSection />
        </motion.div>
        
        {/* Booking Form - Positioned below hero section */}
        <motion.div 
          variants={sectionVariants}
          id="booking" 
          className="relative bg-white w-full"
        >
          <BookingForm />
        </motion.div>
        
        <motion.div
          variants={sectionVariants}
          className="mt-0"
        >
          <WhyIslaGO />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}