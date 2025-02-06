// Add this import at the top
import { supabase } from './supabase';

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

    // Store the session ID and payment intent ID
    const sessionId = responseData.data.id;
    const paymentIntentId = responseData.data.attributes.payment_intent_id;

    sessionStorage.setItem('paymentSessionId', sessionId);
    sessionStorage.setItem('paymentIntentId', paymentIntentId);

    // If the payment is immediately successful, update the status
    if (responseData.data.attributes.status === 'active') {
      const bookingId = sessionStorage.getItem('lastBookingId');
      if (bookingId) {
        await updatePaymentStatus(bookingId, 'paid');
      }
    }

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
    case 'succeeded':
    case 'active':
      return 'paid';
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

// Add this function to verify webhook events
export const handlePayMongoWebhook = async (event) => {
  try {
    console.log('Received PayMongo webhook:', event.type);
    
    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data.id;
      
      // Find the booking with this session ID
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('payment_session_id', sessionId)
        .single();

      if (error) {
        console.error('Error finding booking:', error);
        return;
      }

      // Update the booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Error updating booking:', updateError);
      }
    }
  } catch (error) {
    console.error('Webhook handling error:', error);
  }
};

// Add this function to directly update payment status
export const updatePaymentStatus = async (bookingId, status) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        payment_status: status,
        status: status === 'paid' ? 'confirmed' : status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};