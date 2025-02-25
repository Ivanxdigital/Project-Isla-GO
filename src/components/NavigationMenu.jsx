import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useAdminAuth } from '../contexts/AdminAuthContext.jsx';
import { supabase } from '../utils/supabase.ts';
import { toast } from 'react-hot-toast';
import { useDriverAuth } from '../contexts/DriverAuthContext.jsx';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isHovered, setIsHovered] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, role, loading: adminLoading } = useAdminAuth();
  const { isDriver, driverStatus } = useDriverAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check if current page is an admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Reset hover state when switching pages
  useEffect(() => {
    setIsHovered(false);
  }, [location.pathname]);

  // Add this debug log
  console.log('Navigation Menu Driver State:', { isDriver, driverStatus });

  // Debug log for auth status
  useEffect(() => {
    if (!adminLoading) {
      console.log('Auth Status:', {
        userId: user?.id,
        userRole: role,
        isAdmin: isAdmin,
        loading: adminLoading,
        isSigningOut
      });
    }
  }, [user, role, isAdmin, adminLoading, isSigningOut]);

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
                >
                  Your Profile
                </Link>

                <Link
                  to="/manage-bookings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                >
                  Manage Bookings
                </Link>

                {!adminLoading && isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
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
                      <>
                        <Link
                          to="/driver/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                        >
                          Driver Dashboard
                        </Link>
                        <Link
                          to="/driver/trips"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                        >
                          My Trips
                        </Link>
                        <Link
                          to="/driver/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                        >
                          Driver Profile
                        </Link>
                        <Link
                          to="/driver/availability"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-ai-50 transition-colors duration-150"
                        >
                          Manage Availability
                        </Link>
                      </>
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
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ai-600 hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500 transition-all duration-200"
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
  };

  useEffect(() => {
    // Add debug log for driver status
    console.log('Driver Status:', { isDriver, driverStatus });
  }, [isDriver, driverStatus]);

  // Add visibility class based on admin page and hover state
  const navVisibilityClass = isAdminPage
    ? `transform transition-all duration-300 ${
        isHovered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`
    : '';

  return (
    <>
      {/* Update hover detection area - always visible at top of screen */}
      {isAdminPage && (
        <div
          className="fixed top-0 left-0 w-full h-12 z-[99]"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}
      
      <AnimatePresence mode="wait">
        <motion.nav
          initial={false}
          animate={{ 
            y: isAdminPage && !isHovered ? -100 : 0,
            opacity: isAdminPage && !isHovered ? 0 : 1
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="fixed top-0 inset-x-0 mx-auto w-[95%] max-w-7xl bg-gray-900/75 backdrop-blur-xl rounded-b-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-800/50 z-[100]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => isAdminPage && setIsHovered(false)}
        >
          <style>{keyframes}</style>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo section */}
              <div className="flex items-center flex-shrink-0">
                <div className="transition-transform duration-300 hover:scale-105" 
                     style={{ animation: 'float 3s ease-in-out infinite' }}>
                  <Link to="/" className="flex items-center space-x-2">
                    <span style={gradientTextStyle} className="text-xl md:text-2xl font-extrabold tracking-tight">
                      IslaGO
                    </span>
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400 animate-pulse" viewBox="0 0 24 24" fill="none">
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
                      className={`relative text-gray-300 hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group hover:bg-gray-800/50 ${
                        item.className || ''
                      }`}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile menu button - better touch target */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 focus:outline-none transition-all duration-200 mr-2"
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
                    className="absolute top-[calc(100%+0.75rem)] left-2 right-2 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-800 shadow-xl md:hidden overflow-hidden"
                  >
                    <div className="py-3 space-y-1.5">
                      {menuItems.map((item) => (
                        <MobileMenuItem
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={item.className}
                        >
                          {item.name}
                        </MobileMenuItem>
                      ))}
                      
                      {!user ? (
                        <div className="px-3 pt-2 pb-3 space-y-3 mt-2 border-t border-gray-800">
                          <MobileMenuItem
                            to="/login"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Sign In
                          </MobileMenuItem>
                          <Link
                            to="/register"
                            onClick={() => setIsMenuOpen(false)}
                            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-lg text-[15px] font-medium transition-all duration-200"
                          >
                            Register
                          </Link>
                        </div>
                      ) : (
                        <div className="border-t border-gray-800 mt-2 pt-2">
                          <div className="px-4 py-3 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-emerald-400 p-0.5">
                              <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                                {profile?.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg 
                                    className="w-full h-full text-gray-400 p-1.5" 
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[15px] font-medium text-gray-200">
                                {profile?.full_name || 'User'}
                              </p>
                            </div>
                          </div>

                          <div className="px-3 py-2 space-y-1.5">
                            <MobileMenuItem
                              to="/profile"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Your Profile
                            </MobileMenuItem>
                            <MobileMenuItem
                              to="/manage-bookings"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Manage Bookings
                            </MobileMenuItem>
                            
                            {!adminLoading && isAdmin && (
                              <MobileMenuItem
                                to="/admin/dashboard"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                Admin Dashboard
                              </MobileMenuItem>
                            )}

                            {isDriver && (
                              <>
                                {driverStatus === 'pending' && (
                                  <MobileMenuItem
                                    to="/driver/pending"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    <span className="flex items-center text-yellow-400">
                                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                                      </svg>
                                      Application Pending
                                    </span>
                                  </MobileMenuItem>
                                )}
                                {driverStatus === 'active' && (
                                  <>
                                    <MobileMenuItem
                                      to="/driver/dashboard"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      Driver Dashboard
                                    </MobileMenuItem>
                                    <MobileMenuItem
                                      to="/driver/trips"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      My Trips
                                    </MobileMenuItem>
                                    <MobileMenuItem
                                      to="/driver/profile"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      Driver Profile
                                    </MobileMenuItem>
                                    <MobileMenuItem
                                      to="/driver/availability"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      Manage Availability
                                    </MobileMenuItem>
                                  </>
                                )}
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                setIsMenuOpen(false);
                                handleSignOut(e);
                              }}
                              disabled={isSigningOut || adminLoading}
                              className="w-full text-left block px-4 py-3.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors duration-150 text-[15px] font-normal"
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
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-emerald-400 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg 
                                  className="w-full h-full text-gray-400 p-1.5" 
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
                          <div className="bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-lg ring-1 ring-gray-700 py-1">
                            <div className="px-4 py-2 border-b border-gray-800">
                              <p className="text-sm font-medium text-gray-200">
                                {profile?.full_name || 'User'}
                              </p>
                            </div>
                            
                            <Link
                              to="/profile"
                              onClick={handleMenuItemClick}
                              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                            >
                              Your Profile
                            </Link>

                            <Link
                              to="/manage-bookings"
                              onClick={handleMenuItemClick}
                              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                            >
                              Manage Bookings
                            </Link>

                            {!adminLoading && isAdmin && (
                              <Link
                                to="/admin/dashboard"
                                onClick={handleMenuItemClick}
                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
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
                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
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
                                  <>
                                    <Link
                                      to="/driver/dashboard"
                                      onClick={handleMenuItemClick}
                                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                                    >
                                      Driver Dashboard
                                    </Link>
                                    <Link
                                      to="/driver/trips"
                                      onClick={handleMenuItemClick}
                                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                                    >
                                      My Trips
                                    </Link>
                                    <Link
                                      to="/driver/profile"
                                      onClick={handleMenuItemClick}
                                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                                    >
                                      Driver Profile
                                    </Link>
                                    <Link
                                      to="/driver/availability"
                                      onClick={handleMenuItemClick}
                                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
                                    >
                                      Manage Availability
                                    </Link>
                                  </>
                                )}
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                handleMenuItemClick();
                                handleSignOut(e);
                              }}
                              disabled={isSigningOut || adminLoading}
                              className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors duration-150"
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
                        className="text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-800"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-emerald-500/20 transform hover:-translate-y-0.5"
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