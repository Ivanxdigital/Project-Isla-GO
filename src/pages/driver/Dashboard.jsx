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
  const [notifiedIds, setNotifiedIds] = useState([]);

  // Add a polling interval state
  const POLLING_INTERVAL = 5000; // 5 seconds

  // Move fetchNotifications to component scope so it can be used by handleBookingResponse
  const fetchNotifications = async () => {
    try {
      console.log('Fetching driver notifications for driver:', user.id);
      
      // Debug the current time vs expiration time
      const currentTime = new Date().toISOString();
      console.log('Current time for comparison:', currentTime);
      
      // Debug driver status
      console.log('Driver status when fetching notifications:', driverStatus);
      
      // First, check if the driver is active in the database
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (driverError) {
        console.error('Error fetching driver data:', driverError);
      } else {
        console.log('Driver data from database:', driverData);
        
        // If driver is inactive, update local status
        if (driverData && driverData.status !== 'active') {
          console.log('Driver is not active in database. Status:', driverData.status);
          
          // Attempt to update driver status to active
          console.log('Attempting to update driver status to active');
          const { error: updateError } = await supabase
            .from('drivers')
            .update({ status: 'active' })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating driver status:', updateError);
          } else {
            console.log('Driver status updated to active');
          }
        }
      }
      
      // Use a simpler query structure to avoid 400 errors
      console.log('Fetching all notifications for driver');
      const { data, error } = await supabase
        .from('driver_notifications')
        .select('*')
        .eq('driver_id', user.id);

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        return;
      }
      
      console.log('Raw notifications fetched:', data?.length || 0, data);
      
      // Filter for pending notifications
      const pendingNotifications = data?.filter(notification => 
        notification.status === 'PENDING'
      ) || [];
      
      console.log('Pending notifications:', pendingNotifications.length);
      
      // Check for expired notifications
      const now = new Date();
      const validNotifications = pendingNotifications.filter(notification => {
        if (!notification.expires_at) return false;
        
        const expiryDate = new Date(notification.expires_at);
        const isValid = expiryDate > now;
        
        console.log(
          `Notification ${notification.id} expires at ${notification.expires_at}`,
          isValid ? 'VALID' : 'EXPIRED'
        );
        
        return isValid;
      });
      
      console.log('Valid non-expired notifications:', validNotifications.length);
      
      // Now fetch booking details for each notification
      const notificationsWithBookings = [];
      
      for (const notification of validNotifications) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', notification.booking_id)
          .single();
          
        if (bookingError) {
          console.error(`Error fetching booking ${notification.booking_id}:`, bookingError);
        } else if (bookingData) {
          notificationsWithBookings.push({
            ...notification,
            bookings: bookingData
          });
        }
      }
      
      console.log('Notifications with valid bookings:', notificationsWithBookings.length, notificationsWithBookings);
      
      // Check if there are new notifications that we haven't notified about yet
      const newNotifications = notificationsWithBookings.filter(
        notification => !notifiedIds.includes(notification.id)
      );
      
      if (newNotifications.length > 0) {
        console.log('New notifications detected:', newNotifications.length);
        
        // Only play sound and show toast for the first new notification to avoid spam
        if (newNotifications.length > 0) {
          console.log('Playing notification sound for new booking request');
          playNotificationSound();
          
          // Show only one toast regardless of how many new notifications
          toast.success(`You have ${newNotifications.length} new booking request${newNotifications.length > 1 ? 's' : ''}!`, {
            duration: 5000,
            position: 'top-right',
            id: 'new-booking-notification', // Use an ID to prevent duplicate toasts
          });
          
          // Add the new notification IDs to our tracking array
          setNotifiedIds(prev => [...prev, ...newNotifications.map(n => n.id)]);
        }
      }
      
      setNotifications(notificationsWithBookings);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      setNotifications([]);
    }
  };

  // Move fetchPendingBookings to component scope
  const fetchPendingBookings = async () => {
    try {
      console.log('Fetching pending bookings for driver:', user.id);
      
      // Debug the current time vs expiration time
      const currentTime = new Date().toISOString();
      console.log('Current time for pending bookings comparison:', currentTime);
      
      // Use filter instead of eq and simplify the query to avoid 400 errors
      const { data: notifications, error } = await supabase
        .from('driver_notifications')
        .select(`
          id,
          booking_id,
          status,
          response_code,
          expires_at,
          created_at,
          bookings:booking_id (
            id,
            from_location,
            to_location,
            departure_date,
            departure_time,
            service_type,
            total_amount
          )
        `)
        .filter('driver_id', 'eq', user.id)
        .filter('status', 'eq', 'PENDING')
        .gt('expires_at', new Date().toISOString()) // Only get non-expired notifications
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending bookings:', error);
        setPendingBookings([]);
        return;
      }

      console.log('Pending bookings fetched:', notifications?.length || 0, notifications);
      
      // Filter out any notifications with null bookings
      const validNotifications = notifications?.filter(notification => 
        notification.bookings && notification.bookings.id
      ) || [];
      
      setPendingBookings(validNotifications);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      setPendingBookings([]);
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
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .filter('assigned_driver_id', 'eq', user.id)
          .filter('status', 'eq', 'completed');
        
        if (error) {
          console.error('Error fetching earnings:', error);
          return;
        }
        
        console.log('Earnings data fetched:', data?.length || 0, data);
        
        // Calculate earnings using the calculateEarnings function
        const earningsData = calculateEarnings(data || []);
        
        // Set earnings state with calculated values
        setEarnings({
          daily: earningsData.today,
          weekly: earningsData.thisWeek,
          monthly: earningsData.thisMonth,
          totalTrips: data?.length || 0,
          rating: 4.5 // You'll need to implement actual rating calculation
        });
      } catch (error) {
        console.error('Error in fetchEarnings:', error);
      }
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
      const { data: notification, error: notificationError } = await supabase
        .from('driver_notifications')
        .select('response_code, expires_at, status')
        .eq('id', notificationId)
        .single();
        
      if (notificationError) {
        console.error('Error fetching notification:', notificationError);
        toast.dismiss(loadingToast);
        toast.error(`Error fetching notification: ${notificationError.message}`);
        return;
      }

      // Check if notification has expired
      if (new Date(notification.expires_at) < new Date()) {
        toast.dismiss(loadingToast);
        toast.error('This booking request has expired');
        return;
      }
      
      // Update the notification status first
      const { error: updateError } = await supabase
        .from('driver_notifications')
        .update({ 
          status: accept ? 'ACCEPTED' : 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);
        
      if (updateError) {
        console.error('Error updating notification status:', updateError);
        toast.dismiss(loadingToast);
        toast.error(`Error updating notification: ${updateError.message}`);
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
        driver_id: user.id,
        notification_id: notificationId,
        status_code: data === 'SUCCESS' ? 200 : 400,
        response: JSON.stringify({ status: data, action: accept ? 'accept' : 'reject' }),
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
        driver_id: user.id,
        status_code: 500,
        response: JSON.stringify({ error: error.message }),
        created_at: new Date().toISOString()
      });
    }
  };

  // Add notification sound function
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    } catch (error) {
      console.error('Error creating audio object:', error);
    }
  };

  // Calculate earnings for different time periods
  const calculateEarnings = (trips) => {
    if (!trips || trips.length === 0) {
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Make sure we have valid created_at dates before filtering
    const validTrips = trips.filter(trip => trip && trip.created_at);

    const todayEarnings = validTrips
      .filter(trip => new Date(trip.created_at) >= todayStart)
      .reduce((sum, trip) => sum + (parseFloat(trip.total_amount) || 0), 0);

    const weekEarnings = validTrips
      .filter(trip => new Date(trip.created_at) >= weekStart)
      .reduce((sum, trip) => sum + (parseFloat(trip.total_amount) || 0), 0);

    const monthEarnings = validTrips
      .filter(trip => new Date(trip.created_at) >= monthStart)
      .reduce((sum, trip) => sum + (parseFloat(trip.total_amount) || 0), 0);

    const totalEarnings = validTrips
      .reduce((sum, trip) => sum + (parseFloat(trip.total_amount) || 0), 0);

    return {
      today: todayEarnings,
      thisWeek: weekEarnings,
      thisMonth: monthEarnings,
      total: totalEarnings
    };
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