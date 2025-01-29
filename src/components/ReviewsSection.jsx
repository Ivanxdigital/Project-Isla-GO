import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentReview((prev) => (prev + 1) % reviews.length);
        setIsVisible(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const review = reviews[currentReview];

  return (
    <div className="py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            What Our Customers Say
          </h2>
          
          <div className="relative">
            <div
              className={`transition-opacity duration-500 ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex flex-col items-center space-y-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                
                <div className="flex space-x-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-lg text-gray-600 text-center">
                  "{review.text}"
                </blockquote>
                
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{review.name}</div>
                  <div className="text-sm text-gray-600">{review.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}