import twilio from 'twilio';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Twilio client using ES module syntax
const twilioClient = twilio.Twilio ? 
  new twilio.Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  ) : 
  // Fallback for different twilio import structure
  twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

// Helper function to format phone number
const formatPhoneNumber = (number: string) => {
  // Remove any non-digit characters
  const cleaned = number.replace(/\D/g, '');
  // Ensure number starts with country code (63 for Philippines)
  return cleaned.startsWith('63') ? `+${cleaned}` : `+63${cleaned}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('WhatsApp test handler started');
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    console.log('Method:', req.method);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Log environment variables (redacted)
    console.log('Environment check:', {
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasTwilioWhatsApp: !!process.env.TWILIO_WHATSAPP_NUMBER
    });

    console.log('Request body:', req.body);
    
    const { phoneNumber } = req.body;
    console.log('Phone number:', phoneNumber);

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Formatted phone number:', formattedNumber);
    
    // Get WhatsApp number from environment or use default
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
    console.log('Using WhatsApp number:', whatsappNumber);

    // Create a test message
    const testMessage = `
*IslaGO WhatsApp Test* 🚗

This is a test message from IslaGO to verify WhatsApp integration.
If you received this message, WhatsApp notifications are working correctly!

Thank you for using IslaGO!
`.trim();

    try {
      console.log('Attempting to send WhatsApp message...');
      
      // Send WhatsApp message via Twilio
      const message = await twilioClient.messages.create({
        body: testMessage,
        to: `whatsapp:${formattedNumber}`,
        from: `whatsapp:${whatsappNumber}`
      });
      
      console.log('WhatsApp message sent:', message.sid);
      
      return res.status(200).json({
        success: true,
        messageId: message.sid,
        to: formattedNumber,
        from: whatsappNumber
      });
    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        moreInfo: error.moreInfo,
        status: error.status
      });
      
      return res.status(500).json({
        success: false,
        error: error.message,
        details: {
          code: error.code,
          moreInfo: error.moreInfo,
          status: error.status
        }
      });
    }
  } catch (error: any) {
    console.error('Error in handler:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 