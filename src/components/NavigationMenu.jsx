import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAdminAuth } from '../contexts/AdminAuthContext.jsx';
import { supabase } from '../utils/supabase.ts';
import { toast } from 'react-hot-toast';
import { useDriverAuth } from '../contexts/DriverAuthContext.jsx';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriverSidebar } from '../contexts/DriverSidebarContext.jsx';

// Add this function at the top of the file, after the imports
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Update mobile menu items styling
const MobileMenuItem = ({ to, onClick, children, className }) => (
  <Link
    to={to}
    className={`block px-4 py-3.5 text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-[15px] font-normal ${className}`}
    onClick={onClick}
  >
    {children}
  </Link>
);

export default function NavigationMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, role, loading: adminLoading } = useAdminAuth();
  const { isDriver, driverStatus } = useDriverAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toggleSidebar } = useDriverSidebar();

  // Check if current page is an admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Helper function to scroll to the top of the page - enhanced with more forceful scrolling
  const scrollToTop = () => {
    // More aggressive scroll approach - try multiple methods
    window.scrollTo(0, 0);
    
    // Also try the smooth version as backup
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      
      // For stubborn cases, try scrolling the document element and body
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 10);
  };

  // Function to handle navigation - close menus and scroll to top
  const handleNavigation = (closeMenu = true) => {
    if (closeMenu) {
      setIsMenuOpen(false);
      setIsProfileDropdownOpen(false);
    }
    
    // Schedule the scroll for after the navigation has occurred
    setTimeout(scrollToTop, 100);
  };

  // Use a more forceful approach to handle route changes
  useEffect(() => {
    // Scroll to top when location changes, with a slight delay to ensure rendering is complete
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      console.log('User detected, fetching profile...'); // Debug log
      fetchProfile();
    } else {
      console.log('No user found'); // Debug log
    }
  }, [user, lastUpdate]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user?.id); // Debug log
      
      if (!user) {
        console.log('No user found, skipping profile fetch');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Profile data received:', data); // Debug log
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = () => {
    setLastUpdate(Date.now());
  };

  if (typeof window !== 'undefined') {
    window.refreshNavProfile = refreshProfile;
  }

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { 
      name: 'Become a Driver', 
      path: user ? '/driver/register' : '/driver/before-register',
      className: 'text-ai-800 hover:text-ai-900 font-medium'
    }
  ];

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      setIsMenuOpen(false);
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

  const AuthButtons = () => (
    user ? (
      <div className="flex items-center space-x-4 ml-8">
        <div className="relative">
          <div 
            id="profile-avatar"
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 ring-2 ring-ai-600/10 transition-all duration-200 hover:ring-ai-600">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg 
                  className="w-full h-full text-gray-300" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                </svg>
              )}
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <Transition
              show={isProfileDropdownOpen}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 scale-95 -translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition-all duration-200 ease-in"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 -translate-y-2"
              className="absolute right-0 w-48 mt-2 z-50"
            >
              <div 
                id="profile-dropdown"
                className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 backdrop-blur-sm"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'User'}
                  </p>
                </div>
                
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                  onClick={() => handleNavigation()}
                >
                  Your Profile
                </Link>

                <Link
                  to="/manage-bookings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                  onClick={() => handleNavigation()}
                >
                  Manage Bookings
                </Link>

                {!adminLoading && isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                    onClick={() => handleNavigation()}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {isDriver && (
                  <>
                    {driverStatus === 'pending' && (
                      <Link
                        to="/driver/pending"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                        onClick={() => handleNavigation()}
                      >
                        <span className="text-sm text-yellow-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                          </svg>
                          Application Pending
                        </span>
                      </Link>
                    )}
                    {driverStatus === 'active' && (
                      <Link
                        to="/driver/dashboard"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsProfileDropdownOpen(false);
                          
                          // Create a fade-out effect before navigation
                          const mainContent = document.querySelector('main');
                          if (mainContent) {
                            // Add transition class
                            mainContent.style.transition = 'opacity 0.4s ease-out';
                            mainContent.style.opacity = '0';
                            
                            // Wait for animation to complete before toggling sidebar and navigating
                            setTimeout(() => {
                              toggleSidebar();
                              navigate('/driver/dashboard');
                              
                              // Fade back in after a short delay
                              setTimeout(() => {
                                mainContent.style.opacity = '1';
                                scrollToTop();
                              }, 100);
                            }, 300);
                          } else {
                            // Fallback if main content not found
                            toggleSidebar();
                            navigate('/driver/dashboard');
                            scrollToTop();
                          }
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                      >
                        Driver Dashboard
                      </Link>
                    )}
                  </>
                )}

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut || adminLoading}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex items-center space-x-4 ml-8">
        <Link
          to="/login"
          className="text-ai-800 hover:text-ai-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-ai-100"
          onClick={() => handleNavigation(false)}
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ai-600 hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500 transition-all duration-200"
          onClick={() => handleNavigation(false)}
        >
          Register
        </Link>
      </div>
    )
  );

  // Update click outside handler with better event management
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Get references to elements
      const dropdown = document.getElementById('profile-dropdown');
      const avatar = document.getElementById('profile-avatar');
      
      // Check if click is outside both dropdown and avatar
      const isClickOutside = dropdown && avatar && 
        !dropdown.contains(event.target) && 
        !avatar.contains(event.target);

      // Close dropdown if click is outside
      if (isProfileDropdownOpen && isClickOutside) {
        setIsProfileDropdownOpen(false);
      }
    };

    // Add click and touch events for better mobile support
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileDropdownOpen]); // Only depend on isProfileDropdownOpen

  // Add a separate handler for toggling the dropdown
  const handleAvatarClick = (event) => {
    event.stopPropagation(); // Prevent event from bubbling
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Update the gradient text style for better contrast on dark theme
  const gradientTextStyle = {
    backgroundImage: 'linear-gradient(to right, #60A5FA, #34D399, #60A5FA)',
    backgroundSize: '200% auto',
    color: 'transparent',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    animation: 'gradient 3s linear infinite',
  };

  const keyframes = `
    @keyframes gradient {
      0% { background-position: 0% center; }
      100% { background-position: -200% center; }
    }
    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(79, 172, 254, 0.5); }
      50% { box-shadow: 0 0 20px rgba(79, 172, 254, 0.8); }
      100% { box-shadow: 0 0 5px rgba(79, 172, 254, 0.5); }
    }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
      100% { transform: translateY(0px); }
    }
  `;

  // Add a handler for menu item clicks
  const handleMenuItemClick = () => {
    setIsProfileDropdownOpen(false);
    scrollToTop();
  };

  useEffect(() => {
    // Add debug log for driver status
    console.log('Driver Status:', { isDriver, driverStatus });
  }, [isDriver, driverStatus]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.nav
          initial={false}
          animate={{ 
            y: 0,
            opacity: 1
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="fixed top-0 inset-x-0 w-full bg-gradient-to-r from-indigo-900/90 via-violet-900/90 to-purple-900/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(79,70,229,0.2)] border-b border-indigo-800/50 z-[100] flex-shrink-0 h-16"
        >
          <style>{keyframes}</style>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo section */}
              <div className="flex items-center flex-shrink-0">
                <div className="transition-transform duration-300 hover:scale-105" 
                     style={{ animation: 'float 3s ease-in-out infinite' }}>
                  <Link to="/" className="flex items-center space-x-2" onClick={() => handleNavigation(false)}>
                    <span style={{
                      backgroundImage: 'linear-gradient(to right, #818CF8, #C084FC, #818CF8)',
                      backgroundSize: '200% auto',
                      color: 'transparent',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      animation: 'gradient 3s linear infinite',
                    }} className="text-xl md:text-2xl font-extrabold tracking-tight">
                      IslaGO
                    </span>
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-violet-400 animate-pulse" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Desktop menu */}
              <div className="hidden md:flex md:items-center md:justify-center flex-1 px-8">
                <div className="flex space-x-8">
                  {menuItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`relative text-indigo-100 hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group hover:bg-white/10 ${
                        item.className || ''
                      }`}
                      onClick={() => handleNavigation(false)}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile menu button - better touch target */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 focus:outline-none transition-all duration-200 mr-2"
                  aria-label="Menu"
                >
                  {isMenuOpen ? (
                    <XMarkIcon className="h-7 w-7" />
                  ) : (
                    <Bars3Icon className="h-7 w-7" />
                  )}
                </button>
              </div>

              {/* Add Mobile Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[calc(100%+0.75rem)] left-2 right-2 bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-lg rounded-2xl border border-indigo-700/50 shadow-xl md:hidden overflow-hidden"
                  >
                    <div className="py-3 space-y-1.5">
                      {menuItems.map((item) => (
                        <MobileMenuItem
                          key={item.name}
                          to={item.path}
                          onClick={() => handleNavigation()}
                          className={item.className}
                        >
                          {item.name}
                        </MobileMenuItem>
                      ))}
                      
                      {!user ? (
                        <div className="px-3 pt-2 pb-3 space-y-3 mt-2 border-t border-indigo-700/50">
                          <MobileMenuItem
                            to="/login"
                            onClick={() => handleNavigation()}
                          >
                            Sign In
                          </MobileMenuItem>
                          <Link
                            to="/register"
                            onClick={() => handleNavigation()}
                            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-[15px] font-medium transition-all duration-200"
                          >
                            Register
                          </Link>
                        </div>
                      ) : (
                        <div className="border-t border-indigo-700/50 mt-2 pt-2">
                          <div className="px-4 py-3 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-400 p-0.5">
                              <div className="w-full h-full rounded-full overflow-hidden bg-indigo-950">
                                {profile?.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg 
                                    className="w-full h-full text-indigo-200 p-1.5" 
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[15px] font-medium text-indigo-100">
                                {profile?.full_name || 'User'}
                              </p>
                            </div>
                          </div>

                          <div className="px-3 py-2 space-y-1.5">
                            <MobileMenuItem
                              to="/profile"
                              onClick={() => handleNavigation()}
                            >
                              Your Profile
                            </MobileMenuItem>
                            <MobileMenuItem
                              to="/manage-bookings"
                              onClick={() => handleNavigation()}
                            >
                              Manage Bookings
                            </MobileMenuItem>
                            
                            {!adminLoading && isAdmin && (
                              <MobileMenuItem
                                to="/admin/dashboard"
                                onClick={() => handleNavigation()}
                              >
                                Admin Dashboard
                              </MobileMenuItem>
                            )}

                            {isDriver && (
                              <>
                                {driverStatus === 'pending' && (
                                  <MobileMenuItem
                                    to="/driver/pending"
                                    onClick={() => handleNavigation()}
                                  >
                                    <span className="flex items-center text-amber-300">
                                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                                      </svg>
                                      Application Pending
                                    </span>
                                  </MobileMenuItem>
                                )}
                                {driverStatus === 'active' && (
                                  <MobileMenuItem
                                    to="/driver/dashboard"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setIsMenuOpen(false);
                                      toggleSidebar();
                                      navigate('/driver/dashboard');
                                      scrollToTop();
                                    }}
                                  >
                                    Driver Dashboard
                                  </MobileMenuItem>
                                )}
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                setIsMenuOpen(false);
                                handleSignOut(e);
                              }}
                              disabled={isSigningOut || adminLoading}
                              className="w-full text-left block px-4 py-3.5 text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg transition-colors duration-150 text-[15px] font-normal"
                            >
                              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop auth buttons - hidden on mobile */}
              <div className="hidden md:flex md:items-center">
                <div className="flex items-center space-x-4 ml-8">
                  {user ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div 
                          id="profile-avatar"
                          className="flex items-center space-x-3 cursor-pointer transition-transform duration-200 hover:scale-105"
                          onClick={handleAvatarClick}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-400 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-indigo-950">
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg 
                                  className="w-full h-full text-indigo-200 p-1.5" 
                                  fill="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Profile Dropdown with enhanced styling */}
                        <Transition
                          show={isProfileDropdownOpen}
                          enter="transition-all duration-300 ease-out"
                          enterFrom="transform opacity-0 scale-95 -translate-y-2"
                          enterTo="transform opacity-100 scale-100 translate-y-0"
                          leave="transition-all duration-200 ease-in"
                          leaveFrom="transform opacity-100 scale-100 translate-y-0"
                          leaveTo="transform opacity-0 scale-95 -translate-y-2"
                          className="absolute right-0 w-48 mt-2 z-50"
                        >
                          <div className="bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-lg shadow-lg ring-1 ring-indigo-700/50 py-1">
                            <div className="px-4 py-2 border-b border-indigo-700/50">
                              <p className="text-sm font-medium text-indigo-100">
                                {profile?.full_name || 'User'}
                              </p>
                            </div>
                            
                            <Link
                              to="/profile"
                              onClick={handleMenuItemClick}
                              className="block px-4 py-2 text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors duration-150"
                            >
                              Your Profile
                            </Link>

                            <Link
                              to="/manage-bookings"
                              onClick={handleMenuItemClick}
                              className="block px-4 py-2 text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors duration-150"
                            >
                              Manage Bookings
                            </Link>

                            {!adminLoading && isAdmin && (
                              <Link
                                to="/admin/dashboard"
                                onClick={handleMenuItemClick}
                                className="block px-4 py-2 text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors duration-150"
                              >
                                Admin Dashboard
                              </Link>
                            )}

                            {isDriver && (
                              <>
                                {driverStatus === 'pending' && (
                                  <Link
                                    to="/driver/pending"
                                    onClick={handleMenuItemClick}
                                    className="block px-4 py-2 text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors duration-150"
                                  >
                                    <span className="text-sm text-amber-300 flex items-center">
                                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                                      </svg>
                                      Application Pending
                                    </span>
                                  </Link>
                                )}
                                {driverStatus === 'active' && (
                                  <Link
                                    to="/driver/dashboard"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setIsProfileDropdownOpen(false);
                                      
                                      // Create a fade-out effect before navigation
                                      const mainContent = document.querySelector('main');
                                      if (mainContent) {
                                        // Add transition class
                                        mainContent.style.transition = 'opacity 0.4s ease-out';
                                        mainContent.style.opacity = '0';
                                        
                                        // Wait for animation to complete before toggling sidebar and navigating
                                        setTimeout(() => {
                                          toggleSidebar();
                                          navigate('/driver/dashboard');
                                          scrollToTop();
                                          
                                          // Fade back in after a short delay
                                          setTimeout(() => {
                                            mainContent.style.opacity = '1';
                                          }, 100);
                                        }, 300);
                                      } else {
                                        // Fallback if main content not found
                                        toggleSidebar();
                                        navigate('/driver/dashboard');
                                        scrollToTop();
                                      }
                                    }}
                                    className="block px-4 py-2 text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors duration-150"
                                  >
                                    Driver Dashboard
                                  </Link>
                                )}
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                handleMenuItemClick();
                                handleSignOut(e);
                              }}
                              disabled={isSigningOut || adminLoading}
                              className="w-full text-left block px-4 py-2 text-sm text-red-300 hover:bg-red-900/20 hover:text-red-200 transition-colors duration-150"
                            >
                              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                            </button>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="text-indigo-200 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-white/10"
                        onClick={() => handleNavigation(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-purple-500/20 transform hover:-translate-y-0.5"
                        onClick={() => handleNavigation(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.nav>
      </AnimatePresence>
    </>
  );
}