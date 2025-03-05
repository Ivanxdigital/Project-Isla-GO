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
    <section className="relative w-screen -mx-[50vw] left-[50%] right-[50%] bg-blue-50 pb-12 sm:pb-16" id="reviews">
      <div className="pt-8 pb-8 sm:pb-12">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block mb-3">
              <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto mb-3"></div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 relative">
                What Our <span className="text-blue-600">Customers</span> Say
              </h2>
              <div className="h-1.5 w-12 bg-blue-600 rounded-full mx-auto mt-3"></div>
            </div>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from travelers who have experienced our services across Palawan
            </p>
          </div>

          {/* Reviews Display */}
          <div className="mb-4 sm:mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={review.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden max-w-4xl mx-auto border border-gray-100"
              >
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-1/3 p-6 sm:p-8 flex flex-col items-center bg-gradient-to-br from-blue-50 to-white">
                    <div className="relative mb-3 sm:mb-4">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-1.5">
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">{review.name}</div>
                      <div className="text-blue-600 text-sm sm:text-base">{review.location}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3 bg-white p-6 sm:p-8 md:p-10 flex items-center">
                    <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-700 italic">
                      <span className="text-blue-200 text-4xl sm:text-6xl font-serif leading-none inline-block mr-2">"</span>
                      {review.text}
                    </blockquote>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}