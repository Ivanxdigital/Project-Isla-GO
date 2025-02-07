import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('Function started', { method: req.method, body: req.body });

    // Check environment variables first
    const envCheck = {
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    console.log('Environment check:', envCheck);

    // Initialize clients inside try block with better error handling
    let twilioClient;
    try {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      // Test the credentials
      await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('Twilio credentials verified successfully');
    } catch (error) {
      console.error('Twilio initialization error:', {
        error,
        sid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 5) + '...',
        hasToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER
      });
      return res.status(500).json({ 
        error: 'Failed to initialize Twilio client',
        details: error.message
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bookingId } = req.body;
    console.log('Received bookingId:', bookingId);

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Log environment variables (without sensitive values)
    console.log('Environment check:', {
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Booking fetch error:', bookingError);
      return res.status(404).json({ error: 'Booking not found', details: bookingError });
    }

    // Fetch profile separately if user_id exists
    let customerName = 'Anonymous Customer';
    if (booking.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', booking.user_id)
        .single();
      
      if (profile) {
        customerName = profile.full_name;
      }
    }

    console.log('Booking fetched:', booking);

    // Fetch available drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active')
      .eq('documents_verified', true)
      .eq('is_available', true);

    if (driversError) {
      console.error('Drivers fetch error:', driversError);
      return res.status(500).json({ error: 'Failed to fetch drivers', details: driversError });
    }

    console.log('Drivers fetched:', drivers);

    if (!drivers?.length) {
      return res.status(404).json({ error: 'No available drivers found' });
    }

    // Update the message template
    const message = `
New IslaGO Booking Alert!
Route: ${booking.from_location} → ${booking.to_location}
Date: ${new Date(booking.departure_date).toLocaleDateString()}
Time: ${booking.departure_time}
Passengers: ${booking.group_size}
Service: ${booking.service_type}
${booking.pickup_option === 'hotel' ? `Pickup: ${booking.hotel_details?.name || 'Hotel'}` : 'Pickup: Airport'}
Customer: ${customerName}

Amount: ₱${parseFloat(booking.total_amount).toLocaleString()}

Reply YES to accept this booking.
`;

    // Add this helper function at the top of the file
    function isValidPhoneNumber(phone: string): boolean {
      // Basic validation for Philippines mobile numbers
      return /^\+63[0-9]{10}$/.test(phone);
    }

    // Test with just one driver first
    const testDriver = drivers[0];
    try {
      const formattedPhone = testDriver.mobile_number?.startsWith('+') 
        ? testDriver.mobile_number 
        : `+63${testDriver.mobile_number?.replace(/^0+/, '')}`;

      if (!isValidPhoneNumber(formattedPhone)) {
        console.error('Invalid phone number:', formattedPhone);
        return res.status(400).json({ 
          error: 'Invalid phone number',
          details: `Invalid phone number format: ${formattedPhone}`
        });
      }

      console.log('Attempting to send test SMS:', { 
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        messageLength: message.length
      });

      const result = await twilioClient.messages.create({
        body: message,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      console.log('Test SMS sent successfully:', result.sid);

      // When sending to other drivers, filter out invalid numbers
      const otherDrivers = drivers.slice(1);
      const validDrivers = otherDrivers.filter(driver => {
        const phone = driver.mobile_number?.startsWith('+') 
          ? driver.mobile_number 
          : `+63${driver.mobile_number?.replace(/^0+/, '')}`;
        return isValidPhoneNumber(phone);
      });

      const smsPromises = validDrivers.map(driver => {
        const phone = driver.mobile_number?.startsWith('+') 
          ? driver.mobile_number 
          : `+63${driver.mobile_number?.replace(/^0+/, '')}`;

        return twilioClient.messages.create({
          body: message,
          to: phone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      });

      const smsResults = await Promise.all(smsPromises);
      console.log('All SMS sent successfully:', smsResults.map(r => r.sid));

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          driver_notification_sent: true,
          driver_notification_sent_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Booking update error:', updateError);
      }

      return res.status(200).json({ 
        success: true, 
        messagesSent: smsResults.length 
      });
    } catch (error) {
      console.error('SMS sending error:', error);
      return res.status(500).json({ 
        error: 'Failed to send SMS',
        details: error.message,
        twilioError: error.code
      });
    }
  } catch (error: any) {
    console.error('Detailed error:', error);
    return res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message,
      stack: error.stack
    });
  }
} 