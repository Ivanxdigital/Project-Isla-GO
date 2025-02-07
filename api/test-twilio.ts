import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

module.exports = async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    // Test the credentials
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    
    // Get account balance
    const balance = await twilioClient.api.balance.fetch();

    return res.status(200).json({
      success: true,
      account: {
        status: account.status,
        type: account.type,
        friendlyName: account.friendlyName
      },
      balance: balance.balance,
      currency: balance.currency
    });
  } catch (error: any) {
    console.error('Twilio test error:', error);
    return res.status(500).json({
      error: 'Failed to test Twilio connection',
      details: error.message,
      code: error.code
    });
  }
}; 