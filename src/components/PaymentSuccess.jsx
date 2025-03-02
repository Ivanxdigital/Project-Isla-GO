import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase.ts';
import { verifyPaymentSession, mapPaymentStatus } from '../utils/paymongo.js';
import { sendDriverNotifications } from '../utils/twilio.js';
import { sendPaymentConfirmationEmail } from '../utils/brevo.js';
import toast from 'react-hot-toast';
import DriverDetails from './DriverDetails.jsx';
import ContactOptions from './ContactOptions.jsx';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const MAX_POLLING_ATTEMPTS = 10;
  const POLLING_INTERVAL = 3000; // 3 seconds between attempts
  
  // Add new state for booking and driver data
  const [bookingData, setBookingData] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const pollPaymentStatus = async () => {
    try {
      // Get booking ID from URL
      const urlParams = new URLSearchParams(location.search);
      const bookingId = urlParams.get('bookingId');

      console.log('Initial parameters:', { bookingId, attempt: pollingAttempts + 1 });

      if (!bookingId) {
        console.error('Missing booking ID');
        throw new Error('Missing booking information');
      }

      // Get both payment and booking records
      const { data: records, error: fetchError } = await supabase
        .from('payments')
        .select(`
          id,
          status,
          provider_session_id
        `)
        .eq('booking_id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching records:', fetchError);
        throw new Error('Failed to retrieve payment information');
      }

      // If we have no records, keep polling
      if (!records) {
        console.log('No payment records found yet, will retry...');
        return false;
      }

      // If the payment is already marked as paid, we can stop polling
      if (records.status === 'paid') {
        console.log('Payment confirmed:', bookingId);
        
        try {
          // Update booking status
          const { error: bookingError } = await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

          if (bookingError) {
            console.error('Error updating booking:', bookingError);
            throw new Error('Failed to update booking status');
          }

          // Send confirmation email via Brevo
          try {
            console.log('Sending payment confirmation email for booking:', bookingId);
            await sendPaymentConfirmationEmail(bookingId);
            console.log('Payment confirmation email sent successfully');
            toast.success('Payment confirmation email sent');
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
            toast.error('There was an issue sending the confirmation email');
          }

          // Try to notify drivers
          console.log('Attempting to send driver notifications for booking:', bookingId);
          await sendDriverNotifications(bookingId);
          console.log('Driver notifications sent successfully');
          toast.success('Drivers have been notified of your booking');
          
          // Fetch booking details with customer for display
          await fetchBookingWithDriver(bookingId);
        } catch (error) {
          console.error('Failed to notify drivers:', error);
          toast.error('There was an issue notifying drivers. Our team will handle this manually.');
          
          // Continue with fetching booking details even if driver notification fails
          await fetchBookingWithDriver(bookingId);
        }
        
        setStatus('success');
        
        // Change redirection behavior - wait longer to allow viewing driver details
        setTimeout(() => {
          navigate('/manage-bookings', { 
            state: { 
              message: 'Payment successful! You can view your booking details below.',
              type: 'success'
            }
          });
        }, 10000); // Give more time (10 seconds) to see the driver details
        
        return true;
      }

      if (!records.provider_session_id) {
        console.log('No payment session found yet, will retry...');
        return false;
      }

      // Add 'cs_' prefix if not present
      const fullSessionId = records.provider_session_id.startsWith('cs_') 
        ? records.provider_session_id 
        : `cs_${records.provider_session_id}`;

      // Verify the payment session with PayMongo
      console.log('Verifying payment session:', fullSessionId);
      const sessionData = await verifyPaymentSession(fullSessionId);
      
      if (!sessionData) {
        console.log('No session data received, will retry...');
        return false;
      }

      console.log('Session data received:', sessionData);
      const paymentStatus = mapPaymentStatus(sessionData.attributes.status);
      console.log('Mapped payment status:', paymentStatus);

      if (paymentStatus === 'paid') {
        // Update payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', records.id);

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
          throw new Error('Failed to update payment status');
        }

        // Update booking status
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (bookingError) {
          console.error('Error updating booking:', bookingError);
          throw new Error('Failed to update booking status');
        }

        // Send confirmation email via Brevo
        try {
          console.log('Sending payment confirmation email for booking:', bookingId);
          await sendPaymentConfirmationEmail(bookingId);
          console.log('Payment confirmation email sent successfully');
          toast.success('Payment confirmation email sent');
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
          toast.error('There was an issue sending the confirmation email');
        }

        // Try to notify drivers
        try {
          console.log('Attempting to send driver notifications for booking:', bookingId);
          await sendDriverNotifications(bookingId);
          console.log('Driver notifications sent successfully');
          toast.success('Drivers have been notified of your booking');
          
          // Fetch booking details with customer for display
          await fetchBookingWithDriver(bookingId);
        } catch (error) {
          console.error('Failed to notify drivers:', error);
          toast.error('There was an issue notifying drivers. Our team will handle this manually.');
          
          // Continue with fetching booking details even if driver notification fails
          await fetchBookingWithDriver(bookingId);
        }

        setStatus('success');
        
        // Change redirection behavior - wait longer to allow viewing driver details  
        setTimeout(() => {
          navigate('/manage-bookings', { 
            state: { 
              message: 'Payment successful! You can view your booking details below.',
              type: 'success'
            }
          });
        }, 10000); // Give more time (10 seconds) to see the driver details
        
        return true;
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
        setError('Payment verification failed');
        return true;
      } else if (paymentStatus === 'pending') {
        console.log('Payment still pending, will retry...');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error processing payment:', error);
      if (pollingAttempts >= MAX_POLLING_ATTEMPTS - 1) {
        setStatus('error');
        setError(error.message);
        return true;
      }
      return false;
    }
  };

  // New function to fetch booking with driver information
  const fetchBookingWithDriver = async (bookingId) => {
    try {
      // Fetch booking with customer information
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (*)
        `)
        .eq('id', bookingId)
        .single();
        
      if (bookingError) {
        console.error('Error fetching booking details:', bookingError);
        return;
      }
      
      setBookingData(booking);
      setCustomerData(booking.customers);
      
      // Check if a driver has been assigned
      if (booking.driver_id) {
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', booking.driver_id)
          .single();
          
        if (driverError) {
          console.error('Error fetching driver details:', driverError);
          return;
        }
        
        setDriverData(driver);
      } else {
        // Set up polling for driver assignment
        startDriverPolling(bookingId);
      }
    } catch (error) {
      console.error('Error in fetchBookingWithDriver:', error);
    }
  };
  
  // New function to poll for driver assignment
  const startDriverPolling = async (bookingId) => {
    // Start a polling interval to check for driver assignment
    const driverInterval = setInterval(async () => {
      try {
        // Use a simpler query to avoid 400 errors
        const { data, error } = await supabase
          .from('bookings')
          .select('driver_id, status')
          .filter('id', 'eq', bookingId)
          .limit(1)
          .maybeSingle();
          
        if (error) {
          console.error('Error polling for driver:', error);
          clearInterval(driverInterval);
          return;
        }
        
        if (!data) {
          console.log('No booking data found during polling');
          return;
        }
        
        // If a driver has been assigned, fetch driver details
        if (data.driver_id) {
          clearInterval(driverInterval);
          
          const { data: driver, error: driverError } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', data.driver_id)
            .single();
            
          if (driverError) {
            console.error('Error fetching assigned driver:', driverError);
            return;
          }
          
          setDriverData(driver);
          toast.success('A driver has been assigned to your booking!');
        }
        
        // If booking status has changed to 'finding_driver_failed', stop polling
        if (data.status === 'finding_driver_failed') {
          clearInterval(driverInterval);
          toast.error('We could not find an available driver. Our team will contact you shortly.');
        }
      } catch (error) {
        console.error('Error in driver polling:', error);
        clearInterval(driverInterval);
      }
    }, 5000); // Check every 5 seconds
    
    // Clean up interval after 5 minutes (300000ms) maximum
    setTimeout(() => {
      clearInterval(driverInterval);
    }, 300000);
    
    return driverInterval;
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const startPolling = async () => {
      if (!mounted) return;

      try {
        const isComplete = await pollPaymentStatus();
        
        if (!isComplete && pollingAttempts < MAX_POLLING_ATTEMPTS && mounted) {
          setPollingAttempts(prev => prev + 1);
          timeoutId = setTimeout(startPolling, POLLING_INTERVAL);
        } else if (pollingAttempts >= MAX_POLLING_ATTEMPTS && mounted) {
          setStatus('error');
          setError('Payment verification timed out. Please contact support if payment was completed.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (mounted) {
          setStatus('error');
          setError(error.message);
        }
      }
    };

    startPolling();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Empty dependency array since we manage polling internally

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16">
            {status === 'success' ? (
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            ) : status === 'error' || status === 'failed' ? (
              <ExclamationCircleIcon className="h-16 w-16 text-red-500" />
            ) : (
              <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {status === 'success'
              ? t('payment.success.title', 'Payment Successful')
              : status === 'error' || status === 'failed'
              ? t('payment.failed.title', 'Payment Failed')
              : t('payment.processing.title', 'Payment Processing')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status === 'success'
              ? t('payment.success.message', 'Your payment has been confirmed.')
              : status === 'error' || status === 'failed'
              ? error || t('payment.failed.message', 'There was an issue processing your payment.')
              : t('payment.processing.message', 'Please wait while we verify your payment...')}
          </p>
          
          {status === 'success' && !driverData && (
            <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-700">
                We're looking for available drivers. Please wait a moment...
              </p>
            </div>
          )}
          
          {(status === 'error' || status === 'failed') && (
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('payment.failed.returnHome', 'Return to Home')}
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Show driver details and contact options only if payment successful */}
      {status === 'success' && bookingData && customerData && (
        <div className="mt-8 max-w-md w-full space-y-6">
          {/* Show driver details if a driver is assigned */}
          {driverData && (
            <DriverDetails 
              driver={driverData} 
              booking={bookingData}
              customer={customerData}
            />
          )}
          
          {/* Show contact options regardless of driver assignment */}
          <ContactOptions 
            booking={bookingData}
            driver={driverData}
            customer={customerData}
          />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              You'll be redirected to manage bookings in a few seconds.
            </p>
            <Link
              to="/manage-bookings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Bookings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}