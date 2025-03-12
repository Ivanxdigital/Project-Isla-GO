// src/pages/driver/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { supabase } from '../../utils/supabase.js';
import { useDriverAuth } from '../../contexts/DriverAuthContext.jsx';
import { useDriverSidebar } from '../../contexts/DriverSidebarContext.jsx';
import { toast } from 'react-hot-toast';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// Update notification status enum to match database enum values (lowercase)
const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'declined',
  EXPIRED: 'expired'
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
  const { openSidebar, isMobile, closeSidebar } = useDriverSidebar();
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
  const [notificationSound] = useState(new Audio('/notification-sound.mp3'));
  const [notifiedIds, setNotifiedIds] = useState([]);

  // Add a polling interval state
  const POLLING_INTERVAL = 5000; // 5 seconds

  // Add state for the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBookingId, setConfirmBookingId] = useState(null);

  // Ensure sidebar is open on desktop but closed on mobile when component mounts
  // Only run this effect once when the component mounts
  /*
  useEffect(() => {
    // Initial setup - only run once
    if (isMobile) {
      console.log('Dashboard: Mobile detected, closing sidebar');
      closeSidebar();
    } else {
      console.log('Dashboard: Desktop detected, opening sidebar');
      openSidebar();
    }
    // Empty dependency array ensures this only runs once
  }, []);
  */

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
      
      // Check if we have any notifications with status 'PENDING' (uppercase) or 'pending' (lowercase)
      // This handles both old and new notifications
      const pendingNotifications = data?.filter(notification => 
        notification.status === NOTIFICATION_STATUS.PENDING || 
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
      
      // Filter out duplicate booking notifications - keep only the most recent for each booking_id
      const bookingMap = new Map();
      validNotifications.forEach(notification => {
        const existingNotification = bookingMap.get(notification.booking_id);
        
        // If we don't have this booking_id yet, or this notification is newer, keep it
        if (!existingNotification || new Date(notification.created_at) > new Date(existingNotification.created_at)) {
          bookingMap.set(notification.booking_id, notification);
        }
      });
      
      // Convert the map values back to an array
      const uniqueValidNotifications = Array.from(bookingMap.values());
      console.log('Unique valid notifications after deduplication:', uniqueValidNotifications.length);
      
      // Now fetch booking details for each notification
      const notificationsWithBookings = [];
      
      for (const notification of uniqueValidNotifications) {
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
      
      // Use a more flexible query to handle both uppercase and lowercase status values
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
            group_size,
            total_amount,
            status,
            created_at,
            pickup_option,
            hotel_pickup,
            hotel_details
          )
        `)
        .eq('driver_id', user.id)
        .or(`status.eq.${NOTIFICATION_STATUS.PENDING},status.eq.PENDING`)
        .filter('expires_at', 'gt', currentTime);

      if (error) {
        console.error('Error fetching pending bookings:', error);
        setPendingBookings([]);
        return;
      }

      console.log('Pending bookings raw data:', notifications);
      
      // Filter out notifications with no booking data or expired notifications
      const validBookings = notifications.filter(
        notification => notification.bookings && 
        (notification.status === NOTIFICATION_STATUS.PENDING || notification.status === 'PENDING') && 
        new Date(notification.expires_at) > new Date()
      );
      
      console.log('Valid pending bookings:', validBookings);
      setPendingBookings(validBookings);
    } catch (error) {
      console.error('Error in fetchPendingBookings:', error);
      setPendingBookings([]);
    }
  };

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up real-time subscription for driver notifications');
    
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
          playNotificationSound();
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
        fetchPendingBookings();
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

  // Add polling for pending bookings
  useEffect(() => {
    if (!user) return;
    
    let mounted = true;

    // Set up polling for pending bookings
    const pollPendingBookingsInterval = setInterval(fetchPendingBookings, POLLING_INTERVAL);

    // Initial fetch of pending bookings
    fetchPendingBookings();

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(pollPendingBookingsInterval);
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
        // Check if the driver has any trip assignments first
        const { count, error: countError } = await supabase
          .from('trip_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', user.id);
          
        if (countError) {
          console.error('Error checking trip assignments:', countError);
          throw countError;
        }
        
        // Only fetch trip assignments if there are any
        if (count && count > 0) {
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
                seating_capacity,
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
        } else {
          // No trip assignments found, set empty data
          if (mounted) {
            setTrips([]);
            setStats({
              totalTrips: 0,
              completedTrips: 0,
              pendingTrips: 0
            });
          }
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

  // Replace the old confirmAction function with this modern UI version
  const showConfirmationModal = (message, callback) => {
    setConfirmMessage(message);
    setConfirmCallback(() => callback);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmCallback) {
      confirmCallback(true);
    }
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    if (confirmCallback) {
      confirmCallback(false);
    }
    setShowConfirmModal(false);
  };

  // Update the handleBookingResponse function
  const handleBookingResponse = async (notificationId, bookingId, accept) => {
    // Create a reference to the loading toast that we can access in the catch block
    let loadingToast;
    
    // Use the new confirmation modal instead of the browser's default
    showConfirmationModal(
      accept 
        ? 'Are you sure you want to accept this booking?' 
        : 'Are you sure you want to reject this booking?',
      async (confirmed) => {
        if (!confirmed) return;
        
        try {
          // Store the toast ID so we can dismiss it in the catch block
          loadingToast = toast.loading(accept ? 'Accepting booking...' : 'Rejecting booking...', {
            id: `booking-response-${notificationId}`
          });
    
          console.log(`Processing ${accept ? 'acceptance' : 'rejection'} for notification ${notificationId}, booking ${bookingId}`);
    
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
          
          // Update the notification status first - using lowercase values to match database enum
          console.log(`Updating notification ${notificationId} status to ${accept ? NOTIFICATION_STATUS.ACCEPTED : NOTIFICATION_STATUS.REJECTED}`);
          const { error: updateError } = await supabase
            .from('driver_notifications')
            .update({ 
              status: accept ? NOTIFICATION_STATUS.ACCEPTED : NOTIFICATION_STATUS.REJECTED,
              updated_at: new Date().toISOString()
            })
            .eq('id', notificationId);
            
          if (updateError) {
            console.error('Error updating notification status:', updateError);
            toast.dismiss(loadingToast);
            toast.error(`Error updating notification: ${updateError.message}`);
            return;
          }
    
          // Skip the RPC call for rejection - it's not needed since we already updated the notification
          if (!accept) {
            console.log('Skipping RPC call for rejection since notification is already updated');
            
            // Log the response for rejection
            try {
              await supabase.from('driver_notification_logs').insert({
                booking_id: bookingId,
                driver_id: user.id,
                notification_id: notificationId,
                status_code: 200,
                response: JSON.stringify({ status: 'SUCCESS', action: 'reject' }),
                created_at: new Date().toISOString()
              });
            } catch (logError) {
              console.error('Error logging rejection:', logError);
              // Don't return here, continue with the flow
            }
            
            toast.dismiss(loadingToast);
            toast.success('Booking rejected successfully');
            
            // Reset new notification flag
            setHasNewNotifications(false);
            
            // Immediately remove this notification from the pendingBookings state
            setPendingBookings(prevBookings => 
              prevBookings.filter(booking => booking.id !== notificationId)
            );
            
            // Refresh the notifications and bookings
            await Promise.all([
              fetchNotifications(),
              fetchPendingBookings()
            ]);
            
            return;
          }
    
          // Only call the RPC function for acceptance
          console.log('Calling handle_driver_response RPC for acceptance');
          let rpcResponse;
          try {
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('handle_driver_response', {
                p_booking_id: bookingId,
                p_driver_id: user.id,
                p_response_code: notification.response_code
              });
      
            if (rpcError) {
              console.error('Error from handle_driver_response RPC:', rpcError);
              throw rpcError;
            }
            
            rpcResponse = rpcData;
            console.log('RPC response:', rpcResponse);
      
            // Handle the response from the database function
            switch (rpcResponse) {
              case 'SUCCESS':
                toast.dismiss(loadingToast);
                toast.success('Booking accepted successfully! Check your trips for details.');
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
                if (rpcResponse && rpcResponse.startsWith('ERROR:')) {
                  toast.dismiss(loadingToast);
                  toast.error(`Error: ${rpcResponse.substring(7)}`);
                } else {
                  toast.dismiss(loadingToast);
                  throw new Error(`Unexpected response: ${rpcResponse}`);
                }
            }
          } catch (rpcError) {
            console.error('Exception in RPC call:', rpcError);
            
            // Implement fallback mechanism if RPC fails
            console.log('RPC failed, implementing fallback mechanism');
            
            // 1. Update booking status directly
            const { error: bookingUpdateError } = await supabase
              .from('bookings')
              .update({
                status: 'driver_assigned',
                assigned_driver_id: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingId);
              
            if (bookingUpdateError) {
              console.error('Error updating booking in fallback:', bookingUpdateError);
              throw bookingUpdateError;
            }
            
            // 2. Mark other notifications for this booking as expired
            const { error: otherNotificationsError } = await supabase
              .from('driver_notifications')
              .update({
                status: 'expired',
                updated_at: new Date().toISOString()
              })
              .eq('booking_id', bookingId)
              .neq('id', notificationId);
              
            if (otherNotificationsError) {
              console.error('Error updating other notifications in fallback:', otherNotificationsError);
              // Continue anyway, this is not critical
            }
            
            toast.dismiss(loadingToast);
            toast.success('Booking accepted successfully! Check your trips for details.');
          }
    
          // Log the response
          try {
            await supabase.from('driver_notification_logs').insert({
              booking_id: bookingId,
              driver_id: user.id,
              notification_id: notificationId,
              status_code: rpcResponse === 'SUCCESS' ? 200 : 400,
              response: JSON.stringify({ status: rpcResponse || 'FALLBACK_SUCCESS', action: 'accept' }),
              created_at: new Date().toISOString()
            });
          } catch (logError) {
            console.error('Error logging response:', logError);
            // Don't return here, continue with the flow
          }
    
          // Reset new notification flag
          setHasNewNotifications(false);
    
          // Refresh the notifications and bookings
          await Promise.all([
            fetchNotifications(),
            fetchPendingBookings()
          ]);
    
        } catch (error) {
          console.error('Error handling booking response:', error);
          
          // Make sure to dismiss the loading toast if there's an error
          if (loadingToast) {
            toast.dismiss(loadingToast);
          }
          
          toast.error(`Failed to process response: ${error.message || 'Unknown error'}`, {
            id: `error-${Date.now()}`  // Use a unique ID to prevent duplicate toasts
          });
          
          // Log the error
          try {
            await supabase.from('driver_notification_logs').insert({
              booking_id: bookingId,
              driver_id: user.id,
              notification_id: notificationId,
              status_code: 500,
              response: JSON.stringify({ error: error.message }),
              created_at: new Date().toISOString()
            });
          } catch (logError) {
            console.error('Error logging error response:', logError);
          }
          
          // Still refresh the UI to show current state
          await Promise.all([
            fetchNotifications(),
            fetchPendingBookings()
          ]);
        }
      }
    );
  };

  // Add notification sound function
  const playNotificationSound = () => {
    try {
      // Use the correct file name that exists in the public folder
      const audio = new Audio('/notification-sound.mp3');
      
      // Add an error handler
      audio.onerror = (error) => {
        console.error('Error loading notification sound:', error);
      };
      
      // Play the sound
      audio.play().catch(error => {
        console.error('Error playing notification sound:', error);
        // Don't let sound errors break the notification functionality
      });
    } catch (error) {
      console.error('Error creating audio object:', error);
      // Don't let sound errors break the notification functionality
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
          <p className="text-gray-600 mb-4">{typeof error === 'object' ? error.message || 'Unknown error' : error}</p>
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

  // Add a fallback UI when there's no error but no trips data
  if (!loading && trips.length === 0) {
    return (
      <div className="bg-gray-50 w-full">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4">Driver Dashboard</h1>
              
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    // Clear new notification indicator when clicked
                    setHasNewNotifications(false);
                    // Scroll to notifications section
                    document.getElementById('notifications-section')?.scrollIntoView({ 
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
            
            <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
              <p>Status: {driverStatus || 'Active'}</p>
              <p>Active Driver: {isDriver ? 'Yes' : 'No'}</p>
              <p className="truncate">ID: {user?.id}</p>
            </div>
            
            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Total Trips</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalTrips}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Completed Trips</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completedTrips}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Pending Trips</h3>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingTrips}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">No Trips Yet</h2>
              <p className="text-gray-600 mb-4">You don't have any trips assigned yet. New booking requests will appear below when available.</p>
            </div>
          </div>

          {/* Notifications Section */}
          <div id="notifications-section" className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mt-6 sm:mt-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">New Booking Requests</h2>
              
              {hasNewNotifications && (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                  New Requests
                </span>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {notifications.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-white border rounded-lg p-3 sm:p-4 shadow-sm ${
                        lastNotificationTime && new Date(notification.created_at) > new Date(lastNotificationTime) 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">
                          {notification.bookings?.from_location} → {notification.bookings?.to_location}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                          <div>
                            <p className="text-xs text-gray-500">Date:</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {new Date(notification.bookings?.departure_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Time:</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {notification.bookings?.departure_time}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expires:</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {new Date(notification.expires_at).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Amount:</p>
                            <p className="text-xs sm:text-sm font-semibold text-green-600">
                              ₱{notification.bookings?.total_amount}
                            </p>
                          </div>
                        </div>
                        
                        {/* Add time received */}
                        <p className="text-xs text-gray-500 mt-2">
                          Received: {new Date(notification.created_at).toLocaleString()}
                        </p>
                        
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
                      
                      {/* Action buttons - Full width on mobile */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleBookingResponse(notification.id, notification.bookings?.id, true)}
                          className="bg-green-500 text-white py-2 text-xs sm:text-sm rounded hover:bg-green-600 transition-colors"
                          disabled={new Date(notification.expires_at) < new Date()}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleBookingResponse(notification.id, notification.bookings?.id, false)}
                          className="bg-red-500 text-white py-2 text-xs sm:text-sm rounded hover:bg-red-600 transition-colors"
                          disabled={new Date(notification.expires_at) < new Date()}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No new booking requests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 w-full">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4">Driver Dashboard</h1>
            
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
          
          <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
            <p>Status: {driverStatus}</p>
            <p>Active Driver: {isDriver ? 'Yes' : 'No'}</p>
            <p className="truncate">ID: {user?.id}</p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-medium mb-1 md:mb-0">{trips[0]?.drivers?.name}</h2>
            <div className="flex flex-col md:flex-row md:space-x-4 text-xs sm:text-sm">
              <p className="text-gray-600 mb-1 md:mb-0">License: {trips[0]?.drivers?.license_number}</p>
              <p className="text-gray-600">
                Expires: {new Date(trips[0]?.drivers?.license_expiry).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Total Trips</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalTrips}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Completed Trips</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completedTrips}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Pending Trips</h3>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingTrips}</p>
            </div>
          </div>

          {/* Recent Trips Section - Mobile-optimized version */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 sm:p-4 md:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Trips</h2>
              {trips.length > 0 ? (
                <>
                  {/* Mobile view - Card layout */}
                  <div className="block sm:hidden space-y-3">
                    {trips.map((trip) => (
                      <div key={trip.id} className="border rounded-lg p-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500">FROM</p>
                            <p className="text-sm truncate">{trip.bookings?.from_location}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">TO</p>
                            <p className="text-sm truncate">{trip.bookings?.to_location}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">DATE</p>
                            <p className="text-sm">{trip.bookings?.departure_date && new Date(trip.bookings.departure_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">VEHICLE</p>
                            <p className="text-sm">{trip.vehicles?.model}</p>
                            <p className="text-xs text-gray-500">{trip.vehicles?.plate_number}</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500">STATUS</p>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            trip.bookings?.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : trip.bookings?.status === 'PENDING' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {trip.bookings?.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop view - Table layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            From
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            To
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trips.map((trip) => (
                          <tr key={trip.id}>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                              <div className="truncate max-w-[100px] sm:max-w-none">
                                {trip.bookings?.from_location}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                              <div className="truncate max-w-[100px] sm:max-w-none">
                                {trip.bookings?.to_location}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                              {trip.bookings?.departure_date && new Date(trip.bookings.departure_date).toLocaleDateString()}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4">
                              <div className="text-xs sm:text-sm">
                                <p className="text-gray-900">{trip.vehicles?.model}</p>
                                <p className="text-gray-500">{trip.vehicles?.plate_number}</p>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4">
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
                </>
              ) : (
                <p className="text-gray-500">No recent trips found</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Section - Mobile-optimized */}
        <div id="notifications-section" className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">New Booking Requests</h2>
            
            {hasNewNotifications && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                New Requests
              </span>
            )}
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {notifications.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white border rounded-lg p-3 sm:p-4 shadow-sm ${
                      lastNotificationTime && new Date(notification.created_at) > new Date(lastNotificationTime) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {notification.bookings?.from_location} → {notification.bookings?.to_location}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                        <div>
                          <p className="text-xs text-gray-500">Date:</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {new Date(notification.bookings?.departure_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time:</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {notification.bookings?.departure_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Expires:</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {new Date(notification.expires_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Amount:</p>
                          <p className="text-xs sm:text-sm font-semibold text-green-600">
                            ₱{notification.bookings?.total_amount}
                          </p>
                        </div>
                      </div>
                      
                      {/* Add time received */}
                      <p className="text-xs text-gray-500 mt-2">
                        Received: {new Date(notification.created_at).toLocaleString()}
                      </p>
                      
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
                    
                    {/* Action buttons - Full width on mobile */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleBookingResponse(notification.id, notification.bookings?.id, true)}
                        className="bg-green-500 text-white py-2 text-xs sm:text-sm rounded hover:bg-green-600 transition-colors"
                        disabled={new Date(notification.expires_at) < new Date()}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleBookingResponse(notification.id, notification.bookings?.id, false)}
                        className="bg-red-500 text-white py-2 text-xs sm:text-sm rounded hover:bg-red-600 transition-colors"
                        disabled={new Date(notification.expires_at) < new Date()}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No new booking requests</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Confirm Action</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{confirmMessage}</p>
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}