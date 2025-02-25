import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  TruckIcon,
  MapIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { path: '/admin/dashboard', name: 'Dashboard', icon: HomeIcon },
  { path: '/admin/bookings', name: 'Bookings', icon: CalendarIcon },
  { path: '/admin/drivers', name: 'Drivers', icon: UserGroupIcon },
  { path: '/admin/vehicles', name: 'Vehicles', icon: TruckIcon },
  { path: '/admin/routes', name: 'Routes', icon: MapIcon },
  { path: '/admin/driver-applications', name: 'Applications', icon: ClipboardDocumentCheckIcon },
  { path: '/admin/settings', name: 'Settings', icon: Cog6ToothIcon },
];

const Sidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
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

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-ai-600 transition-colors duration-200"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-30"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`
          fixed md:static inset-y-0 left-0 z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isExpanded ? 'w-64' : 'w-16 md:w-16'}
          min-h-screen bg-white border-r border-gray-200 px-3 py-6 
          flex flex-col transition-all duration-300 ease-in-out 
          md:group md:hover:w-64 relative
        `}
        onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
        onMouseLeave={() => window.innerWidth >= 768 && setIsExpanded(false)}
      >
        {/* Logo/Brand */}
        <div className={`px-3 mb-8 overflow-hidden whitespace-nowrap ${!isExpanded && 'md:group-hover:block'}`}>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            {isExpanded || isMobileMenuOpen ? (
              <>
                <span className="text-ai-600">Isla</span>GO
              </>
            ) : (
              <span className="text-ai-600">I</span>
            )}
          </h2>
          <p className={`text-sm text-gray-500 mt-1 transition-opacity duration-300 
            ${(!isExpanded && !isMobileMenuOpen) ? 'opacity-0 md:group-hover:opacity-100' : 'opacity-100'}`}
          >
            Admin Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {menuItems.map(({ path, name, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group/item relative ${
                      isActive
                        ? 'text-ai-600 bg-ai-50'
                        : 'text-gray-700 hover:text-ai-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${(!isExpanded && !isMobileMenuOpen) ? 'mr-0' : 'mr-3'} transition-all ${
                        isActive ? 'text-ai-600' : 'text-gray-400 group-hover/item:text-ai-600'
                      }`}
                    />
                    <span className={`whitespace-nowrap transition-all duration-300 ${
                      (!isExpanded && !isMobileMenuOpen) ? 'opacity-0 md:group-hover:opacity-100 absolute left-12' : 'opacity-100'
                    }`}>
                      {name}
                    </span>
                    {/* Active indicator */}
                    {isActive && (
                      <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-ai-600 transition-all duration-300 ${
                        (!isExpanded && !isMobileMenuOpen) ? 'opacity-0 md:group-hover:opacity-100' : 'opacity-100'
                      }`}></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className={`px-3 py-2 transition-all duration-300 ${
            (!isExpanded && !isMobileMenuOpen) ? 'opacity-0 md:group-hover:opacity-100' : 'opacity-100'
          }`}>
            <p className="text-xs text-gray-500 whitespace-nowrap">
              &copy; 2025 IslaGO Admin
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;