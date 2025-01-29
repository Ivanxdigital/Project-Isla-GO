import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import './HeroSection.css';

function WaveShape({
  className,
  delay = 0,
  width = 400,
  height = 200,
  rotate = 0,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -50,
        rotate: rotate - 10,
      }}
      animate={{
        opacity: 0.15,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2,
        delay,
        ease: "easeOut",
      }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <svg
          viewBox="0 0 200 100"
          className="w-full h-full fill-current text-white/20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50 Q50 0 100 50 T200 50 V100 H0Z"
            className="animate-wave"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function HeroSection() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => [
      "Hassle Free",
      "Up-front Pricing",
      "Show your QR code & Board",
      "Book in Advance"
    ],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      {/* Geometric Patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Overlay with slight darkness */}
        <div className="absolute inset-0 bg-black/20 z-10" />
        
        {/* Elegant shapes */}
        <WaveShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%] bg-gradient-to-r from-blue-500/20"
        />
        <WaveShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%] bg-gradient-to-l from-purple-500/20"
        />
        <WaveShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%] bg-gradient-to-b from-pink-500/20"
        />
        <WaveShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%] bg-gradient-to-r from-blue-400/20"
        />
        <WaveShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%] bg-gradient-to-l from-purple-400/20"
        />

        {/* Keep the rotating ring */}
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.1, rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] border-[40px] border-white/10 rounded-full transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-8">
          {/* Animated Text Above */}
          <div className="h-8 md:h-10 relative mb-4">
            {titles.map((title, index) => (
              <motion.p
                key={index}
                className="absolute w-full text-lg md:text-2xl font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={
                  titleNumber === index
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: titleNumber > index ? -20 : 20 }
                }
                transition={{ type: "spring", stiffness: 50 }}
              >
                <span className="animate-gradient bg-gradient-to-r from-teal-300 via-purple-400 to-orange-300 text-transparent bg-clip-text bg-size-200 bg-pos-0">
                  {title}
                </span>
              </motion.p>
            ))}
          </div>

          {/* Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-white"
          >
            Your{' '}
            <span className="animate-gradient bg-gradient-to-r from-teal-300 via-purple-400 to-orange-300 text-transparent bg-clip-text bg-size-200 bg-pos-0">
              Journey
            </span>
            {' '}Begins Here
          </motion.h1>

          {/* Main Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto"
          >
            Experience the perfect blend of comfort and adventure with our premium transportation services.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
          >
            <a
              href="#booking"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 transition-colors duration-200"
            >
              Book Now
              <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="/about"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}