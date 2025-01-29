import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_CUSTOMER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendBookingEmail = async (bookingData) => {
  try {
    // Log environment variables (excluding public key for security)
    console.log('EmailJS Configuration:', {
      serviceId: EMAILJS_SERVICE_ID,
      adminTemplateId: EMAILJS_TEMPLATE_ID,
      customerTemplateId: EMAILJS_CUSTOMER_TEMPLATE_ID,
    });

    // Validate required data
    if (!bookingData.email) {
      throw new Error('Customer email is required');
    }

    // Format dates for better readability
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

    // Common template parameters
    const baseParams = {
      booking_id: bookingData.bookingId,
      from_location: bookingData.fromLocation,
      to_location: bookingData.toLocation,
      departure_date: formatDate(bookingData.departureDate),
      departure_time: formatTime(bookingData.departureTime),
      return_info: bookingData.returnDate 
        ? `Return Trip: ${formatDate(bookingData.returnDate)} at ${formatTime(bookingData.returnTime)}` 
        : 'One-way Trip',
      total_amount: new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(bookingData.totalAmount)
    };

    // Send email to admin
    const adminParams = {
      ...baseParams,
      to_name: 'Admin',
      customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
      mobile_number: bookingData.mobileNumber,
      messenger: bookingData.messenger || 'Not provided',
      service_type: bookingData.serviceType,
      passengers: bookingData.groupSize
    };

    // Send email to customer
    const customerParams = {
      ...baseParams,
      to_name: `${bookingData.firstName} ${bookingData.lastName}`,
      to_email: bookingData.email,
      support_email: 'support@islago.com', 
      support_phone: '+63 XXX XXX XXXX'    
    };

    // Log the parameters being sent
    console.log('Sending admin email with params:', {
      ...adminParams,
      // Exclude sensitive data
      customer_name: '***',
      mobile_number: '***',
      messenger: '***'
    });
    
    console.log('Sending customer email with params:', {
      ...customerParams,
      to_name: '***',
      to_email: '***'
    });

    // Send both emails concurrently
    console.log('Initiating email sending...');
    
    const [adminResponse, customerResponse] = await Promise.all([
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        adminParams,
        EMAILJS_PUBLIC_KEY
      ).catch(error => {
        console.error('Admin email failed:', error);
        throw error;
      }),
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_CUSTOMER_TEMPLATE_ID,
        customerParams,
        EMAILJS_PUBLIC_KEY
      ).catch(error => {
        console.error('Customer email failed:', error);
        throw error;
      })
    ]);

    console.log('Email responses received:', {
      adminStatus: adminResponse.status,
      customerStatus: customerResponse.status
    });

    // Check if both emails were sent successfully
    if (adminResponse.status !== 200 || customerResponse.status !== 200) {
      throw new Error(`Failed to send emails. Admin status: ${adminResponse.status}, Customer status: ${customerResponse.status}`);
    }

    console.log('Emails sent successfully!');
    return { 
      success: true,
      adminEmailStatus: adminResponse.status,
      customerEmailStatus: customerResponse.status
    };
  } catch (error) {
    console.error('Failed to send booking emails:', {
      error: error.message,
      stack: error.stack,
      config: {
        serviceId: EMAILJS_SERVICE_ID ? 'configured' : 'missing',
        adminTemplateId: EMAILJS_TEMPLATE_ID ? 'configured' : 'missing',
        customerTemplateId: EMAILJS_CUSTOMER_TEMPLATE_ID ? 'configured' : 'missing',
        publicKey: EMAILJS_PUBLIC_KEY ? 'configured' : 'missing'
      }
    });
    throw error;
  }
};