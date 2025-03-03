import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriverSidebar } from '../contexts/DriverSidebarContext.jsx';

const menuItems = [
  { path: '/driver/dashboard', name: 'Dashboard', icon: HomeIcon },
  { path: '/driver/trips', name: 'My Trips', icon: CalendarIcon },
  { path: '/driver/profile', name: 'Profile', icon: UserIcon },
  { path: '/driver/availability', name: 'Availability', icon: ClockIcon },
];

const DriverSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isOpen, closeSidebar } = useDriverSidebar();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Animation variants for the sidebar
  const sidebarVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    exit: { 
      opacity: 0,
      x: -20,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('driver-sidebar');
      const toggleButton = document.getElementById('driver-sidebar-toggle');
      
      if (isMobileMenuOpen && 
          sidebar && 
          !sidebar.contains(event.target) && 
          toggleButton && 
          !toggleButton.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      localStorage.removeItem('lastBookingId');
      localStorage.removeItem('paymentSessionId');

      // Show success toast
      toast.success('Successfully logged out!', {
        duration: 4000,
        position: 'top-right',
      });

      // Redirect to homepage after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error during sign out:', error);

      // Show error toast
      toast.error('Failed to log out. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed md:static inset-y-0 left-0 z-40
              ${isExpanded ? 'w-64' : 'w-16 md:w-16'}
              min-h-screen bg-white border-r border-gray-200 px-3 py-6 
              flex flex-col transition-all duration-300 ease-in-out 
              md:group md:hover:w-64 relative pt-20
            `}
            onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
            onMouseLeave={() => window.innerWidth >= 768 && setIsExpanded(false)}
          >
            {/* Logo/Brand */}
            <div className={`px-3 mb-8 overflow-hidden whitespace-nowrap ${!isExpanded && 'md:group-hover:block'}`}>
              <h2 className="text-xl font-bold text-ai-600">Driver Portal</h2>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`
                          flex items-center px-3 py-2 rounded-lg transition-colors duration-200
                          ${isActive 
                            ? 'bg-ai-50 text-ai-600' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className={`ml-3 ${!isExpanded ? 'hidden md:group-hover:inline' : ''}`}>
                          {item.name}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            
            {/* Sign Out Button */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`
                  flex items-center w-full px-3 py-2 text-left rounded-lg
                  text-red-600 hover:bg-red-50 transition-colors duration-200
                `}
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className={`ml-3 ${!isExpanded ? 'hidden md:group-hover:inline' : ''}`}>
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DriverSidebar; 