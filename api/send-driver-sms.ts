import { Twilio } from 'twilio';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to format phone number
const formatPhoneNumber = (number: string) => {
  // Remove any non-digit characters
  const cleaned = number.replace(/\D/g, '');
  // Ensure number starts with country code (63 for Philippines)
  return cleaned.startsWith('63') ? `+${cleaned}` : `+63${cleaned}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS with proper headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log the incoming request
  console.log('Received request:', {
    method: req.method,
    path: req.url,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    },
    body: req.body
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST'],
      receivedMethod: req.method
    });
  }

  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Get booking details with customer info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          mobile_number
        )
      `)
      .eq('id', bookingId)
      .single();

    console.log('Booking query result:', {
      hasBooking: !!booking,
      error: bookingError?.message
    });

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get available drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active')
      .eq('documents_verified', true)
      .eq('is_available', true)
      .not('mobile_number', 'is', null);

    console.log('Drivers query result:', {
      driverCount: drivers?.length,
      error: driversError?.message
    });

    if (driversError) {
      console.error('Error fetching drivers:', driversError);
      return res.status(500).json({ error: 'Failed to fetch drivers' });
    }

    if (!drivers?.length) {
      return res.status(404).json({ error: 'No available drivers found' });
    }

    // Create message content
    const messageContent = `
New Booking Alert!
From: ${booking.from_location}
To: ${booking.to_location}
Date: ${booking.departure_date}
Time: ${booking.departure_time}
Service: ${booking.service_type}
Customer: ${booking.customers.first_name} ${booking.customers.last_name}

Reply YES to accept this booking.
`.trim();

    // Send SMS to each driver
    const notificationPromises = drivers.map(async (driver) => {
      try {
        // Format phone number
        const formattedNumber = formatPhoneNumber(driver.mobile_number);

        // Send SMS via Twilio
        const message = await twilioClient.messages.create({
          body: messageContent,
          to: formattedNumber,
          from: process.env.TWILIO_PHONE_NUMBER
        });

        // Create notification record
        await supabase
          .from('driver_notifications')
          .insert({
            booking_id: bookingId,
            driver_id: driver.id,
            status: 'PENDING',
            twilio_message_id: message.sid
          });

        return {
          driverId: driver.id,
          success: true,
          messageId: message.sid
        };
      } catch (error) {
        console.error(`Failed to send SMS to driver ${driver.id}:`, error);
        return {
          driverId: driver.id,
          success: false,
          error: error.message
        };
      }
    });

    // Wait for all notifications to be sent
    const results = await Promise.all(notificationPromises);

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'finding_driver',
        driver_notification_attempted: true,
        driver_notification_attempted_at: new Date().toISOString(),
        driver_notification_success: results.some(r => r.success)
      })
      .eq('id', bookingId);

    // Return results
    return res.status(200).json({
      success: true,
      notified: results.filter(r => r.success).length,
      total: drivers.length,
      results
    });

  } catch (error) {
    console.error('Error in send-driver-sms handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 