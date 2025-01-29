import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, isAdmin } = useAdminAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [userId, setUserId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeDrivers: 0,
    availableVehicles: 0,
    todayRevenue: 0,
    pendingApplications: 0
  });

  useEffect(() => {
    fetchStats();
    // Add fade-in effect when component mounts
    setIsVisible(true);
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch pending applications count
      const { count: pendingCount } = await supabase
        .from('driver_applications')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApplications: pendingCount
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setUpdating(true);
    try {
      // First check if the user exists in profiles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error checking user:', userError);
        throw new Error('Error checking user profile');
      }

      // Start a batch of operations
      const updates = [];

      // Update or create profile
      if (!userData) {
        updates.push(
          supabase
            .from('profiles')
            .insert([{
              id: userId,
              role: 'driver',
              created_at: new Date().toISOString()
            }])
        );
      } else {
        updates.push(
          supabase
            .from('profiles')
            .update({ role: 'driver' })
            .eq('id', userId)
        );
      }

      // Add entry to staff_roles table
      updates.push(
        supabase
          .from('staff_roles')
          .upsert({
            user_id: userId,
            role: 'driver',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      );

      // Create entry in drivers table
      updates.push(
        supabase
          .from('drivers')
          .insert([{
            id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active',
            documents_verified: false
          }])
      );

      // Execute all updates
      const results = await Promise.all(updates);

      // Check for errors in any of the operations
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors during updates:', errors);
        throw new Error('Failed to update user role completely');
      }

      toast.success('User role updated successfully');
      setUserId(''); // Clear the input
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`p-6 transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`bg-white p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '100ms' }}>
          <h2 className="text-lg font-semibold mb-2">Total Bookings</h2>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
          <h2 className="text-lg font-semibold mb-2">Active Drivers</h2>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
          <h2 className="text-lg font-semibold mb-2">Available Vehicles</h2>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
          <h2 className="text-lg font-semibold mb-2">Today's Revenue</h2>
          <p className="text-3xl font-bold">₱0</p>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '500ms' }}>
          <h2 className="text-lg font-semibold mb-2">Pending Applications</h2>
          <p className="text-3xl font-bold">{stats.pendingApplications}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">User Role Management</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleUpdateRole} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter user ID"
              />
            </div>
            <button
              type="submit"
              disabled={updating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Make Driver'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}