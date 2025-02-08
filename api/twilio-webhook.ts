import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify the request is from Twilio
  const twilioSignature = req.headers['x-twilio-signature'];
  const twilioAuth = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    twilioSignature as string,
    `${process.env.VERCEL_URL}/api/twilio-webhook`,
    req.body
  );

  if (!twilioAuth) {
    return res.status(403).json({ error: 'Invalid Twilio signature' });
  }

  try {
    const { Body: message, From: phoneNumber } = req.body;
    
    // Check if this is a "YES" response
    if (message.trim().toUpperCase() === 'YES') {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Find the driver by phone number
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('mobile_number', phoneNumber)
        .single();

      if (driver) {
        // Update the booking status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            driver_id: driver.id,
            status: 'assigned'
          })
          .eq('status', 'pending')
          .is('driver_id', null);

        if (!updateError) {
          // Send confirmation to the driver
          const twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_AUTH_TOKEN!
          );

          await twilioClient.messages.create({
            body: 'Booking confirmed! Please check your dashboard for details.',
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER
          });
        }
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.send('<Response></Response>'); // Empty response to acknowledge receipt
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 