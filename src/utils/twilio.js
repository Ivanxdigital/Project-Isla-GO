import { supabase } from './supabase.js';

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || '+14155238886';

// Add debug logs
console.log('Twilio Config:', {
  accountSid: TWILIO_ACCOUNT_SID,
  phoneNumber: TWILIO_PHONE_NUMBER,
  whatsappNumber: TWILIO_WHATSAPP_NUMBER,
  hasAuthToken: !!TWILIO_AUTH_TOKEN
});

// Add notification status enum to match database
const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'declined',
  EXPIRED: 'expired'
};

// Function to send SMS notifications to drivers
export const sendDriverNotifications = async (bookingId) => {
  try {
    console.log('1. Starting notification process for booking:', bookingId);
    
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
      const result = await createDriverNotificationsInDatabase(bookingId);
      console.log('4. Driver notifications created in database:', result);
      
      if (!result.success || result.notified === 0) {
        console.warn('No driver notifications were created in the database');
        return {
          success: false,
          message: 'No driver notifications were created'
        };
      }
    } catch (dbError) {
      console.error('Failed to create driver notifications in database:', dbError);
      // Continue with SMS attempt even if database notifications failed
    }

    // Make the API request to send SMS notifications
    console.log('5. Sending API request to notify drivers via SMS');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookingId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('6. API request failed:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('7. API response:', data);

    return data;
  } catch (error) {
    console.error('8. Error in sendDriverNotifications:', error);
    
    // Log the error to the database
    try {
      await supabase.from('driver_notification_logs').insert({
        booking_id: bookingId,
        status_code: 500,
        response: JSON.stringify({ error: error.message }),
        created_at: new Date().toISOString()
      });
      console.log('9. Error logged to database');
    } catch (logError) {
      console.error('10. Failed to log error to database:', logError);
    }
    
    throw error;
  }
};

// Function to create driver notifications in the database
export const createDriverNotificationsInDatabase = async (bookingId) => {
  try {
    console.log('Creating driver notifications in database for booking:', bookingId);
    
    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
      
    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw bookingError;
    }
    
    console.log('Booking details fetched successfully:', booking.id);
    
    // Get available drivers
    const { data: availableDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active');
      
    if (driversError) {
      console.error('Error fetching available drivers:', driversError);
      throw driversError;
    }
    
    console.log('Found', availableDrivers.length, 'available drivers');
    
    if (availableDrivers.length === 0) {
      console.log('No available drivers found');
      return {
        success: false,
        notified: 0,
        total: 0
      };
    }
    
    // Create notifications for each driver
    const notificationPromises = availableDrivers.map(driver => {
      // Set expiry time to 5 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      // Generate a random response code
      const responseCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      console.log(`Creating notification for driver ${driver.id} with expiry ${expiresAt.toISOString()}`);
      
      return supabase
        .from('driver_notifications')
        .insert({
          driver_id: driver.id,
          booking_id: bookingId,
          status: NOTIFICATION_STATUS.PENDING,
          response_code: responseCode,
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
      
      // Log the specific errors
      errors.forEach((result, index) => {
        console.error(`Error creating notification ${index}:`, result.error);
      });
    }
    
    const successCount = availableDrivers.length - errors.length;
    console.log(`Successfully created ${successCount} out of ${availableDrivers.length} notifications`);
    
    // Update booking to indicate notification was attempted
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'finding_driver',
        driver_notification_attempted: true,
        driver_notification_attempted_at: new Date().toISOString(),
        driver_notification_success: errors.length < availableDrivers.length
      })
      .eq('id', bookingId);
      
    if (updateError) {
      console.error('Error updating booking status:', updateError);
    } else {
      console.log('Booking status updated to finding_driver');
    }
    
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
    const status = accepted ? NOTIFICATION_STATUS.ACCEPTED : NOTIFICATION_STATUS.REJECTED;
    
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