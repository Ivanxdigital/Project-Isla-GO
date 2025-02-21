import { supabase } from './supabase.js';

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

// Add debug logs
console.log('Twilio Config:', {
  accountSid: TWILIO_ACCOUNT_SID,
  phoneNumber: TWILIO_PHONE_NUMBER,
  hasAuthToken: !!TWILIO_AUTH_TOKEN
});

// Function to send SMS notifications to drivers
export const sendDriverNotifications = async (bookingId) => {
  try {
    console.log('Starting driver notification process for booking:', bookingId);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session retrieved:', !!session);

    if (!session) {
      throw new Error('No authenticated session found');
    }

    console.log('Sending notification request to API');
    const response = await fetch('/api/send-driver-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookingId })
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(errorData.message || 'Failed to send notifications');
    }

    const data = await response.json();
    console.log('Driver notification response:', data);

    return data;
  } catch (error) {
    console.error('Error in sendDriverNotifications:', error);
    throw error;
  }
};

// Add function to handle driver responses
export const handleDriverResponse = async (driverId, bookingId, accepted) => {
  try {
    const status = accepted ? 'ACCEPTED' : 'DECLINED';
    
    // Update the driver notification status
    const { error: updateError } = await supabase
      .from('driver_notifications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .match({ driver_id: driverId, booking_id: bookingId });

    if (updateError) throw updateError;

    // If driver accepted, update booking status and create assignment
    if (accepted) {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;
    }

    return true;
  } catch (error) {
    console.error('Error handling driver response:', error);
    throw error;
  }
}; 