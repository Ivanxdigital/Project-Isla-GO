import { supabase } from '../utils/supabase.js';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Fetch booking details
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

    if (bookingError) {
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }

    // Fetch available drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('mobile_number')
      .eq('status', 'active');

    if (driversError) {
      throw new Error(`Error fetching drivers: ${driversError.message}`);
    }

    // Send SMS to each available driver
    const messagePromises = drivers.map(driver => {
      const messageBody = `New booking alert!\n
        From: ${booking.from_location}\n
        To: ${booking.to_location}\n
        Date: ${booking.departure_date}\n
        Time: ${booking.departure_time}\n
        Service: ${booking.service_type}\n
        Group Size: ${booking.group_size}\n
        Reply YES to accept this booking.`;

      return client.messages.create({
        body: messageBody,
        to: driver.mobile_number,
        from: twilioPhoneNumber
      });
    });

    await Promise.all(messagePromises);

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
      throw new Error(`Error updating booking status: ${updateError.message}`);
    }

    return res.status(200).json({ 
      success: true, 
      message: `SMS sent to ${drivers.length} drivers` 
    });

  } catch (error) {
    console.error('SMS notification error:', error);
    return res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error.message 
    });
  }
} 