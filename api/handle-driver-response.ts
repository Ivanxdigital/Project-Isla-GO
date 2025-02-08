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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { From, Body } = req.body;
    const acceptanceCode = Body.trim().toUpperCase();

    // Find the notification with this acceptance code
    const { data: notification, error: notificationError } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('acceptance_code', acceptanceCode)
      .eq('status', 'PENDING')
      .single();

    if (notificationError || !notification) {
      return res.status(404).json({ error: 'Invalid or expired code' });
    }

    // Check if code has expired
    if (new Date(notification.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code has expired' });
    }

    // Update notification status
    await supabase
      .from('driver_notifications')
      .update({ 
        status: 'ACCEPTED',
        responded_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    // Update booking status
    await supabase
      .from('bookings')
      .update({ 
        status: 'DRIVER_ASSIGNED',
        assigned_driver_id: notification.driver_id
      })
      .eq('id', notification.booking_id);

    // Send confirmation SMS
    const twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilioClient.messages.create({
      body: 'Booking accepted successfully! Please check your dashboard for details.',
      to: From,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling driver response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 