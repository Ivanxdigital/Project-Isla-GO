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
    
    // First, get the booking details without trying to join profiles
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        user_id,
        from_location,
        to_location,
        departure_date,
        departure_time,
        service_type,
        total_amount,
        hotel_pickup,
        hotel_details
      `)
      .eq('id', bookingId)
      .single();
      
    if (bookingError) {
      console.error('Error fetching booking details:', bookingError);
      throw new Error('Booking not found');
    }
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Now get the customer details separately
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, mobile_number')
      .eq('id', booking.customer_id)
      .single();
      
    if (customerError) {
      console.error('Error fetching customer details:', customerError);
      throw new Error('Customer not found');
    }
    
    // Check if we have a customer email
    if (!customer || !customer.email) {
      console.error('No customer email found for booking:', bookingId);
      
      // Try to get user email as fallback
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', booking.user_id)
        .single();
        
      if (userError || !user || !user.email) {
        throw new Error('No email address found for customer');
      }
      
      // Use the user email instead
      customer.email = user.email;
      console.log('Using user email as fallback:', user.email);
    }
    
    console.log('Sending confirmation email to:', customer.email);
    
    // Format the date for display
    const departureDate = new Date(booking.departure_date);
    const formattedDate = departureDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format the time for display
    const timeParts = booking.departure_time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedTime = `${formattedHours}:${minutes} ${ampm}`;
    
    // Create email payload
    const emailPayload = {
      sender: {
        name: 'IslaGO Travel',
        email: 'bookings@islago.com'
      },
      to: [
        {
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`
        }
      ],
      subject: 'Your IslaGO Booking Confirmation',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">Booking Confirmation</h1>
          </div>
          
          <p>Dear ${customer.first_name},</p>
          
          <p>Thank you for booking with IslaGO! Your payment has been successfully processed and your booking is confirmed.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #3b82f6; margin-top: 0;">Booking Details</h2>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>From:</strong> ${booking.from_location}</p>
            <p><strong>To:</strong> ${booking.to_location}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Service Type:</strong> ${booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Van</p>
            <p><strong>Amount Paid:</strong> ₱${parseFloat(booking.total_amount).toFixed(2)}</p>
            ${booking.hotel_pickup ? `<p><strong>Hotel Pickup:</strong> ${booking.hotel_details || 'Not specified'}</p>` : ''}
          </div>
          
          <p>A driver will be assigned to your booking soon. You will receive another email with the driver's details once assigned.</p>
          
          <p>If you have any questions or need to make changes to your booking, please contact us at support@islago.com or call +63 917 123 4567.</p>
          
          <p>We look forward to serving you!</p>
          
          <p>Best regards,<br>The IslaGO Team</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #6b7280; font-size: 12px;">
            <p>© 2023 IslaGO Travel. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      `
    };
    
    // Send the email using Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send email:', responseData);
      throw new Error(`Failed to send email: ${responseData.message || 'Unknown error'}`);
    }
    
    console.log('Email sent successfully:', responseData);
    
    // Update booking to mark email as sent
    await supabase
      .from('bookings')
      .update({
        payment_confirmation_email_sent: true,
        payment_confirmation_email_sent_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    return responseData;
  } catch (error) {
    console.error('Failed to send payment confirmation email:', {
      error: error.message,
      stack: error.stack,
      details: error.details || 'No additional details'
    });
    
    // Log the error but don't throw it
    await supabase
      .from('driver_notification_logs')
      .insert({
        booking_id: bookingId,
        status_code: 500,
        response: JSON.stringify({ 
          error: 'Email sending failed',
          message: error.message
        }),
        created_at: new Date().toISOString()
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