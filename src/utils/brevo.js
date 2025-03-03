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
    
    // First, get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .filter('id', 'eq', bookingId)
      .maybeSingle();
    
    if (bookingError || !booking) {
      console.error('Error fetching booking details:', bookingError || 'No booking found');
      throw new Error('Booking not found');
    }
    
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .filter('id', 'eq', booking.customer_id)
      .maybeSingle();
    
    if (customerError) {
      console.error('Error fetching customer details:', customerError);
      throw new Error('Failed to fetch customer details');
    }
    
    // If no customer email found, try to get it from the user's profile
    let recipientEmail = customer?.email;
    if (!recipientEmail && booking.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .filter('id', 'eq', booking.user_id)
        .maybeSingle();
      
      if (!profileError && profile) {
        recipientEmail = profile.email;
      }
    }
    
    if (!recipientEmail) {
      throw new Error('No recipient email found');
    }
    
    // Prepare email content
    const emailData = {
      sender: {
        name: 'IslaGO',
        email: 'noreply@islago.vercel.app'
      },
      to: [{
        email: recipientEmail,
        name: customer?.first_name ? `${customer.first_name} ${customer.last_name}` : 'Valued Customer'
      }],
      subject: 'IslaGO - Payment Confirmation',
      htmlContent: `
        <h2>Payment Confirmation</h2>
        <p>Dear ${customer?.first_name || 'Valued Customer'},</p>
        <p>Thank you for your payment. Your booking has been confirmed.</p>
        <h3>Booking Details:</h3>
        <ul>
          <li>From: ${booking.from_location}</li>
          <li>To: ${booking.to_location}</li>
          <li>Date: ${new Date(booking.departure_date).toLocaleDateString()}</li>
          <li>Time: ${booking.departure_time}</li>
          <li>Amount Paid: ₱${booking.total_amount}</li>
        </ul>
        <p>We are now looking for an available driver for your trip. You will receive another email once a driver has been assigned.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>IslaGO Team</p>
      `
    };
    
    // Send the email using Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': import.meta.env.VITE_BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      throw new Error('Failed to send email');
    }
    
    // Update booking to mark email as sent
    await supabase
      .from('bookings')
      .update({
        payment_confirmation_email_sent: true,
        payment_confirmation_email_sent_at: new Date().toISOString()
      })
      .filter('id', 'eq', bookingId);
    
    console.log('Payment confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    
    // Update booking to mark email as failed
    try {
      await supabase
        .from('bookings')
        .update({
          payment_confirmation_email_sent: false,
          payment_confirmation_email_sent_at: new Date().toISOString()
        })
        .filter('id', 'eq', bookingId);
    } catch (updateError) {
      console.error('Failed to update booking email status:', updateError);
    }
    
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