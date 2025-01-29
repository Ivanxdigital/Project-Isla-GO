import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const AdminAuthContext = createContext({
  isAdmin: false,
  loading: true
});

export function AdminAuthProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setState({ isAdmin: false, loading: false });
        return;
      }

      try {
        // First check admin_access table
        const { data: adminData, error: adminError } = await supabase
          .from('admin_access')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();

        if (adminError && adminError.code !== 'PGRST116') {
          console.error('Error checking admin_access:', adminError);
          setState({ isAdmin: false, loading: false });
          return;
        }

        // If user is in admin_access and is_super_admin is true
        if (adminData?.is_super_admin) {
          setState({ isAdmin: true, loading: false });
          return;
        }

        // If not super admin, check staff_roles as fallback
        const { data: roleData, error: roleError } = await supabase
          .from('staff_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Error checking staff_roles:', roleError);
          setState({ isAdmin: false, loading: false });
          return;
        }

        setState({
          isAdmin: adminData?.is_super_admin || roleData?.role === 'admin',
          loading: false
        });

      } catch (error) {
        console.error('Error checking admin status:', error);
        setState({ isAdmin: false, loading: false });
      }
    }

    checkAdminStatus();
  }, [user]);

  return (
    <AdminAuthContext.Provider value={state}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}