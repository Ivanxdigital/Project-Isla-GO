import React from 'react';
import { motion } from 'framer-motion';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

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

export default function ContactPage() {
  return (
    <motion.div 
      className="bg-gray-50 min-h-screen"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Main contact section with negative margin to remove space */}
      <div className="bg-blue-600 -mt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-16">
          <motion.div 
            variants={itemVariants}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Contact Us</h1>
            <p className="mt-4 text-lg text-blue-100">
              We're here to help and answer any question you might have.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-12 bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Contact Information */}
              <div className="bg-blue-600 p-6 text-white">
                <h3 className="text-xl font-semibold">Contact Information</h3>
                <p className="mt-2 text-blue-100">
                  Get in touch with us for any questions or concerns.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-6 w-6 text-blue-200" />
                    <a href="mailto:support@islago.com" className="ml-4 text-white hover:text-blue-100">
                      support@islago.com
                    </a>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-6 w-6 text-blue-200" />
                    <span className="ml-4">+63 (945) 123-4567</span>
                  </div>
                </div>

                <div className="mt-12">
                  <h4 className="text-lg font-medium">Office Hours</h4>
                  <p className="mt-2 text-blue-100">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 9:00 AM - 1:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="p-6 bg-white">
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}