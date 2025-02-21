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
    console.log('1. Starting notification process:', bookingId);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('2. Auth session:', {
      hasSession: !!session,
      hasToken: !!session?.access_token
    });

    if (!session) {
      throw new Error('No authenticated session found');
    }

    const baseUrl = import.meta.env.PROD 
      ? 'https://islago.vercel.app'
      : 'http://localhost:3000';
    
    console.log('3. Making API request to:', `${baseUrl}/api/send-driver-sms`);

    const response = await fetch(`${baseUrl}/api/send-driver-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookingId }),
      mode: 'cors'
    });

    console.log('4. Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const responseText = await response.text();
    console.log('5. Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('6. Failed to parse JSON:', e);
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      console.error('7. Error response:', data);
      throw new Error(data.message || 'Failed to send notifications');
    }

    console.log('8. Success:', data);
    return data;
  } catch (error) {
    console.error('9. Error in sendDriverNotifications:', error);
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