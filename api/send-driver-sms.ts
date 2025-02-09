import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import type { Twilio } from 'twilio';
import { logger } from '../src/utils/debug-logger';

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

// Add these types at the top
interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2
};

// Add this helper function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add retry wrapper function
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string
): Promise<T> {
  let lastError: any;
  let attempt = 1;
  let delayTime = config.delayMs;

  while (attempt <= config.maxAttempts) {
    try {
      logger.debug('SMS_API', `Attempt ${attempt} for ${context}`);
      const result = await operation();
      if (attempt > 1) {
        logger.info('SMS_API', `Succeeded on attempt ${attempt} for ${context}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      logger.error('SMS_API', `Attempt ${attempt} failed for ${context}`, error as Error);
      
      if (attempt === config.maxAttempts) {
        break;
      }

      logger.debug('SMS_API', `Waiting ${delayTime}ms before retry`);
      await delay(delayTime);
      delayTime *= config.backoffFactor;
      attempt++;
    }
  }

  throw new Error(`Failed after ${config.maxAttempts} attempts: ${lastError.message}`);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  logger.info('SMS_API', 'Handler started', { method: req.method });

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
    logger.debug('SMS_API', 'Processing booking', { bookingId });

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

    // Get booking details with retry
    const { data: booking } = await withRetry(
      async () => {
        const result = await supabase
          .from('bookings')
          .select(`
            *,
            profiles (
              full_name
            )
          `)
          .eq('id', bookingId)
          .single();
        
        if (result.error) throw result.error;
        return result;
      },
      undefined,
      'fetch_booking'
    );

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

    logger.info('SMS_API', 'Booking fetched', { booking });

    // Get drivers with retry
    const { data: drivers } = await withRetry(
      async () => {
        const result = await supabase
          .from('drivers')
          .select('*')
          .eq('status', 'active');
        
        if (result.error) throw result.error;
        return result;
      },
      undefined,
      'fetch_drivers'
    );

    logger.info('SMS_API', `Found ${drivers?.length || 0} active drivers`);

    if (!drivers?.length) {
      return res.status(404).json({ error: 'No active drivers found' });
    }

    // Move acceptanceCode declaration before its use
    const acceptanceCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // For trial accounts, only send to verified numbers
    const smsPromises = [];
    for (const driver of drivers) {
      const phone = driver.mobile_number?.startsWith('+') 
        ? driver.mobile_number 
        : `+63${driver.mobile_number?.replace(/^0+/, '')}`;

      if (isTrialAccount) {
        const isVerified = await isVerifiedNumber(twilioClient, phone);
        if (!isVerified) {
          logger.info('SMS_API', `Skipping unverified number in trial mode: ${phone}`);
          continue;
        }
      }

      logger.info('SMS_API', `Sending SMS to driver: ${driver.id} at ${phone}`);
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
      logger.info('SMS_API', 'No verified numbers to send SMS to');
      return res.status(200).json({ 
        success: true, 
        messagesSent: 0,
        warning: 'No verified numbers found. In trial mode, SMS can only be sent to verified numbers.'
      });
    }

    const smsResults = await Promise.all(smsPromises);
    logger.info('SMS_API', 'SMS sent successfully:', smsResults.map(r => ({ 
      sid: r.sid, 
      status: r.status,
      to: r.to 
    })));

    // Store the acceptance code in driver_notifications
    await withRetry(
      async () => {
        const { error } = await supabase
          .from('driver_notifications')
          .insert(drivers.map(driver => ({
            driver_id: driver.id,
            booking_id: bookingId,
            status: 'PENDING',
            acceptance_code: acceptanceCode,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiry
          })));
        
        if (error) throw error;
      },
      undefined,
      'update_notification_tracking'
    );

    // Update booking status
    await withRetry(
      async () => {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            driver_notification_sent: true,
            driver_notification_sent_at: new Date().toISOString(),
            status: 'PENDING_DRIVER_ACCEPTANCE'
          })
          .eq('id', bookingId);
        
        if (updateError) throw updateError;
      },
      undefined,
      'update_booking_status'
    );

    return res.status(200).json({ 
      success: true, 
      messagesSent: smsResults.length 
    });
  } catch (error: any) {
    logger.error('SMS_API', 'Handler failed', error as Error);
    return res.status(500).json({
      error: 'Failed to send notifications',
      details: error.message,
      logs: logger.getLogs('error', 'SMS_API')
    });
  }
} 