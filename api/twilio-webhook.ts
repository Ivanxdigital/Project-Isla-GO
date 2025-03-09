import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Initialize Twilio client
const twilioClient = new twilio.Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Add notification status enum to match database
const NOTIFICATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('1. Webhook received:', {
      method: req.method,
      body: req.body
    });

    // Parse the SMS details from Twilio
    const { Body: messageBody, From: fromNumber, MessageSid: messageId } = req.body;
    const cleanedMessage = messageBody?.toString().trim().toUpperCase() || '';
    
    // Clean the phone number (remove country code)
    const cleanedNumber = fromNumber?.toString().replace('+63', '') || '';

    console.log('2. Message details:', { 
      fromNumber: cleanedNumber, 
      messageBody: cleanedMessage,
      messageId,
      channel: 'sms'
    });

    // Find the driver by phone number
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select(`
        id,
        first_name,
        last_name,
        mobile_number,
        status
      `)
      .eq('mobile_number', cleanedNumber)
      .eq('status', 'active')
      .single();

    if (driverError || !driver) {
      console.error('3. Driver not found:', driverError);
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Find pending notification for this driver
    const { data: notification, error: notificationError } = await supabase
      .from('driver_notifications')
      .select(`
        id,
        booking_id,
        response_code,
        bookings:booking_id (
          id,
          from_location,
          to_location,
          departure_date,
          departure_time,
          service_type,
          group_size,
          profiles:user_id (
            first_name,
            last_name,
            mobile_number
          )
        )
      `)
      .eq('driver_id', driver.id)
      .eq('status', NOTIFICATION_STATUS.PENDING)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (notificationError || !notification) {
      console.error('4. No pending notification found:', notificationError);
      return res.status(404).json({ error: 'No pending booking found' });
    }

    const accepted = cleanedMessage === 'YES';
    console.log('5. Response:', { accepted });
    
    // Update notification status
    const { error: updateError } = await supabase
      .from('driver_notifications')
      .update({
        status: accepted ? NOTIFICATION_STATUS.ACCEPTED : NOTIFICATION_STATUS.REJECTED,
        response_time: new Date().toISOString(),
        twilio_message_id: messageId
      })
      .eq('id', notification.id);

    if (updateError) {
      console.error('6. Error updating notification:', updateError);
      throw updateError;
    }

    // If accepted, update booking and notify customer
    if (accepted) {
      console.log('7. Booking accepted, updating status');
      
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'assigned',
          driver_id: driver.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.booking_id);

      if (bookingError) {
        console.error('8. Error updating booking:', bookingError);
        throw bookingError;
      }

      // Notify customer via SMS
      if (notification.bookings?.profiles?.mobile_number) {
        const customerNumber = notification.bookings.profiles.mobile_number;
        const customerName = `${notification.bookings.profiles.first_name} ${notification.bookings.profiles.last_name}`;
        const driverName = `${driver.first_name} ${driver.last_name}`;
        
        // Create customer notification message
        const customerMessage = `Hello ${customerName}! Your booking has been accepted by ${driverName}. They will contact you shortly to coordinate pickup details.`;
        
        // Send SMS to customer
        await twilioClient.messages.create({
          body: customerMessage,
          to: `+63${customerNumber}`,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      }

      // Send confirmation to driver with booking details
      const driverResponse = `
Booking Confirmed!
Customer: ${notification.bookings?.profiles?.first_name} ${notification.bookings?.profiles?.last_name}
Contact: +63${notification.bookings?.profiles?.mobile_number}
From: ${notification.bookings?.from_location}
To: ${notification.bookings?.to_location}
Date: ${notification.bookings?.departure_date}
Time: ${notification.bookings?.departure_time}

Please contact the customer to coordinate pickup details.`.trim();

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>${driverResponse}</Message>
        </Response>
      `);
    } else {
      // Send decline acknowledgment
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>You have declined this booking. Thank you for your response.</Message>
        </Response>
      `);
    }

  } catch (error) {
    console.error('Error in webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 