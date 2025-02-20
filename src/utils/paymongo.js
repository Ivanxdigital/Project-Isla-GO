// Add this import at the top
import { supabase } from './supabase.js';

// PayMongo client-side integration
const _PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
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

// Replace window with globalThis
const baseUrl = globalThis.location.origin;

// Add this at the top of the file
const VALID_PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Create a payment session
export const createPaymentSession = async (amount, description, bookingId) => {
  try {
    if (!amount || amount <= 0) throw new Error('Invalid amount provided');
    if (!description) throw new Error('Description is required');
    if (!bookingId) throw new Error('Booking ID is required');
    if (!PAYMONGO_SECRET_KEY) throw new Error('PayMongo secret key is not configured');

    console.log('Creating payment session:', { baseUrl, amount, description, bookingId });

    const encodedAuth = base64Encode(PAYMONGO_SECRET_KEY + ':');

    // Create the session with success_url that includes the session ID placeholder
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
          reference_number: `ISLAGO-${bookingId}-${Date.now()}`,
          success_url: `${baseUrl}/payment/success?bookingId=${bookingId}`,
          cancel_url: `${baseUrl}/payment/cancel?bookingId=${bookingId}`,
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

    // Get the user ID from the booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw new Error('Failed to fetch booking information');
    }

    // Check if a payment record already exists for this booking
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingPaymentError && existingPaymentError.code !== 'PGRST116') {
      console.error('Error checking existing payment:', existingPaymentError);
      throw new Error('Failed to check existing payment record');
    }

    let paymentData;
    if (existingPayment) {
      // Update existing payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          amount: amount / 100,
          status: VALID_PAYMENT_STATUSES.PENDING,
          provider: 'paymongo',
          provider_session_id: sessionId,
          provider_payment_id: paymentIntentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment record:', updateError);
        throw new Error(`Failed to update payment record: ${updateError.message}`);
      }
      paymentData = updatedPayment;
      console.log('Payment record updated:', paymentData);
    } else {
      // Create new payment record
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          user_id: bookingData.user_id,
          amount: amount / 100,
          status: VALID_PAYMENT_STATUSES.PENDING,
          provider: 'paymongo',
          provider_session_id: sessionId,
          provider_payment_id: paymentIntentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }
      paymentData = newPayment;
      console.log('Payment record created:', paymentData);
    }

    // Update the booking with the session ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_session_id: sessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with session ID:', updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    // Store session information in sessionStorage
    sessionStorage.setItem('paymentSessionId', sessionId);
    sessionStorage.setItem('paymentIntentId', paymentIntentId);
    sessionStorage.setItem('bookingId', bookingId);
    sessionStorage.setItem('paymentAmount', amount.toString());

    // If the payment is immediately successful, update both payment and booking status
    if (responseData.data.attributes.status === 'active') {
      await Promise.all([
        updatePaymentStatus(bookingId, VALID_PAYMENT_STATUSES.PAID),
        supabase
          .from('payments')
          .update({ 
            status: VALID_PAYMENT_STATUSES.PAID,
            updated_at: new Date().toISOString()
          })
          .eq('provider_session_id', sessionId)
      ]);
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

// Map PayMongo statuses to our system statuses
export const mapPaymentStatus = (paymongoStatus) => {
  switch (paymongoStatus?.toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'succeeded':
    case 'active':
      return VALID_PAYMENT_STATUSES.PAID;
    case 'pending':
    case 'awaiting_payment_method':
    case 'processing':
      return VALID_PAYMENT_STATUSES.PENDING;
    case 'unpaid':
      return VALID_PAYMENT_STATUSES.PENDING;
    case 'failed':
      return VALID_PAYMENT_STATUSES.FAILED;
    case 'expired':
    case 'cancelled':
      return VALID_PAYMENT_STATUSES.CANCELLED;
    case 'voided':
    case 'refunded':
      return VALID_PAYMENT_STATUSES.REFUNDED;
    default:
      console.warn('Unhandled PayMongo status:', paymongoStatus);
      return VALID_PAYMENT_STATUSES.PENDING;
  }
};

// Add this function to verify webhook events
export const handlePayMongoWebhook = async (event) => {
  try {
    console.log('Received PayMongo webhook:', event.type);
    
    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data.id;
      
      // Update payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: VALID_PAYMENT_STATUSES.PAID,
          updated_at: new Date().toISOString()
        })
        .eq('provider_session_id', sessionId)
        .select('booking_id')
        .single();

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        return;
      }

      if (!payment?.booking_id) {
        console.error('No booking ID found for payment');
        return;
      }

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          payment_status: VALID_PAYMENT_STATUSES.PAID,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.booking_id);

      if (bookingError) {
        console.error('Error updating booking:', bookingError);
      }
    }
  } catch (error) {
    console.error('Webhook handling error:', error);
  }
};

// Update the updatePaymentStatus function to use the correct status
export const updatePaymentStatus = async (bookingId, status) => {
  if (!Object.values(VALID_PAYMENT_STATUSES).includes(status)) {
    throw new Error(`Invalid payment status: ${status}`);
  }

  try {
    // Get the payment record for this booking
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('id, provider_session_id')
      .eq('booking_id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching payment:', fetchError);
      throw fetchError;
    }

    // Update both payment and booking records
    const [paymentUpdate, bookingUpdate] = await Promise.all([
      supabase
        .from('payments')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id),
      
      supabase
        .from('bookings')
        .update({ 
          payment_status: status,
          status: status === VALID_PAYMENT_STATUSES.PAID ? 'confirmed' : status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
    ]);

    if (paymentUpdate.error) throw paymentUpdate.error;
    if (bookingUpdate.error) throw bookingUpdate.error;

    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};