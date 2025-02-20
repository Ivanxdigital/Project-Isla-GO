import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data from Twilio
    const formData = await req.formData();
    const messageBody = formData.get('Body')?.toString().trim().toUpperCase() || '';
    const fromNumber = formData.get('From')?.toString() || '';
    const messageId = formData.get('MessageSid')?.toString() || '';

    // Find the driver by phone number
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('mobile_number', fromNumber.replace('+63', ''))
      .single();

    if (driverError || !driver) {
      console.error('Driver not found:', driverError);
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Find pending notification for this driver
    const { data: notification, error: notificationError } = await supabase
      .from('driver_notifications')
      .select('booking_id')
      .eq('driver_id', driver.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (notificationError || !notification) {
      console.error('No pending notification found:', notificationError);
      return res.status(404).json({ error: 'No pending booking found' });
    }

    const accepted = messageBody === 'YES';
    
    // Update notification status
    await supabase
      .from('driver_notifications')
      .update({
        status: accepted ? 'ACCEPTED' : 'DECLINED',
        response_time: new Date().toISOString(),
        twilio_message_id: messageId
      })
      .match({ driver_id: driver.id, booking_id: notification.booking_id });

    // If accepted, update booking and create assignment
    if (accepted) {
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'assigned',
          assigned_driver_id: driver.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.booking_id);

      // Create trip assignment
      await supabase
        .from('trip_assignments')
        .insert({
          booking_id: notification.booking_id,
          driver_id: driver.id,
          status: 'assigned'
        });

      // Send confirmation message
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>You have been assigned to this booking. Our team will contact you with more details.</Message>
        </Response>`;

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml);
    } else {
      // Send decline acknowledgment
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>You have declined this booking. Thank you for your response.</Message>
        </Response>`;

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml);
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 