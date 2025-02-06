import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Add type declarations for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Add this at the top for better error handling
const handleError = (error: any) => {
  console.error('Full error details:', {
    message: error.message,
    stack: error.stack,
    details: error.details || error.error || error
  });
  return new Response(
    JSON.stringify({
      error: error.message,
      details: error.stack,
      additionalInfo: error.details || error.error
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const url = new URL(req.url);
  const contentType = req.headers.get('content-type') || '';
  
  // Add more detailed logging
  console.log('Incoming request:', {
    method: req.method,
    fullUrl: req.url,
    pathname: url.pathname,
    contentType,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    // Handle sending SMS - match both paths
    if (url.pathname === '/send-sms' || url.pathname === '/twilio-webhook/send-sms') {
      console.log('Handling send-sms endpoint');
      if (!contentType.includes('application/json')) {
        throw new Error('Send SMS endpoint requires JSON content type');
      }

      const { bookingId } = await req.json();
      console.log('Processing SMS request:', {
        bookingId,
        hasTwilioSid: !!TWILIO_ACCOUNT_SID,
        hasTwilioToken: !!TWILIO_AUTH_TOKEN,
        hasTwilioPhone: !!TWILIO_PHONE_NUMBER
      });

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        throw new Error('Missing Twilio credentials');
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Add more detailed connection logging
      console.log('Supabase connection details:', {
        url: Deno.env.get('SUPABASE_URL'),
        hasKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        keyPreview: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 10) + '...'
      });

      // Test the connection with a simple query
      const { data: testBooking, error: testError } = await supabaseClient
        .from('bookings')
        .select('id')
        .eq('id', 'b3006fd4-a92b-4155-ac20-3b0377356440')
        .single();

      console.log('Test query result:', {
        success: !!testBooking,
        error: testError?.message,
        data: testBooking
      });

      // Add this before the booking query
      const { data: columns } = await supabaseClient
        .rpc('debug_table_info', { table_name: 'bookings' })
        .select('*');

      console.log('Available columns:', columns);

      // First, get just the basic booking info
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .limit(1)  // Add limit just in case
        .maybeSingle();  // Use maybeSingle() instead of single()

      if (!booking) {
        console.error('No booking found with ID:', bookingId);
        throw new Error(`No booking found with ID: ${bookingId}`);
      }

      if (bookingError) {
        console.error('Booking fetch error:', bookingError);
        throw new Error(`Failed to fetch booking: ${bookingError.message}`);
      }

      // Log the booking data to see what columns are actually available
      console.log('Raw booking data:', booking);

      // Try to find the customer using either customer_id or user_id
      const customerId = booking.customer_id || booking.user_id;
      if (!customerId) {
        throw new Error('No customer ID found in booking');
      }

      // Fetch customer details
      const { data: customer, error: customerError } = await supabaseClient
        .from('customers')
        .select('first_name, last_name')
        .eq('id', customerId)
        .single();

      if (customerError) {
        console.error('Customer fetch error:', customerError);
        throw new Error(`Failed to fetch customer: ${customerError.message}`);
      }

      console.log('Found booking:', {
        id: booking.id,
        from: booking.from_location,
        to: booking.to_location,
        customer: `${customer.first_name} ${customer.last_name}`
      });

      // Fetch drivers
      const { data: drivers, error: driversError } = await supabaseClient
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .eq('documents_verified', true)
        .eq('is_available', true)
        .not('mobile_number', 'is', null);  // Only get drivers with phone numbers

      if (driversError) {
        console.error('Drivers fetch error:', driversError);
        throw new Error(`Failed to fetch drivers: ${driversError.message}`);
      }

      if (!drivers?.length) {
        throw new Error('No available drivers with phone numbers found');
      }

      console.log('Found drivers with phone numbers:', drivers.map(d => ({ 
        id: d.id, 
        name: d.name,
        phone: d.mobile_number 
      })));

      // Update message content without group_size
      const messageContent = `
New Booking Alert!
From: ${booking.from_location}
To: ${booking.to_location}
Date: ${booking.departure_date}
Time: ${booking.departure_time}
Service: ${booking.service_type}
Customer: ${customer.first_name} ${customer.last_name}

Reply YES to accept this booking.
`.trim();

      // Send SMS to each driver
      for (const driver of drivers) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          console.log(`Sending SMS to driver ${driver.name} (${driver.mobile_number})`);

          const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: driver.mobile_number,
              From: TWILIO_PHONE_NUMBER,
              Body: messageContent,
            }),
          });

          const responseText = await response.text();
          console.log('Twilio response:', {
            status: response.status,
            data: responseText
          });

          if (!response.ok) {
            throw new Error(`Twilio API error: ${responseText}`);
          }

          // Create notification record
          const { error: notificationError } = await supabaseClient
            .from('driver_notifications')
            .insert({
              booking_id: bookingId,
              driver_id: driver.id,
              status: 'PENDING',
            });

          if (notificationError) {
            console.error('Notification creation error:', notificationError);
            throw new Error(`Failed to create notification: ${notificationError.message}`);
          }
        } catch (error) {
          console.error(`Failed to process driver ${driver.name}:`, error);
          throw error;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle webhook - match both paths
    else if (url.pathname === '/webhook' || url.pathname === '/twilio-webhook/webhook') {
      console.log('Handling webhook endpoint');
      if (!contentType.includes('application/x-www-form-urlencoded')) {
        throw new Error('Webhook endpoint requires form data');
      }

      const formData = await req.formData();
      const messageBody = formData.get('Body')?.toString().trim().toUpperCase() || '';
      const fromNumber = formData.get('From')?.toString() || '';

      // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Find the driver by phone number
      const { data: driver, error: driverError } = await supabaseClient
        .from('drivers')
        .select('id')
        .eq('mobile_number', fromNumber)
        .single();

      if (driverError || !driver) {
        console.error('Driver not found:', driverError);
        return new Response(
          'Error: Driver not found',
          { status: 404, headers: corsHeaders }
        );
      }

      // Find pending notification for this driver
      const { data: notification, error: notificationError } = await supabaseClient
        .from('driver_notifications')
        .select('booking_id')
        .eq('driver_id', driver.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (notificationError || !notification) {
        console.error('No pending notification found:', notificationError);
        return new Response(
          'Error: No pending booking found',
          { status: 404, headers: corsHeaders }
        );
      }

      const accepted = messageBody === 'YES';
      
      // Update notification status
      const { error: updateError } = await supabaseClient
        .from('driver_notifications')
        .update({
          status: accepted ? 'ACCEPTED' : 'DECLINED',
          updated_at: new Date().toISOString()
        })
        .match({ driver_id: driver.id, booking_id: notification.booking_id });

      if (updateError) {
        throw updateError;
      }

      // If accepted, update booking and create assignment
      if (accepted) {
        // Update booking status
        const { error: bookingError } = await supabaseClient
          .from('bookings')
          .update({
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.booking_id);

        if (bookingError) {
          throw bookingError;
        }

        // Create trip assignment
        const { error: assignmentError } = await supabaseClient
          .from('trip_assignments')
          .insert({
            booking_id: notification.booking_id,
            driver_id: driver.id,
            status: 'assigned'
          });

        if (assignmentError) {
          throw assignmentError;
        }

        // Send confirmation message to driver
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Message>You have been assigned to this booking. Our team will contact you with more details.</Message>
          </Response>`;

        return new Response(twiml, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/xml'
          }
        });
      } else {
        // Send decline acknowledgment
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Message>You have declined this booking. Thank you for your response.</Message>
          </Response>`;

        return new Response(twiml, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/xml'
          }
        });
      }
    }

    // Log when no path matches
    console.log('No matching path for:', url.pathname);
    return new Response(
      JSON.stringify({ 
        error: 'Not found', 
        path: url.pathname,
        availablePaths: [
          '/send-sms', 
          '/webhook',
          '/twilio-webhook/send-sms',
          '/twilio-webhook/webhook'
        ]
      }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Request details:', {
      path: url.pathname,
      contentType,
      method: req.method
    });
    return handleError(error);
  }
}); 