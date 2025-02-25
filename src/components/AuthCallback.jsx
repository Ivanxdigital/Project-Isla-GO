import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Starting auth callback handling');
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthCallback: Session data:', data);

        if (error) throw error;

        if (data?.session?.user) {
          const { user } = data.session;
          
          // Check if user profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            console.log('Creating new profile for user');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  full_name: user.user_metadata?.full_name || '',
                  avatar_url: user.user_metadata?.avatar_url || '',
                  created_at: new Date().toISOString()
                }
              ]);

            if (insertError) {
              console.error('Error creating profile:', insertError);
              throw insertError;
            }
          }

          // Check if user record exists
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (userError && userError.code === 'PGRST116') {
            // User record doesn't exist, create one
            console.log('Creating new user record');
            const names = user.user_metadata?.full_name?.split(' ') || ['', ''];
            const { error: insertUserError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  first_name: names[0],
                  last_name: names.slice(1).join(' '),
                  created_at: new Date().toISOString(),
                  phone: user.phone || null,
                  role: 'user' // default role
                }
              ]);

            if (insertUserError) {
              console.error('Error creating user record:', insertUserError);
              throw insertUserError;
            }
          }

          console.log('AuthCallback: Successfully authenticated, redirecting to home');
          navigate('/', { replace: true });
        } else {
          console.log('AuthCallback: No session found');
          navigate('/login', {
            state: { message: 'Authentication failed. Please try again.' }
          });
        }
      } catch (error) {
        console.error('AuthCallback: Error during auth:', error);
        navigate('/login', {
          state: { message: error.message || 'An error occurred during authentication' }
        });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
} 