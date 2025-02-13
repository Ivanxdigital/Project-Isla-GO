import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { addStaffRole, getStaffRole } from '../../utils/supabase';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const { user } = useAuth();
  const { isAdmin, role: contextRole, refreshRole } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Update local role state when context role changes
    setCurrentRole(contextRole);
  }, [contextRole]);

  useEffect(() => {
    const fetchCurrentRole = async () => {
      if (user?.id) {
        const result = await getStaffRole(user.id);
        if (result.success) {
          // Extract role value if it's an object
          const roleValue = typeof result.role === 'object' ? result.role.role : result.role;
          setCurrentRole(roleValue);
        }
      }
    };
    fetchCurrentRole();
  }, [user]);

  const makeUserAdmin = async () => {
    if (!user) {
      setError('No user found');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Adding admin role for user:', user.id);
      const result = await addStaffRole(user.id, 'admin');
      console.log('Add staff role result:', result);

      if (result.success) {
        setSuccess(true);
        
        // Wait a moment before refreshing role
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh the role in context and wait for it
        const newRole = await refreshRole();
        console.log('Role after refresh:', newRole);
        
        if (newRole === 'admin') {
          // Wait a moment to show success message
          await new Promise(resolve => setTimeout(resolve, 1000));
          navigate('/admin/dashboard');
        } else {
          setError('Role update may have succeeded but verification failed. Please try again.');
        }
      } else {
        setError(result.error?.message || 'Failed to add admin role');
      }
    } catch (err) {
      console.error('Error in makeUserAdmin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-0 py-6">
      <div className="px-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="max-w-4xl mx-auto">
          {/* Admin Role Management Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-8">
            <h2 className="text-xl font-semibold mb-4">Admin Role Management</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-gray-600">
                  Current User ID: {user?.id}
                </p>
                <p className="text-gray-600">
                  Current Role: {currentRole || 'No role assigned'}
                </p>
                <p className="text-gray-600">
                  Admin Status: {isAdmin ? 'Admin' : 'Not Admin'}
                </p>
              </div>
              
              {!isAdmin && (
                <button
                  onClick={makeUserAdmin}
                  disabled={loading}
                  className="bg-ai-600 text-white px-4 py-2 rounded hover:bg-ai-700 disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? 'Processing...' : 'Make Current User Admin'}
                </button>
              )}
              
              {error && (
                <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>
              )}
              {success && (
                <p className="text-green-600 bg-green-50 p-3 rounded">
                  Successfully added admin role! Redirecting to dashboard...
                </p>
              )}
            </div>
          </div>

          {/* Other settings sections */}
          <div className="bg-white rounded-lg shadow p-6">
            <p>Settings will go here</p>
          </div>
        </div>
      </div>
    </div>
  );
}