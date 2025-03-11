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
    
    // First check if the payment exists
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single();
      
    if (paymentError) {
      console.error('Error fetching payment details:', paymentError);
      // Continue anyway, as the booking might still exist
    }
    
    // Get the booking details - using the same query structure as in twilio.js
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error fetching booking details:', bookingError || 'No booking found');
      throw new Error('Booking not found');
    }
    
    console.log('Booking details fetched successfully:', booking.id);
    
    // Log the full booking object for debugging
    console.log('Booking details:', JSON.stringify(booking, null, 2));
    
    // Now get the customer details separately
    let recipientEmail = null;
    let recipientName = 'Valued Customer';
    
    if (booking.customer_id) {
      console.log('Fetching customer details for customer_id:', booking.customer_id);
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', booking.customer_id)
        .single();
      
      if (customerError) {
        console.error('Error fetching customer details:', customerError);
      } else if (customer) {
        console.log('Customer details found:', JSON.stringify(customer, null, 2));
        recipientEmail = customer.email;
        if (customer.first_name) {
          recipientName = `${customer.first_name} ${customer.last_name}`;
        }
      } else {
        console.log('No customer found with ID:', booking.customer_id);
      }
    } else {
      console.log('No customer_id found in booking');
    }
    
    // If still no email, try to get it from the user's profile
    if (!recipientEmail && booking.user_id) {
      console.log('Fetching profile details for user_id:', booking.user_id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', booking.user_id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile details:', profileError);
      } else if (profile) {
        console.log('Profile details found:', JSON.stringify(profile, null, 2));
        if (profile.email) {
          recipientEmail = profile.email;
          if (profile.full_name) {
            recipientName = profile.full_name;
          }
        } else {
          console.log('No email found in profile');
        }
      } else {
        console.log('No profile found with ID:', booking.user_id);
      }
    } else if (!booking.user_id) {
      console.log('No user_id found in booking');
    }
    
    // If still no email, try to get it from auth.users table
    if (!recipientEmail && booking.user_id) {
      console.log('Trying to fetch user from auth.users for user_id:', booking.user_id);
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(booking.user_id);
        
        if (authError) {
          console.error('Error fetching user from auth.users:', authError);
        } else if (authUser && authUser.user && authUser.user.email) {
          console.log('Auth user details found:', JSON.stringify({
            id: authUser.user.id,
            email: authUser.user.email,
            metadata: authUser.user.user_metadata
          }, null, 2));
          
          recipientEmail = authUser.user.email;
          console.log('Found email in auth.users table:', recipientEmail);
          
          // Try to get the user's name from user_metadata if available
          if (authUser.user.user_metadata && authUser.user.user_metadata.full_name) {
            recipientName = authUser.user.user_metadata.full_name;
          }
        } else {
          console.log('No user found in auth.users or no email available');
        }
      } catch (authError) {
        console.error('Exception fetching user from auth.users:', authError);
        // Continue anyway, we'll try other methods
      }
    }
    
    // Last resort: try to get the email directly from auth
    if (!recipientEmail && booking.user_id) {
      console.log('Trying to get current user from auth session');
      try {
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        
        if (getUserError) {
          console.error('Error getting current user:', getUserError);
        } else if (user && user.email) {
          console.log('Current user details found:', JSON.stringify({
            id: user.id,
            email: user.email,
            metadata: user.user_metadata
          }, null, 2));
          
          recipientEmail = user.email;
          console.log('Found email from current auth session:', recipientEmail);
          
          if (user.user_metadata && user.user_metadata.full_name) {
            recipientName = user.user_metadata.full_name;
          }
        } else {
          console.log('No current user found or no email available');
        }
      } catch (getUserError) {
        console.error('Exception getting current user:', getUserError);
      }
    }
    
    // Fallback to a hardcoded email for testing if no email is found
    if (!recipientEmail) {
      console.error('No recipient email found for booking:', bookingId);
      
      // For testing purposes, uncomment this to use a fallback email
      recipientEmail = 'ivanxinfante@gmail.com';
      console.log('Using fallback email for testing:', recipientEmail);
      
      // throw new Error('No recipient email found');
    }
    
    console.log('Using recipient email:', recipientEmail, 'and name:', recipientName);
    
    // Generate the HTML content using the detailed template
    const htmlContent = getPaymentConfirmationHtml(booking);
    
    // Log a sample of the HTML content for debugging
    console.log('HTML content sample (first 200 chars):', htmlContent.substring(0, 200));
    
    // Prepare email content
    const emailData = {
      sender: {
        name: 'IslaGO',
        email: 'noreply@islago.vercel.app'
      },
      to: [{
        email: recipientEmail,
        name: recipientName
      }],
      subject: 'IslaGO - Payment Confirmation',
      htmlContent: htmlContent
    };
    
    console.log('Sending email to:', recipientEmail);
    console.log('Email data:', JSON.stringify({
      sender: emailData.sender,
      to: emailData.to,
      subject: emailData.subject,
      htmlContentLength: emailData.htmlContent.length
    }, null, 2));
    
    // Send the email using Brevo API with CORS mode
    try {
      console.log('Making API request to Brevo');
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
        console.error('Brevo API error response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('Brevo API error parsed:', errorData);
        } catch (e) {
          errorData = { message: errorText };
          console.error('Failed to parse error response:', e);
        }
        
        throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      console.log('Brevo API response data:', responseData);
      
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
      } else {
        console.log('Booking updated to mark email as sent');
      }
      
      console.log('Payment confirmation email sent successfully');
      return true;
    } catch (apiError) {
      console.error('Error during Brevo API call:', apiError);
      
      // Update booking to mark email as failed
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_confirmation_email_sent: false,
            payment_confirmation_email_sent_at: new Date().toISOString()
          })
          .eq('id', bookingId);
          
        if (updateError) {
          console.error('Error updating booking email status:', updateError);
        } else {
          console.log('Booking updated to mark email as failed');
        }
      } catch (updateError) {
        console.error('Exception updating booking email status:', updateError);
      }
      
      throw apiError;
    }
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