import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext.jsx';
import { supabase } from '../../utils/supabase.ts';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, isAdmin } = useAdminAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [userId, setUserId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeDrivers: 0,
    availableVehicles: 0,
    todayRevenue: 0,
    pendingApplications: 0,
    todayBookings: 0
  });

  useEffect(() => {
    fetchStats();
    // Add fade-in effect when component mounts
    setIsVisible(true);
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Debug log to check user object
    console.log("Current user object:", user);
    
    if (user?.id) {
      fetchAdminProfile();
    } else {
      // If no user object, try to get the current session
      getCurrentUser();
    }
  }, [user]);

  const getCurrentUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
        return;
      }
      
      if (session?.user) {
        console.log("Retrieved user from session:", session.user);
        fetchAdminProfileById(session.user.id);
      } else {
        console.log("No active session found");
      }
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
    }
  };

  const fetchAdminProfileById = async (id) => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching admin profile by ID:', error);
        return;
      }

      console.log("Profile data retrieved:", data);
      setAdminProfile(data);
    } catch (error) {
      console.error('Error in fetchAdminProfileById:', error);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      console.log("Fetching profile for user ID:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        
        // If no profile found, try checking the auth user email
        if (user.email) {
          const { data: emailData, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .single();
            
          if (emailError) {
            console.error('Error fetching profile by email:', emailError);
            return;
          }
          
          if (emailData) {
            console.log("Profile found by email:", emailData);
            setAdminProfile(emailData);
            return;
          }
        }
        return;
      }

      console.log("Profile data retrieved:", data);
      setAdminProfile(data);
    } catch (error) {
      console.error('Error in fetchAdminProfile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch total bookings count
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, total_amount, created_at', { count: 'exact' });

      if (bookingsError) throw bookingsError;

      // Get today's bookings and revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayBookings = bookingsData.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= today;
      });

      const todayRevenue = todayBookings.reduce((sum, booking) => {
        return sum + (booking.total_amount || 0);
      }, 0);

      // Count active drivers
      const { count: activeDriversCount, error: driversError } = await supabase
        .from('drivers')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      if (driversError) throw driversError;

      // Count pending applications
      const { count: pendingCount, error: applicationsError } = await supabase
        .from('driver_applications')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      if (applicationsError) throw applicationsError;

      // Update stats state
      setStats({
        totalBookings: bookingsData.length,
        activeDrivers: activeDriversCount || 0,
        availableVehicles: activeDriversCount || 0, // Assuming one vehicle per active driver
        todayRevenue: todayRevenue,
        pendingApplications: pendingCount || 0,
        todayBookings: todayBookings.length
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch dashboard statistics');
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

  // Get admin display name
  const getAdminName = () => {
    if (adminProfile?.full_name) return adminProfile.full_name;
    if (adminProfile?.first_name) return `${adminProfile.first_name} ${adminProfile.last_name || ''}`.trim();
    if (adminProfile?.username) return adminProfile.username;
    if (adminProfile?.email) return adminProfile.email;
    if (user?.email) return user.email;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    return 'Admin';
  };

  // Get user ID safely
  const getUserId = () => {
    if (user?.id) return user.id;
    if (adminProfile?.id) return adminProfile.id;
    return 'Unknown';
  };

  return (
    <div className="bg-gray-100">
      <div className="p-4 pt-6 md:p-6">
        <div className={`mb-8 bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-lg text-white transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Welcome back, {getAdminName()}</p>
            </div>
            <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
              <div className="flex flex-col">
                <div className="mb-2">
                  <p className="text-sm text-blue-100">Name:</p>
                  <p className="font-semibold">{getAdminName()}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-100">User ID:</p>
                  <p className="font-mono text-sm font-medium break-all">{getUserId()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`bg-white p-4 sm:p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '100ms' }}>
            <h2 className="text-lg font-semibold mb-2">Total Bookings</h2>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
          </div>
          <div className={`bg-white p-4 sm:p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <h2 className="text-lg font-semibold mb-2">Today's Bookings</h2>
            <p className="text-3xl font-bold">{stats.todayBookings}</p>
          </div>
          <div className={`bg-white p-4 sm:p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
            <h2 className="text-lg font-semibold mb-2">Active Drivers</h2>
            <p className="text-3xl font-bold">{stats.activeDrivers}</p>
          </div>
          <div className={`bg-white p-4 sm:p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <h2 className="text-lg font-semibold mb-2">Today's Revenue</h2>
            <p className="text-3xl font-bold">₱{stats.todayRevenue.toLocaleString()}</p>
          </div>
          <div className={`bg-white p-4 sm:p-6 rounded-lg shadow transform transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '500ms' }}>
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
    </div>
  );
}