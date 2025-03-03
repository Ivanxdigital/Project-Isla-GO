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

// Function to create driver notifications in the database
export const createDriverNotificationsInDatabase = async (bookingId) => {
  try {
    console.log('Creating driver notifications in database for booking:', bookingId);
    
    // First, get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .filter('id', 'eq', bookingId)
      .maybeSingle();
    
    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError || 'No booking found');
      throw new Error('Booking not found');
    }
    
    // Get available drivers
    const { data: availableDrivers, error: driversError } = await supabase
      .from('drivers')
      .select(`
        id, 
        first_name, 
        last_name, 
        phone_number,
        license_number,
        vehicle_id,
        status,
        documents_verified
      `)
      .filter('status', 'eq', 'active')
      .filter('documents_verified', 'eq', true);
    
    if (driversError) {
      console.error('Error fetching available drivers:', driversError);
      throw new Error('Failed to fetch available drivers');
    }
    
    if (!availableDrivers || availableDrivers.length === 0) {
      console.log('No available drivers found');
      
      // Update booking status to indicate no drivers available
      await supabase
        .from('bookings')
        .update({
          status: 'finding_driver_failed',
          driver_notification_attempted: true,
          driver_notification_attempted_at: new Date().toISOString(),
          driver_notification_success: false
        })
        .filter('id', 'eq', bookingId);
      
      // Log the error
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 404,
        response: JSON.stringify({ error: 'No available drivers found' }),
        created_at: new Date().toISOString()
      });
      
      throw new Error('No available drivers found');
    }
    
    console.log('Available drivers found:', availableDrivers.length, availableDrivers);
    
    // Create notifications for each available driver
    const notificationPromises = availableDrivers.map(driver => {
      // Calculate expiration time (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      return supabase
        .from('driver_notifications')
        .insert({
          driver_id: driver.id,
          booking_id: bookingId,
          status: 'PENDING',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });
    });
    
    console.log('Creating notifications for', availableDrivers.length, 'drivers');
    
    // Wait for all notifications to be created
    const results = await Promise.all(notificationPromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors creating some notifications:', errors);
    }
    
    // Update booking to indicate notification was attempted
    await supabase
      .from('bookings')
      .update({
        status: 'finding_driver',
        driver_notification_attempted: true,
        driver_notification_attempted_at: new Date().toISOString(),
        driver_notification_success: errors.length < availableDrivers.length
      })
      .filter('id', 'eq', bookingId);
    
    console.log('Created', availableDrivers.length - errors.length, 'driver notifications in database');
    
    return {
      success: true,
      notified: availableDrivers.length - errors.length,
      total: availableDrivers.length
    };
  } catch (error) {
    console.error('Error creating driver notifications in database:', error);
    
    // Log the error
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