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
    
    // First, get the booking details with customer and user information
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
        hotel_details,
        customers (
          id, 
          first_name, 
          last_name, 
          email, 
          mobile_number
        ),
        profiles (
          id,
          email,
          full_name
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking details:', bookingError);
      throw new Error('Booking not found');
    }

    console.log('Retrieved booking data:', {
      id: booking.id,
      hasCustomer: !!booking.customers,
      hasProfile: !!booking.profiles
    });
    
    // Determine customer information and email
    let customerEmail = null;
    let customerName = null;
    let firstName = null;
    
    // Try to get email from customer record first
    if (booking.customers && booking.customers.email) {
      customerEmail = booking.customers.email;
      customerName = `${booking.customers.first_name} ${booking.customers.last_name}`;
      firstName = booking.customers.first_name;
      console.log('Using customer email:', customerEmail);
    } 
    // If no customer email, try to get from user profile
    else if (booking.profiles && booking.profiles.email) {
      customerEmail = booking.profiles.email;
      customerName = booking.profiles.full_name || 'Valued Customer';
      firstName = booking.profiles.full_name?.split(' ')[0] || 'Valued Customer';
      console.log('Using profile email as fallback:', customerEmail);
    }
    // If still no email, try to fetch customer directly
    else if (booking.customer_id) {
      console.log('No email found in joined data, fetching customer directly');
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, mobile_number')
        .eq('id', booking.customer_id)
        .single();
        
      if (!customerError && customer && customer.email) {
        customerEmail = customer.email;
        customerName = `${customer.first_name} ${customer.last_name}`;
        firstName = customer.first_name;
        console.log('Found email from direct customer query:', customerEmail);
      }
    }
    // If still no email, try to fetch user profile directly
    else if (booking.user_id) {
      console.log('No customer email found, fetching user profile directly');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', booking.user_id)
        .single();
        
      if (!profileError && profile && profile.email) {
        customerEmail = profile.email;
        customerName = profile.full_name || 'Valued Customer';
        firstName = profile.full_name?.split(' ')[0] || 'Valued Customer';
        console.log('Found email from direct profile query:', customerEmail);
      }
    }
    
    if (!customerEmail) {
      console.error('No email address found for this booking');
      throw new Error('No email address found for sending confirmation');
    }

    // Prepare customer data for email template
    const customer = {
      email: customerEmail,
      first_name: firstName,
      name: customerName
    };

    // Combine booking and customer data
    const emailBooking = {
      ...booking,
      customer: customer
    };

    // Prepare email data for API call
    const emailData = {
      to: [{
        email: customerEmail,
        name: customerName
      }],
      sender: {
        email: 'noreply@islago.com',
        name: 'IslaGo Transport'
      },
      subject: `Payment Confirmation - Booking #${booking.id} - IslaGo Transport`,
      htmlContent: getPaymentConfirmationHtml(emailBooking),
      replyTo: {
        email: 'support@islago.com',
        name: 'IslaGo Support'
      },
      params: {
        booking_id: booking.id,
        customer_name: firstName
      }
    };

    // Send email using fetch API instead of Brevo SDK
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    
    if (!apiKey) {
      throw new Error('Brevo API key is not configured');
    }
    
    console.log('Sending payment confirmation email to:', customerEmail);
    
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