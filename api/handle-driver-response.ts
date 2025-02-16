import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { From, Body } = req.body;
    const acceptanceCode = Body.trim().toUpperCase();

    // Find the notification with this acceptance code
    const { data: notification, error: notificationError } = await supabase
      .from('driver_notifications')
      .select(`
        *,
        bookings (
          id,
          status,
          from_location,
          to_location,
          departure_date,
          departure_time,
          service_type,
          group_size
        )
      `)
      .eq('acceptance_code', acceptanceCode)
      .eq('status', 'SENT')
      .single();

    if (notificationError || !notification) {
      return res.status(404).json({ error: 'Invalid or expired code' });
    }

    // Check if code has expired
    if (new Date(notification.expires_at) < new Date()) {
      await supabase
        .from('driver_notifications')
        .update({ status: 'EXPIRED' })
        .eq('id', notification.id);
      
      return res.status(400).json({ error: 'Code has expired' });
    }

    // Check if booking is still available
    if (notification.bookings.status !== 'PENDING_DRIVER_ACCEPTANCE') {
      await supabase
        .from('driver_notifications')
        .update({ status: 'CANCELLED' })
        .eq('id', notification.id);
      
      return res.status(400).json({ error: 'Booking is no longer available' });
    }

    // Update notification status
    const { error: updateNotificationError } = await supabase
      .from('driver_notifications')
      .update({ 
        status: 'ACCEPTED',
        responded_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    if (updateNotificationError) {
      throw updateNotificationError;
    }

    // Update booking status
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({ 
        status: 'DRIVER_ASSIGNED',
        assigned_driver_id: notification.driver_id,
        driver_assigned_at: new Date().toISOString()
      })
      .eq('id', notification.bookings.id)
      .eq('status', 'PENDING_DRIVER_ACCEPTANCE');

    if (updateBookingError) {
      throw updateBookingError;
    }

    // Cancel other pending notifications for this booking
    await supabase
      .from('driver_notifications')
      .update({ status: 'CANCELLED' })
      .eq('booking_id', notification.bookings.id)
      .neq('id', notification.id)
      .in('status', ['SENT', 'PENDING']);

    // Send confirmation SMS
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    await twilioClient.messages.create({
      body: `You have successfully accepted the booking!

Details:
From: ${notification.bookings.from_location}
To: ${notification.bookings.to_location}
Date: ${new Date(notification.bookings.departure_date).toLocaleDateString()}
Time: ${notification.bookings.departure_time}
Service: ${notification.bookings.service_type}
Group Size: ${notification.bookings.group_size}

Please check your dashboard for more details.`,
      to: From,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return res.status(200).json({ 
      success: true,
      message: 'Booking accepted successfully'
    });
  } catch (error) {
    console.error('Error handling driver response:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 