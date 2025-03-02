import SibApiV3Sdk from '@getbrevo/brevo';
import { supabase } from './supabase.ts';

// Initialize Brevo API client
const createBrevoClient = () => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Brevo API key is not configured');
  }
  
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const apiKey1 = apiInstance.authentications['apiKey'];
  apiKey1.apiKey = apiKey;
  
  return apiInstance;
};

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
    
    // Fetch booking details with customer info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          mobile_number
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking details:', bookingError);
      throw bookingError;
    }

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.customer?.email) {
      console.error('No email found for customer:', booking.customer);
      throw new Error('Customer email is required for sending confirmation');
    }

    // Create Brevo client
    const apiInstance = createBrevoClient();
    
    // Prepare email content
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = `Payment Confirmation - Booking #${booking.id} - IslaGo Transport`;
    sendSmtpEmail.htmlContent = getPaymentConfirmationHtml(booking);
    sendSmtpEmail.sender = { name: 'IslaGo Transport', email: 'noreply@islago.com' };
    sendSmtpEmail.to = [{ email: booking.customer.email, name: `${booking.customer.first_name} ${booking.customer.last_name}` }];
    sendSmtpEmail.replyTo = { email: 'support@islago.com', name: 'IslaGo Support' };
    
    // Add tracking parameters
    sendSmtpEmail.params = {
      booking_id: booking.id,
      customer_name: booking.customer.first_name
    };
    
    // Send the email
    console.log('Sending payment confirmation email to:', booking.customer.email);
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
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