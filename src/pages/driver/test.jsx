import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

export default function TestDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDriver, loading: driverLoading } = useDriverAuth();
  const [testing, setTesting] = useState(false);

  const createTestNotification = async () => {
    if (!user) {
      toast.error('Must be logged in to test');
      return;
    }

    setTesting(true);
    try {
      // Create a test booking with all required fields
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          from_location: 'Test Origin',
          to_location: 'Test Destination',
          departure_date: new Date().toISOString().split('T')[0],
          departure_time: '14:00',
          service_type: 'STANDARD',
          total_amount: 500,
          status: 'PENDING',
          group_size: 1,
          payment_method: 'CASH',
          payment_status: 'PENDING',
          pickup_option: 'airport'
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking error:', bookingError);
        throw bookingError;
      }

      console.log('Created booking:', booking);

      // Create a notification for the driver
      const { data: notification, error: notificationError } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: user.id,
          booking_id: booking.id,
          status: 'PENDING',
          acceptance_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          expires_at: new Date(Date.now() + 30 * 60000).toISOString()
        })
        .select();

      if (notificationError) {
        console.error('Notification error:', notificationError);
        throw notificationError;
      }

      console.log('Created notification:', notification);
      toast.success('Test notification created successfully!');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Driver Test Dashboard</h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current Status</h2>
              <p>User ID: {user?.id || 'Not logged in'}</p>
              <p>Is Driver: {isDriver ? 'Yes' : 'No'}</p>
              <p>Loading: {(authLoading || driverLoading) ? 'Yes' : 'No'}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Test Actions</h2>
              <button
                onClick={createTestNotification}
                disabled={testing || !user}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Creating...' : 'Create Test Notification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 