import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { validateRequest } from 'twilio/lib/webhooks/webhooks.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Message statuses we want to track
const IMPORTANT_STATUSES = [
  'delivered',
  'undelivered',
  'failed',
  'sent'
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify the request is from Twilio
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const url = `${process.env.VERCEL_URL}/api/twilio-webhook`;
  
  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    console.error('Invalid Twilio signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    } = req.body;

    // Only process statuses we care about
    if (!IMPORTANT_STATUSES.includes(MessageStatus)) {
      return res.status(200).send('OK');
    }

    // Find the notification by message SID
    const { data: notification, error: findError } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('message_sid', MessageSid)
      .single();

    if (findError || !notification) {
      console.error('Could not find notification for message:', MessageSid);
      return res.status(200).send('OK');
    }

    // Update the notification status
    const { error: updateError } = await supabase
      .from('driver_notifications')
      .update({
        delivery_status: MessageStatus,
        error_code: ErrorCode || null,
        error_message: ErrorMessage || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    if (updateError) {
      console.error('Error updating notification:', updateError);
    }

    // If message failed, try to notify another driver
    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      // Trigger new driver notification
      try {
        await fetch(`${process.env.VERCEL_URL}/api/send-driver-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: notification.booking_id })
        });
      } catch (error) {
        console.error('Error triggering new notification:', error);
      }
    }

    // Send empty TwiML response
    res.setHeader('Content-Type', 'text/xml');
    return res.send('<Response></Response>');
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 