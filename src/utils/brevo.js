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
 * Send payment confirmation email to customer
 * @param {string} bookingId - The booking ID
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendPaymentConfirmationEmail = async (bookingId) => {
  try {
    console.log('Sending payment confirmation email for booking:', bookingId);
    
    // Check if API key is available
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    if (!apiKey) {
      console.error('Brevo API key is missing');
      throw new Error('Brevo API key is missing');
    }
    
    // Get authenticated user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No authenticated session found');
      throw new Error('No authenticated session found');
    }
    
    // Fetch booking details
    console.log('Fetching booking details for ID:', bookingId);
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      
      // Log to email_failures table
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        error_message: `Error fetching booking: ${bookingError.message}`,
        error_details: JSON.stringify(bookingError),
        resolved: false
      });
      
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }
    
    if (!booking) {
      console.error('Booking not found:', bookingId);
      
      // Log to email_failures table
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        error_message: 'Booking not found',
        error_details: JSON.stringify({ bookingId }),
        resolved: false
      });
      
      throw new Error('Booking not found');
    }
    
    console.log('Booking found:', booking);
    
    // Fetch customer details
    console.log('Fetching customer details for ID:', booking.customer_id);
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', booking.customer_id)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer:', customerError);
    }
    
    // Try to get email from different sources
    let recipientEmail = null;
    let recipientName = 'Valued Customer';
    
    // 1. Try from customer record
    if (customer && customer.email) {
      console.log('Found email in customer record:', customer.email);
      recipientEmail = customer.email;
      if (customer.first_name) {
        recipientName = `${customer.first_name} ${customer.last_name || ''}`.trim();
      }
    } 
    // 2. Try from profiles table
    else {
      console.log('Email not found in customer record, checking profiles table');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!profileError && profile && profile.email) {
        console.log('Found email in profile record:', profile.email);
        recipientEmail = profile.email;
        if (profile.first_name) {
          recipientName = `${profile.first_name} ${profile.last_name || ''}`.trim();
        }
      } 
      // 3. Try from auth.users table
      else {
        console.log('Email not found in profile record, checking auth.users table');
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', session.user.id)
          .single();
        
        if (!userError && user && user.email) {
          console.log('Found email in auth.users record:', user.email);
          recipientEmail = user.email;
        } else {
          // 4. Last resort - use session email
          console.log('Using email from session:', session.user.email);
          recipientEmail = session.user.email;
        }
      }
    }
    
    // Fallback to session email if still not found
    if (!recipientEmail && session.user.email) {
      console.log('Using fallback email from session:', session.user.email);
      recipientEmail = session.user.email;
    }
    
    // If still no email, log error and exit
    if (!recipientEmail) {
      console.error('No recipient email found for booking:', bookingId);
      
      // Log to email_failures table
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        error_message: 'No recipient email found',
        error_details: JSON.stringify({ 
          booking_id: bookingId,
          customer_id: booking.customer_id,
          session_user_id: session.user.id
        }),
        resolved: false
      });
      
      throw new Error('No recipient email found');
    }
    
    console.log('Generating HTML content for email');
    const htmlContent = getPaymentConfirmationHtml(booking);
    console.log('HTML content generated successfully');
    
    // Prepare email content
    const emailData = {
      sender: {
        name: 'IslaGO Booking',
        email: 'noreply@islago.vercel.app'
      },
      to: [{
        email: recipientEmail,
        name: recipientName
      }],
      subject: 'IslaGO - Payment Confirmation',
      htmlContent: htmlContent,
      replyTo: {
        email: 'support@islago.vercel.app',
        name: 'IslaGO Support'
      },
      headers: {
        'X-Mailin-custom': 'booking_id:' + bookingId,
        'charset': 'utf-8'
      },
      tags: ['payment-confirmation', 'booking-' + bookingId],
      tracking: {
        open: true,
        click: true
      }
    };
    
    console.log('Sending email to:', recipientEmail);
    console.log('Email data:', JSON.stringify({
      sender: emailData.sender,
      to: emailData.to,
      subject: emailData.subject,
      replyTo: emailData.replyTo,
      tags: emailData.tags
    }, null, 2));
    
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
      console.error('Brevo API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      // Log to email_failures table
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        error_message: `API Error: ${errorData.message || 'Unknown error'}`,
        error_details: JSON.stringify(errorData),
        resolved: false
      });
      
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    console.log('Brevo API response data:', responseData);
    
    // Update booking to mark email as sent
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ email_sent: true })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Error updating booking email_sent status:', updateError);
    } else {
      console.log('Booking email_sent status updated successfully');
    }
    
    console.log('Payment confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    
    // Try to log to email_failures table if not already logged
    try {
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        error_message: error.message,
        error_details: JSON.stringify({ 
          stack: error.stack,
          message: error.message
        }),
        resolved: false
      });
    } catch (logError) {
      console.error('Failed to log email failure:', logError);
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
  console.log('Generating HTML content for booking:', booking.id);
  
  // Handle potential missing data gracefully
  const customerName = booking.customer?.first_name || 'Valued Customer';
  const bookingId = booking.id || 'Unknown';
  const fromLocation = booking.from_location || 'Not specified';
  const toLocation = booking.to_location || 'Not specified';
  const departureDate = booking.departure_date ? formatDate(booking.departure_date) : 'Not specified';
  const departureTime = booking.departure_time ? formatTime(booking.departure_time) : 'Not specified';
  const serviceType = booking.service_type || 'Standard';
  const totalAmount = booking.total_amount ? formatCurrency(booking.total_amount) : 'Not specified';
  
  console.log('Email template variables:', {
    customerName,
    bookingId,
    fromLocation,
    toLocation,
    departureDate,
    departureTime,
    serviceType,
    totalAmount,
    hasHotelPickup: !!booking.hotel_pickup
  });
  
  // Create a simpler HTML template to avoid potential issues
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IslaGO - Payment Confirmation</title>
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
   
  return htmlContent;
};