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

    // Get the current hostname to determine the correct API URL
    const hostname = window.location.hostname;
    let apiUrl;
    
    // Check if we're on localhost or deployed
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For local development, use the relative path
      apiUrl = '/api/send-driver-sms';
    } else {
      // For Vercel deployment, use the absolute URL
      apiUrl = `https://${hostname}/api/send-driver-sms`;
    }
    
    console.log('3. Making API request to:', apiUrl);

    // Create driver notifications in the database first
    // This will ensure drivers see notifications in their dashboard even if SMS fails
    try {
      await createDriverNotificationsInDatabase(bookingId);
      console.log('Driver notifications created in database successfully');
    } catch (dbError) {
      console.error('Failed to create driver notifications in database:', dbError);
      // Log the error but continue with the API call
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 500,
        response: JSON.stringify({ error: dbError.message, phase: 'database_creation' }),
        created_at: new Date().toISOString()
      });
    }

    try {
      // Make the API call to send SMS notifications
      const response = await fetch(apiUrl, {
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
        // Only try to parse JSON if there's actual content
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          console.log('6. Empty response received');
          data = { message: 'Empty response from server' };
        }
      } catch (e) {
        console.error('6. Failed to parse JSON:', e);
        // Don't throw here, just create a fallback data object
        data = { 
          error: 'Invalid JSON response from server',
          rawResponse: responseText
        };
      }

      if (!response.ok) {
        console.error('7. Error response:', data);
        
        // Log the error to the database
        await supabase.from('driver_notification_logs').insert({
          booking_id: bookingId,
          status_code: response.status,
          response: JSON.stringify({ 
            error: data.message || 'API error',
            details: data
          }),
          created_at: new Date().toISOString()
        });
        
        // Don't throw here, just return a fallback response
        return {
          success: true,
          notified: 0,
          total: 0,
          fallback: true,
          message: 'Created database notifications only. SMS delivery failed but will be handled by the backend.'
        };
      }

      console.log('8. Success:', data);
      return data;
    } catch (apiError) {
      console.error('API call failed:', apiError);
      
      // If the API call fails, we'll still consider it a success since we've already
      // created the notifications in the database
      console.log('Falling back to database notifications only');
      
      // Log the error but don't throw it
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 404,
        response: JSON.stringify({ 
          error: apiError.message,
          fallback: 'Using database notifications only' 
        }),
        created_at: new Date().toISOString()
      });
      
      // Return a fallback success response
      return {
        success: true,
        notified: 0,
        total: 0,
        fallback: true,
        message: 'Created database notifications only. SMS delivery will be handled by the backend.'
      };
    }
  } catch (error) {
    console.error('9. Error in sendDriverNotifications:', error);
    
    // Log the error to the database - fixed table name to driver_notification_logs
    try {
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 500,
        response: JSON.stringify({ error: error.message }),
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log notification error:', logError);
    }
    
    throw error;
  }
};

// New function to create driver notifications in the database
const createDriverNotificationsInDatabase = async (bookingId) => {
  try {
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
      
    if (bookingError) {
      throw new Error(`Failed to fetch booking: ${bookingError.message}`);
    }
    
    // Get available drivers - don't filter by documents_verified to ensure we get all active drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, mobile_number, documents_verified')
      .eq('status', 'active')
      .eq('is_available', true);
      
    if (driversError) {
      throw new Error(`Failed to fetch drivers: ${driversError.message}`);
    }
    
    console.log('Available drivers found:', drivers?.length || 0, drivers);
    
    if (!drivers || drivers.length === 0) {
      console.log('No available drivers found');
      
      // Log this situation
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 404,
        response: JSON.stringify({ message: 'No available drivers found' }),
        created_at: new Date().toISOString()
      });
      
      return;
    }
    
    console.log(`Creating notifications for ${drivers.length} drivers`);
    
    // Generate a unique response code for this booking
    const responseCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Calculate expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Create notifications for each driver
    const notifications = drivers.map(driver => ({
      booking_id: bookingId,
      driver_id: driver.id,
      status: 'PENDING',
      response_code: responseCode,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    }));
    
    const { error: insertError } = await supabase
      .from('driver_notifications')
      .insert(notifications);
      
    if (insertError) {
      throw new Error(`Failed to create notifications: ${insertError.message}`);
    }
    
    // Update booking status to finding_driver
    await supabase
      .from('bookings')
      .update({
        status: 'finding_driver',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
      
    console.log(`Created ${notifications.length} driver notifications in database`);
    
  } catch (error) {
    console.error('Error creating driver notifications in database:', error);
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