import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminRoute({ children }) {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function StaffRoute({ children }) {
  const { user, isStaff, loading } = useAdminAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    console.log('StaffRoute state:', { user, isStaff, loading, pathname: location.pathname });
    if (loading) {
      const timeoutId = setTimeout(() => setShowLoading(true), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [user, isStaff, loading, location]);

  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !isStaff) {
    console.log('No user or staff found, redirecting to login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('Access granted to staff route');
  return children;
}