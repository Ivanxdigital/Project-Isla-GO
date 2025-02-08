import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Create a test booking with more complete data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        from_location: 'Test Origin',
        to_location: 'Test Destination',
        departure_date: new Date().toISOString().split('T')[0],
        departure_time: '14:00',
        return_date: null, // Optional
        return_time: null, // Optional
        service_type: 'STANDARD',
        group_size: 2,
        payment_method: 'CASH',
        total_amount: 1000,
        payment_status: 'PENDING',
        status: 'PENDING',
        pickup_option: 'DIRECT',
        hotel_pickup: null,
        hotel_details: null,
        confirmation_email_sent: false,
        driver_notification_sent: false,
        driver_notification_attempted: false,
        driver_notification_success: false
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw bookingError;
    }

    console.log('Test booking created:', booking);

    // Test the SMS notification
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-driver-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        bookingId: booking.id,
        test: true
      }),
    });

    const result = await response.json();
    
    return res.status(200).json({
      success: true,
      booking,
      smsResult: result
    });
  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({ error: 'Test failed', details: error });
  }
} 