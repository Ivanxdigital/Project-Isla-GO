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
      
      // Log to email_failures table with correct field names
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        reason: `Error fetching booking: ${bookingError.message}`,
        notes: JSON.stringify(bookingError),
        resolved: false
      });
      
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }
    
    if (!booking) {
      console.error('Booking not found:', bookingId);
      
      // Log to email_failures table with correct field names
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        reason: 'Booking not found',
        notes: JSON.stringify({ bookingId }),
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
      
      // Log to email_failures table with correct field names
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        reason: 'No recipient email found',
        notes: JSON.stringify({ 
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
        email: 'ivanxdigital@gmail.com'
      },
      to: [{
        email: recipientEmail,
        name: recipientName
      }],
      subject: 'IslaGO - Payment Confirmation for Booking #' + booking.id.substring(0, 8),
      htmlContent: htmlContent,
      replyTo: {
        email: 'support@islago.vercel.app',
        name: 'IslaGO Support'
      },
      headers: {
        'X-Mailin-custom': 'booking_id:' + bookingId,
        'charset': 'utf-8',
        'X-Priority': '1',
        'Importance': 'high'
      },
      tags: ['payment-confirmation', 'booking-' + bookingId],
      tracking: {
        open: true,
        click: true
      },
      // Add IP warmup parameter to improve deliverability
      ipWarmupEnable: true
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
      
      // Log to email_failures table with correct field names
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        reason: `API Error: ${errorData.message || 'Unknown error'}`,
        notes: JSON.stringify(errorData),
        resolved: false
      });
      
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    console.log('Brevo API response data:', responseData);
    
    // Update booking to mark email as sent
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ email_sent: true })
        .eq('id', bookingId);
      
      if (updateError) {
        console.error('Error updating booking email_sent status:', updateError);
        console.log('This error is non-critical and will be ignored');
      } else {
        console.log('Booking email_sent status updated successfully');
      }
    } catch (updateError) {
      console.error('Exception updating booking email_sent status:', updateError);
      console.log('This error is non-critical and will be ignored');
    }
    
    console.log('Payment confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    
    // Try to log to email_failures table with correct field names
    try {
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        reason: error.message,
        notes: JSON.stringify({ 
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

/**
 * Send booking notification emails to available drivers
 * @param {string} bookingId - The booking ID
 * @returns {Promise<{success: boolean, count: number}>} - Success status and count of emails sent
 */
export const sendDriverBookingEmail = async (bookingId) => {
  try {
    console.log('Sending driver notification emails for booking:', bookingId);
    
    // Check if API key is available
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    if (!apiKey) {
      console.error('Brevo API key is missing');
      throw new Error('Brevo API key is missing');
    }
    
    // Fetch booking details
    console.log('Fetching booking details for ID:', bookingId);
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
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
      console.error('Error fetching booking:', bookingError);
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }
    
    if (!booking) {
      console.error('Booking not found:', bookingId);
      throw new Error('Booking not found');
    }
    
    console.log('Booking found:', booking);
    
    // Check if booking is already assigned to a driver
    if (booking.assigned_driver_id) {
      console.log('Booking already assigned to driver:', booking.assigned_driver_id);
      return { success: false, count: 0, reason: 'Booking already assigned' };
    }
    
    // First, get available drivers without trying to use relationship syntax
    console.log('Fetching available drivers');
    const { data: availableDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active')
      .eq('is_available', true);
    
    if (driversError) {
      console.error('Error fetching available drivers:', driversError);
      throw new Error(`Error fetching available drivers: ${driversError.message}`);
    }
    
    if (!availableDrivers || availableDrivers.length === 0) {
      console.warn('No available drivers found for booking:', bookingId);
      
      // Log this issue to the database
      try {
        await supabase
          .from('email_failures')
          .insert({
            booking_id: bookingId,
            reason: 'No available drivers found',
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Failed to log notification failure:', logError);
      }
      
      return { success: false, count: 0, reason: 'No available drivers' };
    }
    
    console.log(`Found ${availableDrivers.length} available drivers`);
    
    // Get the current authenticated user session for email access
    const { data: { session } } = await supabase.auth.getSession();
    
    // For each driver, get their email from profiles and send an email
    let successCount = 0;
    const baseUrl = new URL(window.location.origin);
    const dashboardUrl = new URL('/driver/dashboard', baseUrl);
    
    // Process each driver in sequence
    for (const driver of availableDrivers) {
      try {
        // Skip drivers without user_id
        if (!driver.user_id) {
          console.log(`Driver ${driver.id} has no user_id, skipping`);
          continue;
        }
        
        // Try to get email from profiles table
        console.log(`Fetching email for driver ${driver.id} from profiles table`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', driver.user_id)
          .single();
        
        let driverEmail = null;
        let driverName = driver.name || 'Driver';
        
        if (profileError || !profileData || !profileData.email) {
          console.log(`No profile email found for driver ${driver.id}, checking if this is the current user`);
          
          // As a fallback, if this driver is the current logged-in user, use their email
          if (session && session.user && session.user.id === driver.user_id) {
            console.log(`Driver ${driver.id} is the current user, using session email`);
            driverEmail = session.user.email;
          } else {
            console.log(`No email found for driver ${driver.id}, skipping`);
            continue;
          }
        } else {
          driverEmail = profileData.email;
          // If profile has name details, use those
          if (profileData.first_name) {
            driverName = `${profileData.first_name} ${profileData.last_name || ''}`.trim();
          }
        }
        
        if (!driverEmail) {
          console.log(`No email found for driver ${driver.id}, skipping`);
          continue;
        }
        
        // Generate HTML content for this driver
        const htmlContent = getDriverBookingNotificationHtml(booking, driver, dashboardUrl.toString());
        
        // Prepare email content
        const emailData = {
          sender: {
            name: 'IslaGO Driver Dispatch',
            email: 'ivanxdigital@gmail.com'
          },
          to: [{
            email: driverEmail,
            name: driverName
          }],
          subject: `New Booking Available: ${booking.from_location} to ${booking.to_location}`,
          htmlContent: htmlContent,
          replyTo: {
            email: 'dispatch@islago.vercel.app',
            name: 'IslaGO Dispatch'
          },
          headers: {
            'X-Mailin-custom': `booking_id:${bookingId},driver_id:${driver.id}`,
            'charset': 'utf-8',
            'X-Priority': '1',
            'Importance': 'high'
          },
          tags: ['driver-notification', `booking-${bookingId}`, `driver-${driver.id}`],
          tracking: {
            open: true,
            click: true
          },
          // Add IP warmup parameter to improve deliverability
          ipWarmupEnable: true
        };
        
        console.log(`Sending email to driver ${driver.id}:`, driverEmail);
        
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
        
        // Log the response status for debugging
        console.log(`Driver ${driver.id} email response status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error sending email to driver ${driver.id}:`, errorText);
          continue;
        }
        
        // Record this notification in the database
        try {
          await supabase
            .from('driver_notifications')
            .insert({
              driver_id: driver.id,
              booking_id: bookingId,
              notification_type: 'email',
              status: 'sent',
              created_at: new Date().toISOString()
            });
        } catch (recordError) {
          console.error('Error recording driver notification:', recordError);
        }
        
        successCount++;
      } catch (driverEmailError) {
        console.error(`Error sending email to driver ${driver.id}:`, driverEmailError);
      }
    }
    
    // Update booking to track that driver notifications were sent
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          driver_notifications_sent: true,
          driver_notifications_count: successCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (updateError) {
        console.error('Error updating booking driver_notifications_sent status:', updateError);
      }
    } catch (updateError) {
      console.error('Exception updating booking driver_notifications status:', updateError);
    }
    
    console.log(`Successfully sent ${successCount} driver notification emails for booking ${bookingId}`);
    return { success: true, count: successCount };
  } catch (error) {
    console.error('Failed to send driver notification emails:', error);
    
    // Try to log to email_failures table with the correct field names
    try {
      await supabase.from('email_failures').insert({
        booking_id: bookingId,
        reason: error.message,
        notes: JSON.stringify({ 
          stack: error.stack,
          message: error.message
        }),
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log notification failure:', logError);
    }
    
    throw error;
  }
};

/**
 * Generate HTML content for driver booking notification email
 * @param {Object} booking - The booking object with all details
 * @param {Object} driver - The driver receiving this email
 * @param {string} dashboardUrl - URL to the driver dashboard
 * @returns {string} - HTML content for the email
 */
const getDriverBookingNotificationHtml = (booking, driver, dashboardUrl) => {
  console.log('Generating driver email HTML for booking:', booking.id);
  
  // Handle potential missing data gracefully
  const driverName = driver.name || 'Driver';
  const bookingId = booking.id || 'Unknown';
  const fromLocation = booking.from_location || 'Not specified';
  const toLocation = booking.to_location || 'Not specified';
  const departureDate = booking.departure_date ? formatDate(booking.departure_date) : 'Not specified';
  const departureTime = booking.departure_time ? formatTime(booking.departure_time) : 'Not specified';
  const serviceType = booking.service_type || 'Standard';
  const totalAmount = booking.total_amount ? formatCurrency(booking.total_amount) : 'Not specified';
  
  // Get customer information
  const customer = booking.customers || {};
  const customerName = customer.first_name && customer.last_name ? 
    `${customer.first_name} ${customer.last_name}` : 
    'Customer';
  const customerPhone = customer.mobile_number || 'Not provided';
  
  // Add commission calculation (you may adjust this based on your business rules)
  const driverCommission = booking.total_amount ? formatCurrency(booking.total_amount * 0.8) : 'Not specified';
  
  // Create a cleaner, more appealing driver-focused HTML template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IslaGO - New Trip Request</title>
        <style>
          /* Base styles with better typography and spacing */
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f7f9fc;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }
          .header { 
            background-color: #1a73e8; 
            color: white; 
            padding: 24px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 6px 0 0;
            opacity: 0.9;
            font-size: 15px;
          }
          .content { 
            padding: 30px; 
            background-color: #fff;
          }
          .greeting {
            font-size: 17px;
            margin-bottom: 20px;
          }
          .booking-details { 
            background-color: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 24px 0;
            border-left: 4px solid #1a73e8;
          }
          .booking-details h2 {
            margin-top: 0;
            font-size: 18px;
            color: #1a73e8;
          }
          .customer-details { 
            background-color: #e8f0fe; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 24px 0;
            border-left: 4px solid #4285f4;
          }
          .customer-details h2 {
            margin-top: 0;
            font-size: 18px;
            color: #4285f4;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 13px; 
            color: #666; 
            background-color: #f5f5f5;
            border-top: 1px solid #eaeaea;
          }
          .button { 
            background-color: #1a73e8; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 30px; 
            display: inline-block; 
            margin: 10px 5px; 
            font-weight: 600; 
            text-align: center;
            letter-spacing: 0.3px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s;
          }
          .button:hover {
            background-color: #1557b0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .primary-button { 
            background-color: #0f9d58; 
            font-size: 16px;
          }
          .primary-button:hover {
            background-color: #0b8043;
          }
          .highlight { 
            color: #1a73e8; 
            font-weight: bold; 
          }
          .commission { 
            font-size: 20px; 
            color: #0f9d58; 
            font-weight: bold;
            display: inline-block;
            padding: 4px 8px;
            background-color: #e6f4ea;
            border-radius: 4px;
          }
          .action-section { 
            text-align: center; 
            margin: 30px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
          .expires { 
            font-size: 13px; 
            color: #666; 
            text-align: center; 
            margin-top: 8px;
          }
          .info-row {
            display: flex;
            margin-bottom: 10px;
            align-items: baseline;
          }
          .info-label {
            font-weight: 600;
            min-width: 120px;
          }
          .info-value {
            flex: 1;
          }
          @media (max-width: 480px) {
            .content { padding: 20px; }
            .button { width: 100%; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Trip Request</h1>
            <p>Reference: #${bookingId.substring(0, 8)}</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Hello ${driverName},</p>
              <p>A new trip request is available! Please review the details below.</p>
            </div>
            
            <div class="booking-details">
              <h2>Trip Details</h2>
              <div class="info-row">
                <div class="info-label">From:</div>
                <div class="info-value">${fromLocation}</div>
              </div>
              <div class="info-row">
                <div class="info-label">To:</div>
                <div class="info-value">${toLocation}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Date:</div>
                <div class="info-value">${departureDate}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Time:</div>
                <div class="info-value">${departureTime}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Service:</div>
                <div class="info-value">${serviceType}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Your Earnings:</div>
                <div class="info-value"><span class="commission">${driverCommission}</span></div>
              </div>
            </div>
            
            <div class="customer-details">
              <h2>Customer Information</h2>
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">${customerName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Phone:</div>
                <div class="info-value">${customerPhone}</div>
              </div>
            </div>

            <div class="action-section">
              <p><strong>This trip needs a driver! Will you take it?</strong></p>
              <a href="${dashboardUrl}" class="button primary-button">VIEW AND RESPOND</a>
              <p class="expires">This request expires in 30 minutes</p>
            </div>
          </div>

          <div class="footer">
            <p>IslaGo Transport Services</p>
            <p>Need help? Contact dispatch at dispatch@islago.vercel.app</p>
            <p>&copy; ${new Date().getFullYear()} IslaGo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
   
  return htmlContent;
};

/**
 * Send a test email to verify Brevo configuration
 * @param {string} recipientEmail - The email address to send the test to
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendTestEmail = async (recipientEmail) => {
  try {
    console.log('Sending test email to:', recipientEmail);
    
    // Check if API key is available
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;
    if (!apiKey) {
      console.error('Brevo API key is missing');
      throw new Error('Brevo API key is missing');
    }
    
    // Create a simple HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>IslaGO - Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">IslaGO Test Email</h1>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e9ecef; border-top: none;">
              <p>This is a test email from IslaGO to verify that the email system is working correctly.</p>
              <p>If you received this email, it means that the Brevo API is configured correctly.</p>
              <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Recipient:</strong> ${recipientEmail}</p>
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
              <p style="font-size: 12px; color: #6c757d; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Prepare email content with improved deliverability
    const emailData = {
      sender: {
        name: 'IslaGO Support',
        email: 'ivanxdigital@gmail.com'
      },
      to: [{
        email: recipientEmail,
        name: 'IslaGO User'
      }],
      subject: 'IslaGO - Test Email [' + new Date().toLocaleTimeString() + ']',
      htmlContent: htmlContent,
      replyTo: {
        email: 'support@islago.vercel.app',
        name: 'IslaGO Support'
      },
      headers: {
        'X-Mailin-custom': 'test_email:true',
        'charset': 'utf-8',
        'X-Priority': '1',
        'Importance': 'high'
      },
      tags: ['test-email', 'diagnostic'],
      tracking: {
        open: true,
        click: true
      },
      // Add IP warmup parameter to improve deliverability
      ipWarmupEnable: true
    };
    
    console.log('Sending test email with data:', JSON.stringify({
      sender: emailData.sender,
      to: emailData.to,
      subject: emailData.subject,
      headers: emailData.headers
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
    console.log('Brevo API test email response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API test email error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(`Failed to send test email: ${errorData.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    console.log('Brevo API test email response data:', responseData);
    
    console.log('Test email sent successfully. Please check your inbox (and spam folder).');
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
};