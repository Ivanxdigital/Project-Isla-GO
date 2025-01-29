import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, UserGroupIcon, ClockIcon, CurrencyDollarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const containerVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export default function AboutPage() {
  return (
    <motion.div 
      className="min-h-screen bg-gray-50 pt-16"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Hero Section */}
      <motion.div 
        variants={itemVariants}
        className="bg-blue-600 text-white py-24"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Connecting Travelers with Local Drivers</h1>
          <p className="text-xl">Your trusted transportation partner in Palawan</p>
        </div>
      </motion.div>

      {/* Mission Statement */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          variants={itemVariants}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-xl text-gray-600">
            To provide safe, reliable, and affordable transportation solutions while empowering local drivers 
            and delivering exceptional experiences to travelers in Palawan.
          </p>
        </motion.div>

        {/* Core Values */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {[
            { title: 'Safety First', description: 'Rigorous driver verification and vehicle inspections' },
            { title: 'Reliability', description: '24/7 support and guaranteed bookings' },
            { title: 'Community', description: 'Supporting local drivers and authentic experiences' }
          ].map((value) => (
            <motion.div 
              key={value.title}
              variants={itemVariants}
              className="text-center p-6 bg-white rounded-lg shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* For Travelers Section */}
        <motion.div 
          variants={itemVariants}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Travelers</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: <ShieldCheckIcon className="h-8 w-8 text-blue-600" />,
                  title: 'Safe & Reliable',
                  description: 'All our drivers are thoroughly vetted and vehicles regularly inspected for your safety.'
                },
                {
                  icon: <ClockIcon className="h-8 w-8 text-blue-600" />,
                  title: 'Advance Booking',
                  description: 'Plan your entire trip by booking rides in advance with guaranteed availability.'
                },
                {
                  icon: <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />,
                  title: 'Transparent Pricing',
                  description: 'Clear, upfront pricing with no hidden fees or surge charges.'
                },
                {
                  icon: <UserGroupIcon className="h-8 w-8 text-blue-600" />,
                  title: 'Local Expertise',
                  description: 'Experienced local drivers who know the best routes and can share local insights.'
                }
              ].map((feature) => (
                <motion.div 
                  key={feature.title}
                  variants={itemVariants}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* For Drivers Section */}
        <motion.div 
          variants={itemVariants}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Drivers</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="space-y-8">
              {[
                {
                  title: 'Flexible Schedule',
                  description: 'Choose your own working hours and manage your availability through our easy-to-use platform.'
                },
                {
                  title: 'Steady Income',
                  description: 'Access to a steady stream of tourists and advance bookings ensures reliable income opportunities.'
                },
                {
                  title: 'Simple Payments',
                  description: 'Receive payments directly to your account with our secure and transparent payment system.'
                },
                {
                  title: 'Easy Onboarding',
                  description: 'Quick and straightforward registration process with comprehensive training and support.'
                }
              ].map((benefit) => (
                <motion.div 
                  key={benefit.title}
                  variants={itemVariants}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Statistics Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-blue-50 rounded-lg p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { number: '1,000+', label: 'Happy Travelers' },
              { number: '50+', label: 'Professional Drivers' },
              { number: '98%', label: 'Satisfaction Rate' }
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                variants={itemVariants}
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          variants={itemVariants}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Community</h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you're a traveler looking for reliable transportation or a driver wanting to grow your business,
            we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/" className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Book a Ride
            </a>
            <a href="/drivers" className="inline-flex justify-center items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
              Become a Driver
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}