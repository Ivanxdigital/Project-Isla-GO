import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  CalendarIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  DocumentCheckIcon,
  IdentificationIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function BeforeRegister() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Benefits data
  const benefits = [
    {
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      title: "Competitive Earnings",
      description: "Earn competitive rates with transparent payment structure and weekly payouts."
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: "Flexible Schedule",
      description: "Work when you want. Set your own hours and availability to fit your lifestyle."
    },
    {
      icon: <CalendarIcon className="h-6 w-6" />,
      title: "Regular Bookings",
      description: "Access to a steady stream of passengers traveling between popular destinations."
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      title: "Safety First",
      description: "Our platform prioritizes driver and passenger safety with verified profiles."
    },
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      title: "Community Support",
      description: "Join a community of professional drivers with dedicated support staff."
    }
  ];

  // Requirements data
  const requirements = [
    {
      icon: <IdentificationIcon className="h-5 w-5" />,
      text: "Valid Professional Driver's License"
    },
    {
      icon: <TruckIcon className="h-5 w-5" />,
      text: "Registered vehicle (van) in good condition"
    },
    {
      icon: <ShieldCheckIcon className="h-5 w-5" />,
      text: "Clean driving record and background check"
    },
    {
      icon: <DocumentCheckIcon className="h-5 w-5" />,
      text: "Complete vehicle insurance and registration"
    }
  ];

  // Steps data
  const steps = [
    {
      number: "01",
      title: "Create an Account",
      description: "Sign up with your basic information to get started."
    },
    {
      number: "02",
      title: "Complete Application",
      description: "Fill out the driver application with your personal and vehicle details."
    },
    {
      number: "03",
      title: "Document Verification",
      description: "Upload required documents for verification by our team."
    },
    {
      number: "04",
      title: "Get Approved",
      description: "Once approved, you'll gain access to the driver dashboard."
    },
    {
      number: "05",
      title: "Start Earning",
      description: "Set your availability and start accepting trip requests."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-teal-50 opacity-50"></div>
        <div className="absolute right-0 top-0 -mr-96 -mt-48 hidden lg:block">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100 to-teal-100 opacity-20 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Drive with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">IslaGO</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Join our network of professional drivers and earn on your own schedule while providing essential transportation services across the islands.
            </p>
            <div className="mt-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="#get-started" className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                  Get Started Today
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </motion.div>
            </div>
          </motion.div>
          
          <div className="mt-20 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-gradient-to-r from-gray-50 via-white to-gray-50 text-lg font-medium text-gray-900">
                Why Drive with IslaGO?
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all duration-200"
                variants={itemVariants}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Driver Requirements</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              To ensure quality service and safety for all passengers, we have the following requirements for our drivers.
            </p>
          </div>
          
          <motion.div 
            className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <ul className="space-y-4">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 text-green-500">
                    <CheckCircleIcon />
                  </div>
                  <div className="ml-3 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                      {requirement.icon}
                    </div>
                    <span className="text-gray-700">{requirement.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Becoming an IslaGO driver is simple. Follow these steps to get started.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>
            <motion.div 
              className="relative space-y-12"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {steps.map((step, index) => (
                <motion.div 
                  key={index} 
                  className="relative flex items-start"
                  variants={itemVariants}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${index % 2 === 0 ? 'bg-blue-500' : 'bg-teal-500'} text-white font-bold z-10 shadow-md`}>
                    {index + 1}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">What Our Drivers Say</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Hear from drivers who have joined the IslaGO platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">Juan Dela Cruz</h4>
                  <p className="text-sm text-gray-500">Driver since 2022</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "IslaGO has given me the flexibility to earn while still having time for my family. The platform is easy to use and the support team is always helpful."
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">Maria Santos</h4>
                  <p className="text-sm text-gray-500">Driver since 2021</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "I was looking for a way to utilize my van and earn extra income. IslaGO provided the perfect opportunity with consistent bookings and fair compensation."
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">Carlo Reyes</h4>
                  <p className="text-sm text-gray-500">Driver since 2023</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "The application process was straightforward and the team was very responsive. Now I enjoy meeting new people while earning a good income on my own schedule."
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-20 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
            <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
              Join our team of professional drivers today and start earning on your own terms.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                >
                  Create New Account
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 border border-white text-base font-medium rounded-full shadow-lg text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                >
                  Sign in to Existing Account
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about becoming an IslaGO driver.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">How much can I earn as an IslaGO driver?</h3>
              <p className="mt-2 text-gray-600">
                Earnings vary based on the number of trips you complete, the distance traveled, and the service type. Many of our full-time drivers report earning between ₱20,000 to ₱40,000 per month.
              </p>
            </div>
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">What type of vehicle do I need?</h3>
              <p className="mt-2 text-gray-600">
                IslaGO primarily works with van drivers. Your vehicle should be a passenger van in good condition, typically with 10-15 seats, and must meet our safety and comfort standards.
              </p>
            </div>
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">How long does the application process take?</h3>
              <p className="mt-2 text-gray-600">
                The application process typically takes 3-5 business days, depending on how quickly you can provide the required documentation and the volume of applications we're processing.
              </p>
            </div>
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">Do I need special insurance?</h3>
              <p className="mt-2 text-gray-600">
                Yes, you'll need commercial vehicle insurance that covers passenger transport. We can provide guidance on obtaining the appropriate insurance if needed.
              </p>
            </div>
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">How do I get paid?</h3>
              <p className="mt-2 text-gray-600">
                Payments are processed weekly and deposited directly to your registered bank account. You can track all your earnings through the driver dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 