import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { DebugLogger } from '../src/utils/debug-logger';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { supabase } from '../src/utils/supabase';

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

    // Get drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active');

    if (driversError || !drivers) {
      throw new Error(`Error fetching drivers: ${driversError?.message || 'No drivers found'}`);
    }

    DebugLogger.info('SMS_API', `Found ${drivers.length} active drivers`);

    if (!drivers.length) {
      return res.status(404).json({ error: 'No active drivers found' });
    }

    const acceptanceCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const smsPromises: Promise<MessageInstance>[] = [];

    for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
      const batch = drivers.slice(i, i + BATCH_SIZE);
      
      for (const driver of batch) {
        const phone = driver.mobile_number?.startsWith('+') 
          ? driver.mobile_number 
          : `+63${driver.mobile_number?.replace(/^0+/, '')}`;

        if (isTrialAccount) {
          const isVerified = await isVerifiedNumber(client, phone);
          if (!isVerified) {
            DebugLogger.info('SMS_API', `Skipping unverified number in trial mode: ${phone}`);
            continue;
          }
        }

        smsPromises.push(
          client.messages.create({
            body: `New booking received!
Booking ID: ${bookingId}
From: ${booking.from_location}
To: ${booking.to_location}
Date: ${new Date(booking.departure_date).toLocaleDateString()}
Time: ${booking.departure_time}

Reply with code ${acceptanceCode} to accept this booking.
This offer expires in 30 minutes.`,
            to: phone,
            from: twilioPhoneNumber
          })
        );
      }

      if (i + BATCH_SIZE < drivers.length) {
        await delay(BATCH_DELAY);
      }
    }

    if (smsPromises.length === 0) {
      return res.status(200).json({ 
        success: true, 
        messagesSent: 0,
        warning: 'No verified numbers found'
      });
    }

    const results = await Promise.all(
      smsPromises.map(async (promise) => {
        try {
          const result = await promise;
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error };
        }
      })
    );

    // Update booking status
    await supabase
      .from('bookings')
      .update({ 
        driver_notification_sent: true,
        driver_notification_sent_at: new Date().toISOString(),
        status: 'PENDING_DRIVER_ACCEPTANCE'
      })
      .eq('id', bookingId);

    return res.status(200).json({ 
      success: true, 
      messagesSent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('SMS notification error:', error);
    return res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 