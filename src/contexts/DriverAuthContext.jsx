import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase.js';
import { useAuth } from './AuthContext.jsx';

const DriverAuthContext = createContext({});

// Separate hook into its own named function
function useDriverAuthContext() {
  const context = useContext(DriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return context;
}

// Provider component
export function DriverAuthProvider({ children }) {
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState(null);

  useEffect(() => {
    async function checkDriverStatus() {
      // Set loading to true at the start of the check
      setLoading(true);
      
      try {
        if (!user) {
          console.log('DriverAuthContext: No user');
          setIsDriver(false);
          setDriverStatus(null);
          setLoading(false);
          return;
        }

        console.log('DriverAuthContext: Checking status for user:', user.id);

        // First check drivers table - FIXED: Check user_id instead of id
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('DriverAuthContext: Driver data:', driverData, 'Error:', driverError);

        if (driverError && driverError.code !== 'PGRST116') {
          throw driverError;
        }

        if (driverData) {
          console.log('DriverAuthContext: Found driver record:', driverData);
          setIsDriver(driverData.status === 'active');
          setDriverStatus(driverData.status);
        } else {
          console.log('DriverAuthContext: No driver record found');
          setIsDriver(false);
          setDriverStatus(null);
        }
      } catch (error) {
        console.error('DriverAuthContext Error:', error);
        setIsDriver(false);
        setDriverStatus(null);
      } finally {
        // Set loading to false only after all state updates are done
        setTimeout(() => setLoading(false), 0);
      }
    }

    // Only check status if we have a user
    if (user) {
      checkDriverStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const value = {
    isDriver,
    driverStatus,
    loading,
    refreshStatus: () => {
      setLoading(true);
      // Fix: Define checkDriverStatus here to avoid reference error
      async function checkDriverStatus() {
        try {
          if (!user) {
            setIsDriver(false);
            setDriverStatus(null);
            setLoading(false);
            return;
          }

          // Check drivers table with user_id
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('id, status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (driverError && driverError.code !== 'PGRST116') {
            throw driverError;
          }

          if (driverData) {
            setIsDriver(driverData.status === 'active');
            setDriverStatus(driverData.status);
          } else {
            setIsDriver(false);
            setDriverStatus(null);
          }
        } catch (error) {
          console.error('DriverAuthContext Error:', error);
          setIsDriver(false);
          setDriverStatus(null);
        } finally {
          setLoading(false);
        }
      }
      
      checkDriverStatus();
    }
  };

  return (
    <DriverAuthContext.Provider value={value}>
      {children}
    </DriverAuthContext.Provider>
  );
}

// Export both the Provider and the hook
export const useDriverAuth = () => useContext(DriverAuthContext); 