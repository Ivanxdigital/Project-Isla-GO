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

export const sendBookingNotificationToDrivers = async (bookingId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Got session:', !!session, 'Token:', session?.access_token?.substring(0, 20) + '...');
    
    const baseUrl = import.meta.env.DEV 
      ? 'http://localhost:54321/functions/v1'
      : 'https://achpbaomhjddqycgzomw.supabase.co/functions/v1';
    
    const url = `${baseUrl}/twilio-webhook/send-sms`;
    console.log('Attempting to call Edge Function:', {
      url,
      method: 'POST',
      hasToken: !!session?.access_token
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ bookingId }),
    });

    console.log('Edge Function Response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    const data = await response.json();
    console.log('Edge Function Data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to notify drivers');
    }

    return true;
  } catch (error) {
    console.error('Error sending notifications:', error);
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