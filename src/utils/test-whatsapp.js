import { supabase } from './supabase.js';

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || '+14155238886';

// Function to test WhatsApp integration
export const testWhatsAppIntegration = async (phoneNumber) => {
  try {
    console.log('Testing WhatsApp integration...');
    
    // Format phone number if needed
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Determine if we're in local development or production
    const hostname = window.location.hostname;
    
    // Get the API URL - use relative path for production (Vercel) and full URL for local development
    const apiUrl = hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'http://localhost:3001/api/test-whatsapp'  // Local development with Express
      : '/api/test-whatsapp';  // Production on Vercel
    
    console.log('Making API request to:', apiUrl);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No authenticated session found');
    }

    console.log('Session found, making fetch request...');

    // Make the API call to send a test WhatsApp message
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          phoneNumber: formattedNumber
        }),
        mode: 'cors'
      });

      console.log('Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        if (responseText && responseText.trim()) {
          result = JSON.parse(responseText);
        } else {
          console.warn('Empty response received from API');
          result = { warning: 'Empty response from server' };
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }

      console.log('WhatsApp test result:', result);
      return result;
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error testing WhatsApp integration:', error);
    throw error;
  }
};

// Helper function to format phone number
const formatPhoneNumber = (number) => {
  // Remove any non-digit characters
  const cleaned = number.replace(/\D/g, '');
  // Ensure number starts with country code (63 for Philippines)
  return cleaned.startsWith('63') ? `+${cleaned}` : `+63${cleaned}`;
}; 