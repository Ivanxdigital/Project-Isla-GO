// PayMongo client-side integration
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY;

// Base64 encoding function for UTF-8 strings
function base64Encode(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    const binaryString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  } catch (error) {
    console.error('Base64 encoding error:', error);
    throw new Error('Failed to encode authorization string');
  }
}

// Create a payment session
export const createPaymentSession = async (amount, description) => {
  try {
    if (!amount || amount <= 0) throw new Error('Invalid amount provided');
    if (!description) throw new Error('Description is required');
    if (!PAYMONGO_SECRET_KEY) throw new Error('PayMongo secret key is not configured');

    const baseUrl = window.location.origin;
    console.log('Creating payment session:', { baseUrl, amount, description });

    const encodedAuth = base64Encode(PAYMONGO_SECRET_KEY + ':');

    // Create the session with success_url included in initial payload
    const payload = {
      data: {
        attributes: {
          line_items: [{
            name: description,
            amount: Math.round(amount),
            currency: 'PHP',
            quantity: 1
          }],
          payment_method_types: ['gcash', 'card'],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: description,
          reference_number: Date.now().toString(),
          success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payment/cancel`,
          billing: {
            address: {
              country: 'PH'
            }
          },
          payment_intent_data: {
            capture_method: 'automatic',
            statement_descriptor: 'IslaGO Transport'
          }
        }
      }
    };

    console.log('PayMongo request payload:', payload);

    // Create the session
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedAuth}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log('PayMongo session response:', responseData);

    if (!response.ok) {
      const errorDetail = responseData.errors?.[0]?.detail || 'Unknown error';
      const errorCode = responseData.errors?.[0]?.code || 'NO_CODE';
      throw new Error(`PayMongo API error (${errorCode}): ${errorDetail}`);
    }

    if (!responseData.data?.attributes?.checkout_url) {
      throw new Error('Invalid response: Missing checkout URL');
    }

    // Store the session ID for verification
    const sessionId = responseData.data.id;
    sessionStorage.setItem('paymentSessionId', sessionId);

    return responseData.data;
  } catch (error) {
    console.error('PayMongo error:', error);
    throw error;
  }
};

// Verify a payment session
export const verifyPaymentSession = async (sessionId) => {
  try {
    if (!sessionId) throw new Error('Session ID is required for verification');

    const encodedAuth = base64Encode(PAYMONGO_SECRET_KEY + ':');

    const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedAuth}`
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorDetail = responseData.errors?.[0]?.detail || 'Unknown error';
      const errorCode = responseData.errors?.[0]?.code || 'NO_CODE';
      throw new Error(`PayMongo verification error (${errorCode}): ${errorDetail}`);
    }

    return responseData.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// Map payment statuses
export const mapPaymentStatus = (paymongoStatus) => {
  switch (paymongoStatus?.toLowerCase()) {
    case 'paid':
    case 'completed':
      return 'completed';
    case 'active':
    case 'pending':
    case 'awaiting_payment_method':
    case 'processing':
      return 'pending';
    case 'unpaid':
      return 'pending';
    case 'failed':
    case 'expired':
    case 'cancelled':
    case 'voided':
      return 'failed';
    default:
      console.warn('Unhandled PayMongo status:', paymongoStatus);
      return 'pending';
  }
};