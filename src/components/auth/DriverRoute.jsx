import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDriverAuth } from '../../contexts/DriverAuthContext';

export default function DriverRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isDriver, driverStatus, loading: driverLoading } = useDriverAuth();
  const location = useLocation();

  // Enhanced debugging
  useEffect(() => {
    console.log('DriverRoute Detailed State:', {
      user: user?.id,
      authLoading,
      isDriver,
      driverStatus,
      driverLoading,
      path: location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [user, authLoading, isDriver, driverStatus, driverLoading, location]);

  // Always show loading while any state is loading
  if (authLoading || driverLoading || !user || driverStatus === undefined) {
    console.log('DriverRoute: Loading state...', { 
      authLoading, 
      driverLoading,
      hasUser: !!user,
      driverStatus 
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Log the status check
  console.log('DriverRoute Final Status Check:', { 
    driverStatus, 
    isDriver,
    userId: user.id 
  });

  // Handle different driver statuses
  switch (driverStatus) {
    case 'active':
      console.log('DriverRoute: Driver is active, showing content');
      return children;
    case 'pending':
      console.log('DriverRoute: Driver is pending, redirecting to pending page');
      return <Navigate to="/driver/pending" replace />;
    case null:
      console.log('DriverRoute: No driver status, redirecting to registration');
      return <Navigate to="/driver/before-register" replace />;
    default:
      console.log('DriverRoute: Unknown status, redirecting to home');
      return <Navigate to="/" replace />;
  }
} 