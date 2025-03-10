import React from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, ClockIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const destinations = [
  {
    name: 'El Nido',
    description: 'Gateway to stunning limestone cliffs and pristine beaches',
    image: 'https://elnidoresorts.com/wp-content/uploads/2023/10/ENR_Sustainability-Banner-1024x686.jpeg'
  },
  {
    name: 'Underground River',
    description: 'UNESCO World Heritage site and natural wonder',
    image: 'https://gttp.images.tshiftcdn.com/220778/x/0/puerto-princesa-underground-river.jpg?ar=1.91%3A1&w=1200&fit=crop'
  },
  {
    name: 'San Vicente',
    description: 'Home to the Long Beach and emerging tourist destination',
    image: 'https://gttp.images.tshiftcdn.com/225503/x/0/san-vicente-palawan-travel-guide-home-of-the-longest-beach-in-the-philippines-9.jpg?auto=compress%2Cformat&ch=Width%2CDPR&dpr=1&ixlib=php-3.3.0&w=883'
  },
  {
    name: 'Port Balabac',
    description: 'Access point to the pristine islands of Balabac',
    image: 'https://palawanperfection.com/wp-content/uploads/2021/07/Patawan-Island-1024x758.jpg'
  }
];

const benefits = [
  {
    icon: <MapPinIcon className="h-6 w-6" />,
    title: 'Strategic Routes',
    description: "Direct access to Palawan's most sought-after destinations"
  },
  {
    icon: <ClockIcon className="h-6 w-6" />,
    title: 'Flexible Scheduling',
    description: 'Choose from multiple daily departure times'
  },
  {
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    title: 'Safe & Reliable',
    description: 'Professional drivers and well-maintained vehicles'
  },
  {
    icon: <UserGroupIcon className="h-6 w-6" />,
    title: 'Travel Options',
    description: 'Private or shared van services to suit your needs'
  }
];

export default function WhyIslaGO() {
  return (
    <section className="pb-16 bg-white" id="why-islago" style={{ marginTop: '-1px' }}>
      {/* Gradient overlay at the top of the section */}
      <div className="h-16 w-full bg-gradient-to-b from-blue-50 to-white"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-3">
            <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto mb-3"></div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 relative"
            >
              Why Choose <span className="text-blue-600">IslaGO</span>
            </motion.h2>
            <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto mt-3"></div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Your reliable partner for exploring Palawan's most beautiful destinations
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group overflow-hidden rounded-xl"
            >
              <div className="aspect-w-3 aspect-h-4">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-semibold text-white mb-1">{destination.name}</h3>
                    <p className="text-sm text-gray-200">{destination.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}