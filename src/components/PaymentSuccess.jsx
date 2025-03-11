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

// Add a simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PaymentSuccess component error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center">
              <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Something went wrong</h2>
              <p className="mt-2 text-sm text-gray-600">
                We encountered an error while processing your payment confirmation.
              </p>
              <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md text-left">
                <p className="text-sm text-red-700 font-mono overflow-auto">
                  {this.state.error && this.state.error.toString()}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Add missing state variables for driver polling
  const [driverPollingActive, setDriverPollingActive] = useState(false);
  const [driverPollingIntervalId, setDriverPollingIntervalId] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverAssigned, setDriverAssigned] = useState(false);
  const [booking, setBooking] = useState(null);
  
  // Add state to track if email and notifications have been sent
  const [emailSent, setEmailSent] = useState(false);
  const [driversNotified, setDriversNotified] = useState(false);
  const [brevoConnected, setBrevoConnected] = useState(null);

  // Add debugging state
  const [debugInfo, setDebugInfo] = useState({
    urlParams: null,
    bookingId: null,
    initialLoadTime: new Date().toISOString()
  });

  // Test Brevo connection when component mounts
  useEffect(() => {
    // Log component mount for debugging
    console.log('PaymentSuccess component mounted at:', new Date().toISOString());
    
    // Extract URL parameters for debugging
    const urlParams = new URLSearchParams(location.search);
    const bookingId = urlParams.get('bookingId');
    
    setDebugInfo(prev => ({
      ...prev,
      urlParams: Object.fromEntries(urlParams.entries()),
      bookingId
    }));
    
    console.log('URL parameters:', Object.fromEntries(urlParams.entries()));
    
    if (!bookingId) {
      console.error('Missing booking ID in URL parameters');
      setStatus('error');
      setError('Missing booking information. Please contact support.');
      return;
    }

    const checkBrevoConnection = async () => {
      try {
        console.log('Checking Brevo API configuration...');
        // Check if the Brevo API key is available
        const apiKey = import.meta.env.VITE_BREVO_API_KEY;
        const isConnected = !!apiKey;
        setBrevoConnected(isConnected);
        
        if (!isConnected) {
          console.error('Brevo API key is missing. Email notifications may not work.');
          toast.error('Email service configuration issue. Our team will contact you manually.', { id: 'brevo-connection-toast' });
        } else {
          console.log('Brevo API key is available');
        }
      } catch (error) {
        console.error('Error testing Brevo connection:', error);
        setBrevoConnected(false);
        toast.error('Email service connection error. Our team will contact you manually.', { id: 'brevo-connection-toast' });
      }
    };
    
    checkBrevoConnection();
  }, [location.search]);

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
            // Only send email if it hasn't been sent already and Brevo is connected
            if (!emailSent) {
              console.log('Preparing to send payment confirmation email for booking:', bookingId);
              
              // Check if Brevo connection is available
              if (brevoConnected === false) {
                console.error('Brevo API connection is not available. Cannot send email.');
                toast.error('Email service is currently unavailable. Our team will contact you shortly.', { id: 'email-sending-toast' });
                
                // Mark as attempted even though it failed
                setEmailSent(true);
                
                // Log this issue to the database for manual follow-up
                try {
                  await supabase
                    .from('email_failures')
                    .insert({
                      booking_id: bookingId,
                      reason: 'Brevo API connection unavailable',
                      created_at: new Date().toISOString()
                    });
                  console.log('Email failure logged to database');
                } catch (logError) {
                  console.error('Failed to log email failure:', logError);
                }
                
                return false;
              }
              
              // Show loading toast
              toast.loading('Sending confirmation email...', { id: 'email-sending-toast' });
              
              try {
                await sendPaymentConfirmationEmail(bookingId);
                console.log('Payment confirmation email sent successfully');
                toast.success('Payment confirmation email sent', { id: 'email-sending-toast' });
                setEmailSent(true);
              } catch (specificEmailError) {
                console.error('Failed to send payment confirmation email:', specificEmailError);
                toast.error('There was an issue sending the confirmation email. Our team will contact you shortly.', { id: 'email-sending-toast' });
                
                // Log the specific error for debugging
                console.error('Email error details:', specificEmailError.message);
                
                // Log this issue to the database for manual follow-up
                try {
                  await supabase
                    .from('email_failures')
                    .insert({
                      booking_id: bookingId,
                      reason: specificEmailError.message || 'Unknown error',
                      created_at: new Date().toISOString()
                    });
                  console.log('Email failure logged to database');
                } catch (logError) {
                  console.error('Failed to log email failure:', logError);
                }
                
                // Still mark as attempted
                setEmailSent(true);
              }
            } else {
              console.log('Email already sent for booking:', bookingId);
            }
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
            toast.error('There was an issue sending the confirmation email. Our team will contact you shortly.', { id: 'email-sending-toast' });
            
            // Log the specific error for debugging
            console.error('Email error details:', emailError.message);
            
            // Still mark as attempted
            setEmailSent(true);
          }

          // Try to notify drivers
          if (!driversNotified) {
            console.log('Attempting to send driver notifications for booking:', bookingId);
            try {
              await sendDriverNotifications(bookingId);
              console.log('Driver notifications sent successfully');
              toast.success('Drivers have been notified of your booking', { id: 'driver-notified-toast' });
              setDriversNotified(true);
            } catch (notificationError) {
              console.error('Failed to notify drivers:', notificationError);
              toast.error('There was an issue notifying drivers. Our team will handle this manually.', { id: 'driver-error-toast' });
            }
          } else {
            console.log('Drivers already notified for booking:', bookingId);
          }

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
          // Only send email if it hasn't been sent already and Brevo is connected
          if (!emailSent) {
            console.log('Preparing to send payment confirmation email for booking:', bookingId);
            
            // Check if Brevo connection is available
            if (brevoConnected === false) {
              console.error('Brevo API connection is not available. Cannot send email.');
              toast.error('Email service is currently unavailable. Our team will contact you shortly.', { id: 'email-sending-toast' });
              
              // Mark as attempted even though it failed
              setEmailSent(true);
              
              // Log this issue to the database for manual follow-up
              try {
                await supabase
                  .from('email_failures')
                  .insert({
                    booking_id: bookingId,
                    reason: 'Brevo API connection unavailable',
                    created_at: new Date().toISOString()
                  });
                console.log('Email failure logged to database');
              } catch (logError) {
                console.error('Failed to log email failure:', logError);
              }
              
              return false;
            }
            
            // Show loading toast
            toast.loading('Sending confirmation email...', { id: 'email-sending-toast' });
            
            try {
              await sendPaymentConfirmationEmail(bookingId);
              console.log('Payment confirmation email sent successfully');
              toast.success('Payment confirmation email sent', { id: 'email-sending-toast' });
              setEmailSent(true);
            } catch (specificEmailError) {
              console.error('Failed to send payment confirmation email:', specificEmailError);
              toast.error('There was an issue sending the confirmation email. Our team will contact you shortly.', { id: 'email-sending-toast' });
              
              // Log the specific error for debugging
              console.error('Email error details:', specificEmailError.message);
              
              // Log this issue to the database for manual follow-up
              try {
                await supabase
                  .from('email_failures')
                  .insert({
                    booking_id: bookingId,
                    reason: specificEmailError.message || 'Unknown error',
                    created_at: new Date().toISOString()
                  });
                console.log('Email failure logged to database');
              } catch (logError) {
                console.error('Failed to log email failure:', logError);
              }
              
              // Still mark as attempted
              setEmailSent(true);
            }
          } else {
            console.log('Email already sent for booking:', bookingId);
          }
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
          toast.error('There was an issue sending the confirmation email. Our team will contact you shortly.', { id: 'email-sending-toast' });
          
          // Log the specific error for debugging
          console.error('Email error details:', emailError.message);
          
          // Still mark as attempted
          setEmailSent(true);
        }

        // Try to notify drivers
        if (!driversNotified) {
          console.log('Attempting to send driver notifications for booking:', bookingId);
          try {
            await sendDriverNotifications(bookingId);
            console.log('Driver notifications sent successfully');
            toast.success('Drivers have been notified of your booking', { id: 'driver-notified-toast' });
            setDriversNotified(true);
          } catch (notificationError) {
            console.error('Failed to notify drivers:', notificationError);
            toast.error('There was an issue notifying drivers. Our team will handle this manually.', { id: 'driver-error-toast' });
          }
        } else {
          console.log('Drivers already notified for booking:', bookingId);
        }

        // Fetch booking details with customer for display
        await fetchBookingWithDriver(bookingId);

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
          customers (
            id,
            first_name,
            last_name,
            email,
            mobile_number
          )
        `)
        .filter('id', 'eq', bookingId)
        .maybeSingle();
        
      if (bookingError) {
        console.error('Error fetching booking details:', bookingError);
        return;
      }
      
      setBookingData(booking);
      setCustomerData(booking.customers);
      
      // Check if a driver has been assigned
      if (booking.assigned_driver_id) {
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .filter('id', 'eq', booking.assigned_driver_id)
          .maybeSingle();
          
        if (driverError) {
          console.error('Error fetching driver details:', driverError);
          return;
        }
        
        setDriverData(driver);
        setDriver(driver);
        setDriverAssigned(true);
      } else {
        // Set up polling for driver assignment
        startDriverPolling(bookingId);
      }
    } catch (error) {
      console.error('Error in fetchBookingWithDriver:', error);
    }
  };
  
  // Function to start polling for driver assignment
  const startDriverPolling = (bookingId) => {
    console.log('Starting driver polling for booking ID:', bookingId);
    
    // Set up polling interval - check every 5 seconds
    const driverPollingInterval = setInterval(async () => {
      try {
        console.log('Polling for driver assignment...');
        
        // Query the bookings table to check if a driver has been assigned
        const { data, error } = await supabase
          .from('bookings')
          .select('assigned_driver_id, status')
          .filter('id', 'eq', bookingId)
          .maybeSingle();
        
        if (error) {
          console.error('Error polling for driver:', error);
          return;
        }
        
        if (!data) {
          console.log('No booking data found for ID:', bookingId);
          return;
        }
        
        console.log('Polling result:', data);
        
        // If the booking status is 'finding_driver_failed', stop polling and show error
        if (data.status === 'finding_driver_failed') {
          clearInterval(driverPollingInterval);
          setDriverPollingActive(false);
          toast.error('Unable to find a driver at this time. Please try again later or contact support.', {
            duration: 10000,
          });
          return;
        }
        
        // If a driver has been assigned
        if (data.assigned_driver_id) {
          console.log('Driver assigned:', data.assigned_driver_id);
          
          // Fetch driver details
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('*')
            .filter('id', 'eq', data.assigned_driver_id)
            .maybeSingle();
          
          if (driverError) {
            console.error('Error fetching driver details:', driverError);
            return;
          }
          
          if (driverData) {
            // Update state with driver data
            setDriverData(driverData);
            setDriver(driverData);
            setDriverAssigned(true);
            
            // Stop polling
            clearInterval(driverPollingInterval);
            setDriverPollingActive(false);
            
            // Show success notification
            toast.success('Driver assigned! Check your email for details.', {
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error('Error in driver polling:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Store the interval ID
    setDriverPollingIntervalId(driverPollingInterval);
    setDriverPollingActive(true);
    
    // Clear the interval after 5 minutes to prevent excessive querying
    setTimeout(() => {
      clearInterval(driverPollingInterval);
      setDriverPollingActive(false);
      console.log('Driver polling stopped after timeout');
    }, 5 * 60 * 1000); // 5 minutes
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
      
      // Clear driver polling interval if active
      if (driverPollingIntervalId) {
        clearInterval(driverPollingIntervalId);
      }
    };
  }, []); // Empty dependency array since we manage polling internally

  // Wrap the component with the error boundary
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Debug information (only in development) */}
        {import.meta.env.DEV && (
          <div className="max-w-md w-full mb-4 p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-auto">
            <details>
              <summary className="cursor-pointer font-bold">Debug Info</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}
        
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
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}