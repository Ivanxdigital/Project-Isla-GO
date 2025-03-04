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
  const { isOpen, isMobile, closeSidebar, pageHeight, openSidebar } = useDriverSidebar();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Log isOpen state changes
  useEffect(() => {
    console.log('DriverSidebar: isOpen state changed to', isOpen);
  }, [isOpen]);
  
  // Ensure sidebar is open on driver routes for desktop
  useEffect(() => {
    const isDriverRoute = location.pathname.startsWith('/driver');
    if (isDriverRoute && !isMobile) {
      console.log('DriverSidebar: Driver route detected on desktop, ensuring sidebar is open');
      openSidebar();
    }
  }, [location.pathname, isMobile, openSidebar]);
  
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
    <AnimatePresence mode="wait">
      {isOpen ? (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={(e) => {
              // Only close if clicking directly on the backdrop
              if (e.target === e.currentTarget) {
                closeSidebar();
              }
            }}
          />
          
          {/* Sidebar */}
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            id="driver-sidebar"
            className={`
              fixed md:sticky top-0 left-0 z-50
              ${isExpanded ? 'w-64' : 'w-16 md:w-16'}
              bg-white border-r border-gray-200
              flex flex-col transition-all duration-300 ease-in-out 
              md:group md:hover:w-64 overflow-y-auto shadow-md
              md:flex
            `}
            style={{ 
              height: pageHeight || '100vh', 
              minHeight: '100vh',
              overflowY: 'auto'
            }}
            onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
            onMouseLeave={() => window.innerWidth >= 768 && setIsExpanded(false)}
          >
            {/* Mobile header with close button */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-ai-600">Driver Menu</h2>
              <button
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={closeSidebar}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            {/* Logo/Brand - visible on desktop */}
            <div className={`hidden md:block px-4 py-6 mb-6 overflow-hidden whitespace-nowrap border-b border-gray-100 ${!isExpanded && 'md:group-hover:block'}`}>
              <h2 className="text-xl font-bold text-ai-600">Driver Portal</h2>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 px-2">
              <div className="mb-4">
                <h3 className={`text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 ${!isExpanded && 'sr-only'}`}>
                  Main Menu
                </h3>
                <ul className="mt-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`
                            flex items-center px-3 py-3 rounded-lg transition-colors duration-200
                            ${isActive 
                              ? 'bg-ai-50 text-ai-600 font-medium' 
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                          `}
                          onClick={(e) => {
                            // Prevent event propagation to the backdrop
                            e.stopPropagation();
                            // Only close the sidebar on mobile if explicitly clicking the close button
                            // This allows menu items to be clicked without closing the sidebar
                          }}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-ai-600' : 'text-gray-500'}`} />
                          <span className={`ml-3 ${!isExpanded ? 'hidden md:group-hover:inline' : ''}`}>
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
            
            {/* Sign Out Button */}
            <div className="mt-auto px-2 pb-6 pt-2 border-t border-gray-100">
              <h3 className={`text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-4 pb-2 ${!isExpanded && 'sr-only'}`}>
                Account
              </h3>
              <button
                onClick={(e) => {
                  // Prevent event propagation to the backdrop
                  e.stopPropagation();
                  handleSignOut();
                }}
                disabled={isSigningOut}
                className={`
                  flex items-center w-full px-3 py-3 text-left rounded-lg
                  text-red-600 hover:bg-red-50 transition-colors duration-200
                `}
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span className={`ml-3 ${!isExpanded ? 'hidden md:group-hover:inline' : ''}`}>
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default DriverSidebar; 