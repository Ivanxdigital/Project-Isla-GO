import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDriverAuth } from '../../contexts/DriverAuthContext';

export default function DriverRoute({ children }) {
  const { user } = useAuth();
  const { isDriver, driverStatus, loading } = useDriverAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isDriver) {
    return <Navigate to="/driver/before-register" replace />;
  }

  // If they're a driver but their application is pending
  if (driverStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-lg">
          <h2 className="text-2xl font-bold mb-4">Application Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your driver application is currently being reviewed by our team. 
            This process typically takes 2-3 business days.
          </p>
          <p className="text-gray-500 text-sm">
            You'll receive an email notification once your application has been processed.
          </p>
        </div>
      </div>
    );
  }

  if (driverStatus !== 'approved' && driverStatus !== 'active') {
    return <Navigate to="/driver/before-register" replace />;
  }

  return children;
} 