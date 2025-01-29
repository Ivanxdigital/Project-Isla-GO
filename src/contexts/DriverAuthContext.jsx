import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const DriverAuthContext = createContext({
  isDriver: false,
  driverStatus: null, // 'pending', 'approved', 'rejected'
  loading: true,
  error: null
});

// Separate hook into its own named function
function useDriverAuthContext() {
  const context = useContext(DriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return context;
}

// Provider component
function DriverAuthProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({
    isDriver: false,
    driverStatus: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function checkDriverStatus() {
      if (!user) {
        setState({ isDriver: false, driverStatus: null, loading: false, error: null });
        return;
      }

      // Add a small delay to prevent flashing
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // First check if they're an approved driver
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('status, documents_verified')
          .eq('id', user.id)
          .maybeSingle();

        if (driverError) {
          console.error('Error checking drivers:', driverError);
          throw driverError;
        }

        // If they're an approved driver with verified documents
        if (driverData?.status === 'Available' && driverData?.documents_verified) {
          setState({
            isDriver: true,
            driverStatus: 'approved',
            loading: false,
            error: null
          });
          return;
        }

        // Check application status if not an approved driver
        const { data: applicationData, error: applicationError } = await supabase
          .from('driver_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (applicationError) {
          console.error('Error checking driver_applications:', applicationError);
          throw applicationError;
        }

        // Determine driver status based on both driver and application data
        const status = determineDriverStatus(driverData, applicationData);
        
        setState({
          isDriver: status !== null,
          driverStatus: status,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error in checkDriverStatus:', error);
        setState({ 
          isDriver: false, 
          driverStatus: null, 
          loading: false,
          error: 'Failed to check driver status'
        });
      }
    }

    checkDriverStatus();
  }, [user]);

  // Helper function to determine driver status
  function determineDriverStatus(driverData, applicationData) {
    if (driverData?.status) {
      return driverData.status;
    }
    
    if (applicationData?.status) {
      return applicationData.status;
    }

    return null;
  }

  const value = {
    ...state,
    // Add any additional methods here if needed
    refreshStatus: () => {
      setState(prev => ({ ...prev, loading: true }));
    }
  };

  return (
    <DriverAuthContext.Provider value={value}>
      {children}
    </DriverAuthContext.Provider>
  );
}

// Export both the Provider and the hook
export { DriverAuthProvider, useDriverAuthContext as useDriverAuth }; 