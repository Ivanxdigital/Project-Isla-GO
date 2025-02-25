import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  TruckIcon,
  MapIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
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

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 px-3 py-6 flex flex-col">
      {/* Logo/Brand */}
      <div className="px-3 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          <span className="text-ai-600">Isla</span>GO
        </h2>
        <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
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
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'text-ai-600 bg-ai-50'
                      : 'text-gray-700 hover:text-ai-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 transition-colors ${
                      isActive ? 'text-ai-600' : 'text-gray-400 group-hover:text-ai-600'
                    }`}
                  />
                  {name}
                  {/* Active indicator */}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ai-600"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section - can add user profile, logout, etc. here */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500">
            &copy; 2025 IslaGO Admin
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;