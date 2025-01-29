import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// Create the context
const AuthContext = createContext({
  user: null,
  loading: true,
  session: null,
  signOut: async () => {},
  setUser: () => {}
});

// Create the provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    localStorage.clear(); // Clear all localStorage items
    sessionStorage.clear(); // Clear all sessionStorage items
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (mounted) {
          console.log('Initial auth state:', {
            hasSession: !!initialSession,
            userId: initialSession?.user?.id
          });
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthState();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change event:', event, {
        hasSession: !!newSession,
        userId: newSession?.user?.id
      });

      if (mounted) {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          clearAuthState();
        } else {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear all auth state first
      clearAuthState();
      
      try {
        // Attempt to sign out from Supabase
        await supabase.auth.signOut();
      } catch (error) {
        console.log('Supabase signOut error (non-critical):', error);
        // Continue with sign out process even if Supabase call fails
      }
      
      // Force clear any remaining Supabase session data
      await supabase.auth.clearSession();
      
      // Reload the page to ensure a clean state
      window.location.replace('/');
      
      return { error: null };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    session,
    signOut,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook separately
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};