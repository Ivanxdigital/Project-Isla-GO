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
    
    // Check if API key is available
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    if (!apiKey) {
      console.error('Brevo API key is missing');
      throw new Error('Brevo API key is missing');
    }
    
    // First, get the booking details with customer information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_id (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error fetching booking details:', bookingError || 'No booking found');
      throw new Error('Booking not found');
    }
    
    // If no customer email found in the joined data, try to get it directly
    let recipientEmail = booking.customer?.email;
    
    if (!recipientEmail) {
      // Try to get customer email directly
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('email')
        .eq('id', booking.customer_id)
        .single();
      
      if (!customerError && customer) {
        recipientEmail = customer.email;
      }
    }
    
    // If still no email, try to get it from the user's profile
    if (!recipientEmail && booking.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', booking.user_id)
        .single();
      
      if (!profileError && profile) {
        recipientEmail = profile.email;
      }
    }
    
    if (!recipientEmail) {
      console.error('No recipient email found for booking:', bookingId);
      throw new Error('No recipient email found');
    }
    
    // Generate the HTML content using the detailed template
    const htmlContent = getPaymentConfirmationHtml(booking);
    
    // Prepare email content
    const emailData = {
      sender: {
        name: 'IslaGO',
        email: 'noreply@islago.vercel.app'
      },
      to: [{
        email: recipientEmail,
        name: booking.customer?.first_name 
          ? `${booking.customer.first_name} ${booking.customer.last_name}` 
          : 'Valued Customer'
      }],
      subject: 'IslaGO - Payment Confirmation',
      htmlContent: htmlContent
    };
    
    console.log('Sending email to:', recipientEmail);
    
    // Send the email using Brevo API with CORS mode
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    // Log the full response for debugging
    console.log('Brevo API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error('Brevo API error:', errorData);
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }
    
    // Update booking to mark email as sent
    await supabase
      .from('bookings')
      .update({
        payment_confirmation_email_sent: true,
        payment_confirmation_email_sent_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
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
        .eq('id', bookingId);
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
  // Handle potential missing data gracefully
  const customerName = booking.customer?.first_name || 'Valued Customer';
  const bookingId = booking.id || 'Unknown';
  const fromLocation = booking.from_location || 'Not specified';
  const toLocation = booking.to_location || 'Not specified';
  const departureDate = booking.departure_date ? formatDate(booking.departure_date) : 'Not specified';
  const departureTime = booking.departure_time ? formatTime(booking.departure_time) : 'Not specified';
  const serviceType = booking.service_type || 'Standard';
  const totalAmount = booking.total_amount ? formatCurrency(booking.total_amount) : 'Not specified';
  
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
            <p>Booking Reference: #${bookingId}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for choosing IslaGo! Your payment has been <span class="highlight">successfully received</span>.</p>
            
            <div class="status">Payment Status: Successful</div>
            
            <div class="booking-details">
              <h2>Your Booking Details</h2>
              <p><strong>From:</strong> ${fromLocation}</p>
              <p><strong>To:</strong> ${toLocation}</p>
              <p><strong>Date:</strong> ${departureDate}</p>
              <p><strong>Time:</strong> ${departureTime}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Amount Paid:</strong> ${totalAmount}</p>
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

/**
 * Test the Brevo API connection
 * @returns {Promise<boolean>} - True if connection is successful
 */
export const testBrevoConnection = async () => {
  try {
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    
    if (!apiKey) {
      console.error('Brevo API key is missing');
      return false;
    }
    
    console.log('Testing Brevo API connection with key:', apiKey.substring(0, 10) + '...');
    
    // Make a simple request to the Brevo API to check if the key is valid
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey
      }
    });
    
    console.log('Brevo API test response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error('Brevo API connection test failed:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('Brevo API connection successful:', data);
    return true;
  } catch (error) {
    console.error('Brevo API connection test error:', error);
    return false;
  }
}; 