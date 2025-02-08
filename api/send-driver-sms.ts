import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import type { Twilio } from 'twilio';

const isTrialAccount = true; // Since we confirmed it's a trial account

// Add this function to verify numbers
const isVerifiedNumber = async (twilioClient: Twilio, phoneNumber: string) => {
  try {
    // Get list of verified numbers
    const verifiedNumbers = await twilioClient.outgoingCallerIds.list();
    return verifiedNumbers.some(v => v.phoneNumber === phoneNumber);
  } catch (error) {
    console.error('Error checking verified numbers:', error);
    return false;
  }
};

// Add this type for better type safety
type SMSResponse = {
  accepted: boolean;
  messagesSent: number;
  success: boolean;
  warning?: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('SMS Function started', { 
      method: req.method, 
      body: req.body,
      hasBookingId: !!req.body?.bookingId 
    });

    // Check environment variables with more detail
    const envCheck = {
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      twilioSidLength: process.env.TWILIO_ACCOUNT_SID?.length,
      twilioTokenLength: process.env.TWILIO_AUTH_TOKEN?.length,
      twilioPhoneFormat: process.env.TWILIO_PHONE_NUMBER?.startsWith('+')
    };

    console.log('Environment check:', envCheck);

    // Initialize clients inside try block with better error handling
    let twilioClient: Twilio;
    try {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      
      // Test the credentials
      await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      console.log('Twilio credentials verified successfully');
    } catch (error: any) {
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

    // Fetch booking details with customer info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (
          full_name
        )
      `)
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
      .eq('status', 'active');

    if (driversError) {
      console.error('Error fetching drivers:', driversError);
      throw driversError;
    }

    console.log(`Found ${drivers?.length || 0} active drivers`);

    if (!drivers?.length) {
      return res.status(404).json({ error: 'No active drivers found' });
    }

    // For trial accounts, only send to verified numbers
    const smsPromises = [];
    for (const driver of drivers) {
      const phone = driver.mobile_number?.startsWith('+') 
        ? driver.mobile_number 
        : `+63${driver.mobile_number?.replace(/^0+/, '')}`;

      if (isTrialAccount) {
        const isVerified = await isVerifiedNumber(twilioClient, phone);
        if (!isVerified) {
          console.log(`Skipping unverified number in trial mode: ${phone}`);
          continue;
        }
      }

      console.log(`Sending SMS to driver: ${driver.id} at ${phone}`);
      smsPromises.push(
        twilioClient.messages.create({
          body: `New booking received!
Booking ID: ${bookingId}
From: ${booking.from_location}
To: ${booking.to_location}
Date: ${new Date(booking.departure_date).toLocaleDateString()}
Time: ${booking.departure_time}

Reply with code ${acceptanceCode} to accept this booking.
Or visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/driver/dashboard

This offer expires in 30 minutes.`,
          to: phone,
          from: process.env.TWILIO_PHONE_NUMBER
        })
      );
    }

    if (smsPromises.length === 0) {
      console.log('No verified numbers to send SMS to');
      return res.status(200).json({ 
        success: true, 
        messagesSent: 0,
        warning: 'No verified numbers found. In trial mode, SMS can only be sent to verified numbers.'
      });
    }

    const smsResults = await Promise.all(smsPromises);
    console.log('SMS sent successfully:', smsResults.map(r => ({ 
      sid: r.sid, 
      status: r.status,
      to: r.to 
    })));

    // Create a unique acceptance code for this booking
    const acceptanceCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store the acceptance code in driver_notifications
    await supabase
      .from('driver_notifications')
      .insert(drivers.map(driver => ({
        driver_id: driver.id,
        booking_id: bookingId,
        status: 'PENDING',
        acceptance_code: acceptanceCode,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiry
      })));

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        driver_notification_sent: true,
        driver_notification_sent_at: new Date().toISOString(),
        status: 'PENDING_DRIVER_ACCEPTANCE'
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Booking update error:', updateError);
    }

    return res.status(200).json({ 
      success: true, 
      messagesSent: smsResults.length 
    });
  } catch (error: any) {
    console.error('Detailed error:', error);
    return res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message,
      stack: error.stack
    });
  }
} 