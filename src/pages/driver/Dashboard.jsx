// src/pages/driver/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { supabase } from '../../utils/supabase.js';
import { useDriverAuth } from '../../contexts/DriverAuthContext.jsx';
import { toast } from 'react-hot-toast';

// Add notification status enum to match database
const NOTIFICATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

const BOOKING_STATUS = {
  PENDING: 'PENDING',
  FINDING_DRIVER: 'FINDING_DRIVER',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const { isDriver, driverStatus, loading: driverAuthLoading } = useDriverAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    pendingTrips: 0
  });
  const [earnings, setEarnings] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    totalTrips: 0,
    rating: 0
  });
  const [pendingBookings, setPendingBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);
  const [notificationSound] = useState(new Audio('/notification-sound.mp3')); // Add a notification sound file to your public folder

  // Add a polling interval state
  const POLLING_INTERVAL = 5000; // 5 seconds

  // Move fetchNotifications to component scope so it can be used by handleBookingResponse
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_notifications')
        .select(`
          *,
          bookings (
            id,
            from_location,
            to_location,
            departure_date,
            departure_time,
            total_amount,
            service_type,
            booked_seats
          )
        `)
        .eq('driver_id', user.id)
        .eq('status', NOTIFICATION_STATUS.PENDING)
        .lt('expires_at', new Date().toISOString()) // Only get non-expired notifications
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Check if there are new notifications
      if (data && data.length > 0) {
        // If we have more notifications than before or if the newest notification is newer than our last check
        const newestNotification = data[0];
        
        if (notifications.length === 0 || 
            data.length > notifications.length || 
            (lastNotificationTime && new Date(newestNotification.created_at) > new Date(lastNotificationTime))) {
          
          // Play notification sound
          try {
            notificationSound.play();
          } catch (soundError) {
            console.error('Error playing notification sound:', soundError);
          }
          
          // Show toast notification
          toast.success('New booking request available!', {
            duration: 5000,
            icon: '🔔'
          });
          
          // Set flag for visual indicator
          setHasNewNotifications(true);
          
          // Update last notification time
          setLastNotificationTime(newestNotification.created_at);
        }
      }
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Log to notification_logs table
      await supabase.from('driver_notification_logs').insert({
        booking_id: null,
        status_code: 500,
        response: JSON.stringify({ error: error.message }),
        created_at: new Date().toISOString()
      });
    }
  };

  // Move fetchPendingBookings to component scope
  const fetchPendingBookings = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('driver_notifications')
        .select(`
          *,
          bookings (
            id,
            from_location,
            to_location,
            departure_date,
            departure_time,
            service_type,
            total_amount,
            profiles (
              full_name
            )
          )
        `)
        .eq('driver_id', user.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setPendingBookings(notifications);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  };

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('driver-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_notifications',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        console.log('New notification received:', payload);
        
        // Play notification sound
        try {
          notificationSound.play();
        } catch (soundError) {
          console.error('Error playing notification sound:', soundError);
        }
        
        // Show toast notification
        toast.success('New booking request available!', {
          duration: 5000,
          icon: '🔔'
        });
        
        // Set flag for visual indicator
        setHasNewNotifications(true);
        
        // Fetch updated notifications
        fetchNotifications();
      })
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  // Update polling effect to use the shared fetchNotifications function
  useEffect(() => {
    if (!user) return;
    
    let mounted = true;

    // Set up polling
    const pollInterval = setInterval(fetchNotifications, POLLING_INTERVAL);

    // Initial fetch
    fetchNotifications();

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [user?.id]);

  useEffect(() => {
    console.log('Driver Dashboard State:', {
      isDriver,
      driverStatus,
      userId: user?.id
    });
  }, [isDriver, driverStatus, user]);

  useEffect(() => {
    if (driverAuthLoading) return;
    if (!user) return;

    let mounted = true;

    const fetchDriverData = async () => {
      try {
        const { data: tripData, error: tripError } = await supabase
          .from('trip_assignments')
          .select(`
            *,
            bookings (
              id,
              from_location,
              to_location,
              departure_date,
              departure_time,
              service_type,
              status
            ),
            vehicles (
              id,
              model,
              plate_number,
              capacity,
              status
            ),
            drivers (
              id,
              name,
              contact_number,
              license_number,
              status,
              license_expiry
            )
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (tripError) throw tripError;

        if (mounted) {
          // Calculate stats from the joined data
          const completed = tripData.filter(t => t.bookings?.status === 'COMPLETED').length;
          const pending = tripData.filter(t => t.bookings?.status === 'PENDING').length;

          setTrips(tripData);
          setStats({
            totalTrips: tripData.length,
            completedTrips: completed,
            pendingTrips: pending
          });
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        if (mounted) {
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const fetchEarnings = async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('trip_assignments')
        .select(`
          *,
          bookings (
            total_amount,
            status,
            created_at
          )
        `)
        .eq('driver_id', user.id)
        .eq('bookings.status', 'COMPLETED');

      if (error) throw error;

      const calculateEarnings = (trips, startDate) => {
        return trips
          .filter(trip => new Date(trip.bookings.created_at) >= new Date(startDate))
          .reduce((sum, trip) => sum + (trip.bookings.total_amount * 0.8), 0); // Assuming 80% driver share
      };

      setEarnings({
        daily: calculateEarnings(data, today),
        weekly: calculateEarnings(data, weekAgo),
        monthly: calculateEarnings(data, monthAgo),
        totalTrips: data.length,
        rating: 4.5 // You'll need to implement actual rating calculation
      });
    };

    fetchDriverData();
    fetchEarnings();
    fetchPendingBookings(); // Call the moved function
  }, [user, driverAuthLoading]);

  // Add this function near the top of your component
  const confirmAction = (message) => {
    return new Promise((resolve) => {
      if (window.confirm(message)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  };

  // Update the handleBookingResponse function
  const handleBookingResponse = async (notificationId, bookingId, accept) => {
    try {
      const confirmed = await confirmAction(
        accept 
          ? 'Are you sure you want to accept this booking?' 
          : 'Are you sure you want to reject this booking?'
      );

      if (!confirmed) return;

      const loadingToast = toast.loading(accept ? 'Accepting booking...' : 'Rejecting booking...');

      // Get the notification for response code
      const { data: notification } = await supabase
        .from('driver_notifications')
        .select('response_code, expires_at')
        .eq('id', notificationId)
        .single();

      // Check if notification has expired
      if (new Date(notification.expires_at) < new Date()) {
        toast.dismiss(loadingToast);
        toast.error('This booking request has expired');
        return;
      }

      // Call the database function to handle the response
      const { data, error } = await supabase
        .rpc('handle_driver_response', {
          p_booking_id: bookingId,
          p_driver_id: user.id,
          p_response_code: notification.response_code
        });

      if (error) throw error;

      // Handle the response from the database function
      switch (data) {
        case 'SUCCESS':
          toast.dismiss(loadingToast);
          toast.success(accept 
            ? 'Booking accepted successfully! Check your trips for details.' 
            : 'Booking rejected successfully'
          );
          break;
        case 'EXPIRED':
          toast.dismiss(loadingToast);
          toast.error('This booking request has expired');
          break;
        case 'BOOKING_NO_LONGER_AVAILABLE':
          toast.dismiss(loadingToast);
          toast.error('This booking is no longer available');
          break;
        case 'INVALID_CODE':
          toast.dismiss(loadingToast);
          toast.error('Invalid response code');
          break;
        default:
          throw new Error(`Unexpected response: ${data}`);
      }

      // Log the response
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: data === 'SUCCESS' ? 200 : 400,
        response: JSON.stringify({ status: data }),
        created_at: new Date().toISOString()
      });

      // Reset new notification flag
      setHasNewNotifications(false);

      // Refresh the notifications and bookings
      await Promise.all([
        fetchNotifications(),
        fetchPendingBookings()
      ]);

    } catch (error) {
      console.error('Error handling booking response:', error);
      toast.error(`Failed to process response: ${error.message || 'Unknown error'}`);
      
      // Log the error
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 500,
        response: JSON.stringify({ error: error.message }),
        created_at: new Date().toISOString()
      });
    }
  };

  if (loading || driverAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => {
                // Clear new notification indicator when clicked
                setHasNewNotifications(false);
                // Scroll to notifications section
                document.getElementById('notifications-section').scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              
              {/* Notification Badge */}
              {hasNewNotifications && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  New
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <p>Status: {driverStatus}</p>
          <p>Active Driver: {isDriver ? 'Yes' : 'No'}</p>
          <p>ID: {user?.id}</p>
        </div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-medium">{trips[0]?.drivers?.name}</h2>
          <p className="text-sm text-gray-600">License: {trips[0]?.drivers?.license_number}</p>
          <p className="text-sm text-gray-600">
            Expires: {new Date(trips[0]?.drivers?.license_expiry).toLocaleDateString()}
          </p>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Trips</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalTrips}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Completed Trips</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completedTrips}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Trips</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingTrips}</p>
          </div>
        </div>

        {/* Recent Trips Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Trips</h2>
            {trips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {trip.bookings?.from_location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {trip.bookings?.to_location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {trip.bookings?.departure_date && new Date(trip.bookings.departure_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{trip.vehicles?.model}</p>
                            <p className="text-gray-500">{trip.vehicles?.plate_number}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            trip.bookings?.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : trip.bookings?.status === 'PENDING' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {trip.bookings?.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No trips found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add this Notifications Section */}
      <div id="notifications-section" className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">New Booking Requests</h2>
          
          {hasNewNotifications && (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
              New Requests
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white border rounded-lg p-4 shadow-sm ${
                    lastNotificationTime && new Date(notification.created_at) > new Date(lastNotificationTime) 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {notification.bookings?.from_location} → {notification.bookings?.to_location}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(notification.bookings?.departure_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Time: {notification.bookings?.departure_time}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(notification.expires_at).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        ₱{notification.bookings?.total_amount}
                      </p>
                      
                      {/* Add time received */}
                      <p className="text-xs text-gray-500 mt-2">
                        Received: {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBookingResponse(notification.id, notification.bookings?.id, true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                        disabled={new Date(notification.expires_at) < new Date()}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleBookingResponse(notification.id, notification.bookings?.id, false)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        disabled={new Date(notification.expires_at) < new Date()}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                  
                  {/* Countdown timer */}
                  {new Date(notification.expires_at) > new Date() && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Expires in: {Math.max(0, Math.floor((new Date(notification.expires_at) - new Date()) / 60000))} minutes
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ 
                            width: `${Math.max(0, Math.min(100, (new Date(notification.expires_at) - new Date()) / (15 * 60 * 1000) * 100))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Expired indicator */}
                  {new Date(notification.expires_at) < new Date() && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-red-500 font-medium">
                        This booking request has expired
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No new booking requests</p>
          )}
        </div>
      </div>
    </div>
  );
}