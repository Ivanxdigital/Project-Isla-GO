import type { VercelRequest, VercelResponse } from '@vercel/node';

module.exports = async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const envCheck = {
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    return res.status(200).json({ envCheck });
  } catch (error: any) {
    console.error('Environment check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check environment',
      details: error.message 
    });
  }
}; 