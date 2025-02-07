import { Twilio } from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Initialize Twilio
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.body;

    // Fetch booking details with customer info and route details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey(full_name, mobile_number),
        routes!bookings_route_id_fkey(estimated_duration)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Fetch available drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select(`
        *,
        vehicles(model, plate_number)
      `)
      .eq('status', 'available')
      .eq('documents_verified', true);

    if (driversError) throw driversError;

    // Send SMS to each available driver
    const smsPromises = drivers.map(driver => {
      const message = `
New IslaGO Booking Alert!
Route: ${booking.from_location} → ${booking.to_location}
Date: ${new Date(booking.departure_date).toLocaleDateString()}
Time: ${booking.departure_time}
Passengers: ${booking.group_size}
Service: ${booking.service_type}
${booking.pickup_option === 'hotel' ? `Pickup: ${booking.hotel_details.name}` : 'Pickup: Airport'}
Customer: ${booking.profiles.full_name}

Est. Duration: ${booking.routes.estimated_duration}
Amount: ₱${parseFloat(booking.total_amount).toLocaleString()}

Reply YES to accept this booking.
`;

      // Format phone number for Twilio (ensure it has +63 prefix)
      const formattedPhone = driver.mobile_number.startsWith('+') 
        ? driver.mobile_number 
        : `+63${driver.mobile_number.replace(/^0+/, '')}`;

      return twilioClient.messages.create({
        body: message,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      });
    });

    await Promise.all(smsPromises);

    // Update booking status to indicate notifications sent
    await supabase
      .from('bookings')
      .update({ 
        driver_notification_sent: true,
        driver_notification_sent_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ error: 'Failed to send SMS' });
  }
} 