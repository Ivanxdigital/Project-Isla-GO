import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Twilio client
const twilioClient = new twilio.Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('1. Webhook received:', {
      method: req.method,
      body: req.body
    });

    // Parse the SMS details from Twilio
    const { Body: messageBody, From: fromNumber, MessageSid: messageId } = req.body;
    const cleanedMessage = messageBody?.toString().trim().toUpperCase() || '';
    const cleanedNumber = fromNumber?.toString().replace('+63', '') || '';

    console.log('2. SMS details:', { 
      fromNumber: cleanedNumber, 
      messageBody: cleanedMessage,
      messageId 
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
        driver_id,
        status,
        created_at,
        bookings (
          id,
          status,
          from_location,
          to_location,
          departure_date,
          departure_time,
          customers (
            id,
            first_name,
            last_name,
            mobile_number
          )
        )
      `)
      .eq('driver_id', driver.id)
      .eq('status', 'PENDING')
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
        status: accepted ? 'ACCEPTED' : 'DECLINED',
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
      if (notification.bookings?.customers?.mobile_number) {
        const customerMessage = `Your booking has been accepted by ${driver.first_name} ${driver.last_name}. They will contact you shortly to coordinate pickup details.`;
        await twilioClient.messages.create({
          body: customerMessage,
          to: `+63${notification.bookings.customers.mobile_number}`,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      }

      // Send confirmation to driver with booking details
      const driverResponse = `
Booking Confirmed!
Customer: ${notification.bookings?.customers?.first_name} ${notification.bookings?.customers?.last_name}
Contact: +63${notification.bookings?.customers?.mobile_number}
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