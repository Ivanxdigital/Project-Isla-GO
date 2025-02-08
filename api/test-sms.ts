import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message } = req.body;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return res.status(200).json({ 
      success: true, 
      messageId: result.sid 
    });
  } catch (error) {
    console.error('SMS Error:', error);
    return res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message 
    });
  }
} 