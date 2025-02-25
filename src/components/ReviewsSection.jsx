import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';

const reviews = [
  {
    id: 1,
    name: "Sarah Chen",
    location: "Singapore",
    rating: 5,
    text: "The booking process was so smooth, and our driver was incredibly professional. Made our Palawan trip stress-free!",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
  },
  {
    id: 2,
    name: "Michael Park",
    location: "South Korea",
    rating: 5,
    text: "Excellent service! The van was clean and comfortable, and the driver knew all the best routes.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
  },
  {
    id: 3,
    name: "Emma Wilson",
    location: "Australia",
    rating: 5,
    text: "Couldn't have asked for a better transfer service. The online booking system is very user-friendly!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80"
  }
];

export default function ReviewsSection() {
  const { t } = useTranslation();
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const review = reviews[currentReview];

  return (
    <section className="py-20 bg-blue-50" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our <span className="text-blue-600">Customers</span> Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from travelers who have experienced our services across Palawan
          </p>
        </div>

        {/* Reviews Display */}
        <div className="mb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 p-8 flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-1.5">
                      <StarIcon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{review.name}</div>
                    <div className="text-blue-600">{review.location}</div>
                  </div>
                </div>
                
                <div className="md:w-2/3 bg-white p-8 md:p-10 flex items-center">
                  <blockquote className="text-xl md:text-2xl text-gray-700 italic">
                    <span className="text-blue-200 text-6xl font-serif leading-none inline-block mr-2">"</span>
                    {review.text}
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Review Navigation */}
        <div className="flex justify-center space-x-3 mb-16">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentReview(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentReview === index ? 'bg-blue-600 w-10' : 'bg-gray-300 w-3'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Additional Reviews CTA */}
        <div className="text-center">
          <a 
            href="#" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
          >
            See More Reviews
          </a>
        </div>
      </div>
    </section>
  );
}