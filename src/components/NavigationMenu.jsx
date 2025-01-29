import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';
import { useDriverAuth } from '../contexts/DriverAuthContext';
import { Menu, Transition } from '@headlessui/react';

export default function NavigationMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, role, loading: adminLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isDriver, driverStatus } = useDriverAuth();

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
              enterFrom="opacity-0 translate-y-[-20px]"
              enterTo="opacity-100 translate-y-0"
              leave="transition-all duration-200 ease-in"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-[-20px]"
              className="absolute right-0 w-48 mt-2 z-50"
            >
              <div 
                id="profile-dropdown"
                className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1"
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
                    {driverStatus === 'approved' && (
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

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen) {
        const dropdown = document.getElementById('profile-dropdown');
        const avatar = document.getElementById('profile-avatar');
        if (dropdown && avatar && 
            !dropdown.contains(event.target) && 
            !avatar.contains(event.target)) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Add these style constants at the top of your component
  const gradientTextStyle = {
    backgroundImage: 'linear-gradient(to right, #3b82f6, #10b981, #3b82f6)',
    backgroundSize: '200% auto',
    color: 'transparent',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    animation: 'gradient 3s linear infinite',
  };

  const keyframes = `
    @keyframes gradient {
      0% {
        background-position: 0% center;
      }
      100% {
        background-position: -200% center;
      }
    }
  `;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-ai-600/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <style>{keyframes}</style>
              <Link to="/" className="text-2xl font-bold">
                <span style={gradientTextStyle}>IslaGO</span>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex md:items-center md:justify-center flex-1">
              <div className="flex space-x-8">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="text-ai-800 hover:text-ai-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-ai-100"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex md:items-center">
            <AuthButtons />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-ai-800 hover:text-ai-900 hover:bg-ai-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ai-600"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {/* User Profile Section when logged in */}
          {user && (
            <div className="p-4 mb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-ai-600/10">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg 
                      className="w-full h-full text-gray-300 p-2" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                    </svg>
                  )}
                </div>
                <div className="font-medium text-gray-900">
                  {profile?.full_name || 'User'}
                </div>
              </div>
            </div>
          )}

          {/* Rest of the mobile menu items */}
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-ai-800 hover:text-ai-900 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-ai-100"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          
          {user ? (
            <>
              <Link
                to="/manage-bookings"
                className="text-ai-800 hover:text-ai-900 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-ai-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Manage Bookings
              </Link>
              {!adminLoading && isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="text-ai-800 hover:text-ai-900 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-ai-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut || adminLoading}
                className={`w-full text-left text-ai-800 hover:text-ai-900 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isSigningOut || adminLoading ? 'bg-ai-400 cursor-not-allowed' : 'bg-ai-600 hover:bg-ai-700'
                }`}
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-ai-800 hover:text-ai-900 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-ai-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-ai-600 text-white hover:bg-ai-700 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}