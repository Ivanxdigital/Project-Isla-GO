// Import supabase client
import { supabase } from './supabase.ts';

// Format date for better readability
const formatDate = (date) => new Date(date).toLocaleDateString('en-PH', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Format time to 12-hour format
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
};

/**
 * Send a payment confirmation email to the customer
 * @param {string} bookingId - The ID of the booking
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendPaymentConfirmationEmail = async (bookingId) => {
  try {
    console.log('Preparing to send payment confirmation email for booking:', bookingId);
    
    // First, get the booking details without joins to ensure we get the customer_id
    const { data: bookingBasic, error: bookingBasicError } = await supabase
      .from('bookings')
      .select('id, customer_id, from_location, to_location, departure_date, departure_time, service_type, total_amount, hotel_pickup, hotel_details')
      .eq('id', bookingId)
      .single();

    if (bookingBasicError || !bookingBasic) {
      console.error('Error fetching basic booking details:', bookingBasicError);
      throw new Error('Booking not found');
    }

    console.log('Retrieved booking with customer_id:', bookingBasic.customer_id);
    
    if (!bookingBasic.customer_id) {
      throw new Error('Booking has no associated customer ID');
    }

    // Now fetch the customer directly using the customer_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, mobile_number')
      .eq('id', bookingBasic.customer_id)
      .single();
      
    if (customerError || !customer) {
      console.error('Error fetching customer details:', customerError);
      throw new Error('Customer not found');
    }

    console.log('Retrieved customer data:', {
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      hasEmail: !!customer.email
    });
    
    if (!customer.email) {
      console.error('Customer has no email address:', customer);
      throw new Error('Customer email is required for sending confirmation');
    }

    // Combine booking and customer data
    const booking = {
      ...bookingBasic,
      customer: customer
    };

    // Prepare email data for API call
    const emailData = {
      to: [{
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`
      }],
      sender: {
        email: 'noreply@islago.com',
        name: 'IslaGo Transport'
      },
      subject: `Payment Confirmation - Booking #${booking.id} - IslaGo Transport`,
      htmlContent: getPaymentConfirmationHtml(booking),
      replyTo: {
        email: 'support@islago.com',
        name: 'IslaGo Support'
      },
      params: {
        booking_id: booking.id,
        customer_name: customer.first_name
      }
    };

    // Send email using fetch API instead of Brevo SDK
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    
    if (!apiKey) {
      throw new Error('Brevo API key is not configured');
    }
    
    console.log('Sending payment confirmation email to:', customer.email);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Email sent successfully:', data);
    
    // Update booking to mark email as sent
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_confirmation_email_sent: true,
        payment_confirmation_email_sent_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking email status:', updateError);
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send payment confirmation email:', {
      error: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });
    throw error;
  }
};

/**
 * Generate HTML content for payment confirmation email
 * @param {Object} booking - The booking object with customer details
 * @returns {string} - HTML content for the email
 */
const getPaymentConfirmationHtml = (booking) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; }
          .header { background-color: #1a73e8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #fff; }
          .booking-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background-color: #f5f5f5; }
          .button { background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
          .highlight { color: #1a73e8; font-weight: bold; }
          .status { background-color: #e6f4ea; color: #137333; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmation</h1>
            <p>Booking Reference: #${booking.id}</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customer.first_name},</p>
            <p>Thank you for choosing IslaGo! Your payment has been <span class="highlight">successfully received</span>.</p>
            
            <div class="status">Payment Status: Successful</div>
            
            <div class="booking-details">
              <h2>Your Booking Details</h2>
              <p><strong>From:</strong> ${booking.from_location}</p>
              <p><strong>To:</strong> ${booking.to_location}</p>
              <p><strong>Date:</strong> ${formatDate(booking.departure_date)}</p>
              <p><strong>Time:</strong> ${formatTime(booking.departure_time)}</p>
              <p><strong>Service:</strong> ${booking.service_type}</p>
              <p><strong>Amount Paid:</strong> ${formatCurrency(booking.total_amount)}</p>
              ${booking.hotel_pickup ? `
                <p><strong>Pickup Location:</strong> ${booking.hotel_details?.name || 'Hotel'}</p>
                <p><strong>Hotel Address:</strong> ${booking.hotel_details?.address || 'Address not provided'}</p>
              ` : ''}
            </div>

            <p><strong>What happens next?</strong></p>
            <p>We are currently matching you with the best driver for your journey. 
            You will receive another notification once a driver has been assigned to your booking.</p>

            <p>Need to modify your booking or have questions?</p>
            <p>
              <a href="tel:+63XXXXXXXXXX" class="button">Call Us</a>
              <a href="mailto:support@islago.com" class="button">Email Support</a>
            </p>
          </div>

          <div class="footer">
            <p>IslaGo Transport Services</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} IslaGo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}; 