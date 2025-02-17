import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple debug logger implementation
const DebugLogger = {
  info: (context: string, message: string) => {
    console.log(`[${context}] ${message}`);
  }
};

const isTrialAccount = true;

interface Driver {
  id: string;
  mobile_number: string;
  status: string;
}

interface Booking {
  id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  user_id?: string;
}

// Generate a unique acceptance code
const generateAcceptanceCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Add this function to verify numbers
const isVerifiedNumber = async (twilioClient: twilio.Twilio, phoneNumber: string): Promise<boolean> => {
  try {
    const verifiedNumbers = await twilioClient.outgoingCallerIds.list();
    return verifiedNumbers.some(v => v.phoneNumber === phoneNumber);
  } catch (error) {
    console.error('Error checking verified numbers:', error);
    return false;
  }
};

const BATCH_SIZE = 50;
const BATCH_DELAY = 1000;
const MAX_RETRIES = 3;

interface SMSResult {
  success: boolean;
  data?: MessageInstance;
  error?: any;
  driverId?: string;
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing required Twilio environment variables');
}

const client = twilio(accountSid, authToken);

// Add these validation functions after the interfaces
const validatePhoneNumber = (phoneNumber: string): string => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ensure it starts with country code
  if (!cleaned.startsWith('63')) {
    cleaned = '63' + cleaned.replace(/^0+/, '');
  }
  
  // Add the plus sign
  return '+' + cleaned;
};

const validateMessageLength = (message: string): boolean => {
  // Twilio's SMS length limit is 1600 characters
  return message.length <= 1600;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Error fetching booking: ${bookingError?.message || 'Not found'}`);
    }

    // Add message template validation
    const messageTemplate = `New booking alert!
From: ${booking.from_location}
To: ${booking.to_location}
Date: ${new Date(booking.departure_date).toLocaleDateString()}
Time: ${booking.departure_time}

Reply with code {acceptanceCode} to accept this booking.
This offer expires in 30 minutes.`;

    if (!validateMessageLength(messageTemplate)) {
      throw new Error('Message template exceeds maximum length');
    }

    // Get drivers that haven't been notified yet
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active')
      .not('id', 'in', (
        supabase
          .from('driver_notifications')
          .select('driver_id')
          .eq('booking_id', bookingId)
          .in('status', ['SENT', 'ACCEPTED'])
      ));

    if (driversError) {
      throw new Error(`Error fetching drivers: ${driversError?.message}`);
    }

    DebugLogger.info('SMS_API', `Found ${drivers?.length || 0} drivers to notify`);

    if (!drivers?.length) {
      return res.status(200).json({ 
        success: true, 
        message: 'No new drivers to notify' 
      });
    }

    const acceptanceCode = generateAcceptanceCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Code expires in 30 minutes

    const results: SMSResult[] = [];

    for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
      const batch = drivers.slice(i, i + BATCH_SIZE);
      
      for (const driver of batch) {
        const phone = validatePhoneNumber(driver.mobile_number);

        // Add trial account message prefix
        const messageBody = isTrialAccount 
          ? `[Test] ${messageTemplate.replace('{acceptanceCode}', acceptanceCode)}`
          : messageTemplate.replace('{acceptanceCode}', acceptanceCode);

        if (isTrialAccount) {
          const isVerified = await isVerifiedNumber(client, phone);
          if (!isVerified) {
            DebugLogger.info('SMS_API', `Skipping unverified number in trial mode: ${phone}`);
            // Record skipped notification
            await supabase
              .from('driver_notifications')
              .insert({
                driver_id: driver.id,
                booking_id: bookingId,
                acceptance_code: acceptanceCode,
                status: 'SKIPPED',
                expires_at: expiresAt.toISOString(),
                error: 'Unverified number in trial mode'
              });
            continue;
          }
        }

        let success = false;
        let error = null;
        let messageData = null;

        // Try sending SMS with retries
        for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
          try {
            const message = await client.messages.create({
              body: messageBody,
              to: phone,
              from: twilioPhoneNumber,
              statusCallback: `${process.env.VERCEL_URL}/api/twilio-webhook` // Add status callback
            });

            success = true;
            messageData = message;
          } catch (err) {
            error = err;
            if (attempt < MAX_RETRIES - 1) {
              await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
            }
          }
        }

        // Record the notification attempt
        const { error: notificationError } = await supabase
          .from('driver_notifications')
          .insert({
            driver_id: driver.id,
            booking_id: bookingId,
            acceptance_code: acceptanceCode,
            status: success ? 'SENT' : 'FAILED',
            expires_at: expiresAt.toISOString(),
            error: error ? JSON.stringify(error) : null,
            message_sid: messageData?.sid
          });

        if (notificationError) {
          console.error('Error recording notification:', notificationError);
        }

        results.push({
          success,
          data: messageData || undefined,
          error,
          driverId: driver.id
        });
      }

      if (i + BATCH_SIZE < drivers.length) {
        await delay(BATCH_DELAY);
      }
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({ 
        driver_notification_sent: true,
        driver_notification_sent_at: new Date().toISOString(),
        status: 'PENDING_DRIVER_ACCEPTANCE'
      })
      .eq('id', bookingId);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return res.status(200).json({ 
      success: true, 
      messagesSent: successCount,
      failed: failureCount,
      totalDrivers: drivers.length
    });

  } catch (error) {
    console.error('SMS notification error:', error);
    return res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 