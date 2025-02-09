import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  CheckCircleIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon,
  MapIcon,
  StarIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Reusable animated section component
const AnimatedSection = ({ children, className }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stats card component with hover effect
const StatCard = ({ number, label, icon: Icon }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ scale: 1.05 }}
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <div>
        <div className="text-3xl font-bold text-blue-600">{number}</div>
        <div className="text-gray-600 font-medium">{label}</div>
      </div>
    </div>
  </motion.div>
);

// Feature card component
const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  </motion.div>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Parallax effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[60vh] md:h-[80vh] bg-blue-600 overflow-hidden"
      >
        {/* Background image with responsive sizing */}
        <motion.div
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          {/* Desktop image */}
          <img
            src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?fm=jpg&q=60&w=3000"
            alt="Palawan landscape"
            className="hidden md:block w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          {/* Mobile image - same image but smaller size */}
          <img
            src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?fm=jpg&q=60&w=800"
            alt="Palawan landscape"
            className="md:hidden w-full h-full object-cover object-[center_center]"
            loading="eager"
            fetchPriority="high"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-blue-900/70" />
        </motion.div>

        {/* Hero content */}
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Connecting Travelers with Local Drivers
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow">
              Your trusted transportation partner in Palawan
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Mission Statement */}
      <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div variants={itemVariants} className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            To provide safe, reliable, and affordable transportation solutions while empowering local drivers 
            and delivering exceptional experiences to travelers in Palawan.
          </p>
        </motion.div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: ShieldCheckIcon,
              title: 'Safety First',
              description: 'Rigorous driver verification and vehicle inspections ensure your safety.'
            },
            { 
              icon: ClockIcon,
              title: 'Reliability',
              description: '24/7 support and guaranteed bookings for peace of mind.'
            },
            { 
              icon: UserGroupIcon,
              title: 'Community',
              description: 'Supporting local drivers and authentic experiences in Palawan.'
            }
          ].map((value) => (
            <FeatureCard key={value.title} {...value} />
          ))}
        </div>
      </AnimatedSection>

      {/* Statistics Section with enhanced design */}
      <AnimatedSection className="bg-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12"
          >
            Our Impact
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: '1,000+', label: 'Happy Travelers', icon: UserGroupIcon },
              { number: '50+', label: 'Professional Drivers', icon: TruckIcon },
              { number: '98%', label: 'Satisfaction Rate', icon: StarIcon }
            ].map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Call to Action */}
      <AnimatedSection className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Join Our Community
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Whether you're a traveler looking for reliable transportation or a driver wanting to grow your business,
              we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Book a Ride
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/drivers"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-300"
              >
                Become a Driver
              </motion.a>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </div>
  );
}