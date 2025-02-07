import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Check environment variables
    const envCheck = {
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
    };

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    // Test message
    const result = await twilioClient.messages.create({
      body: 'Test message from IslaGO',
      to: '+639123456789', // Replace with your test number
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return res.status(200).json({ 
      success: true,
      envCheck,
      messageSid: result.sid
    });
  } catch (error: any) {
    console.error('Test SMS error:', error);
    return res.status(500).json({ 
      error: 'Failed to send test SMS',
      details: error.message,
      envCheck: {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
      }
    });
  }
} 