import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase.ts';
import { verifyPaymentSession, mapPaymentStatus } from '../utils/paymongo.js';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const MAX_POLLING_ATTEMPTS = 10; // Increase max attempts
  const POLLING_INTERVAL = 3000; // 3 seconds between attempts
  
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

      // Get the session ID from the database using the booking ID
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('payment_session_id, status, payment_status')
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        console.error('Error fetching booking:', bookingError);
        throw new Error('Failed to retrieve booking information');
      }

      // If the booking is already marked as paid, we can skip verification
      if (booking?.payment_status === 'paid' && booking?.status === 'confirmed') {
        console.log('Booking already confirmed:', bookingId);
        setStatus('success');
        
        // Try to send notifications even if booking is confirmed
        console.log('Attempting to send notifications for confirmed booking');
        await notifyDrivers(bookingId);
        
        return true; // Signal successful verification
      }

      if (!booking?.payment_session_id) {
        // If we don't have a session ID yet, we'll try again
        console.log('No payment session found yet, will retry...');
        return false; // Signal to continue polling
      }

      const sessionId = booking.payment_session_id;
      console.log('Payment verification starting...', {
        bookingId,
        sessionId,
        attempt: pollingAttempts + 1
      });

      // Add 'cs_' prefix if not present
      const fullSessionId = sessionId.startsWith('cs_') ? sessionId : `cs_${sessionId}`;

      // Verify the payment session with PayMongo
      console.log('Verifying payment session:', fullSessionId);
      const sessionData = await verifyPaymentSession(fullSessionId);
      
      if (!sessionData) {
        console.log('No session data received, will retry...');
        return false; // Signal to continue polling
      }

      console.log('Session data received:', sessionData);
      const paymentStatus = mapPaymentStatus(sessionData.attributes.status);
      console.log('Mapped payment status:', paymentStatus);

      if (paymentStatus === 'paid') {
        // Update booking status in Supabase
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking:', updateError);
          throw updateError;
        }

        // Try to send notifications but don't wait for them
        notifyDrivers(bookingId).catch(console.error);

        setStatus('success');
        
        // Add a slight delay before redirecting to ensure the success message is seen
        setTimeout(() => {
          navigate('/bookings', { 
            state: { 
              message: 'Payment successful! You can view your booking details below.',
              type: 'success'
            }
          });
        }, 2000);
        
        return true; // Signal successful verification
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
        setError('Payment verification failed');
        return true; // Signal to stop polling
      } else if (paymentStatus === 'pending') {
        console.log('Payment still pending, will retry...');
        return false; // Signal to continue polling
      }

      return false; // Continue polling by default
    } catch (error) {
      console.error('Error processing payment:', error);
      // Only set error state if we've exceeded max attempts
      if (pollingAttempts >= MAX_POLLING_ATTEMPTS - 1) {
        setStatus('error');
        setError(error.message);
        return true; // Signal to stop polling
      }
      return false; // Signal to continue polling
    }
  };

  const notifyDrivers = async (bookingId) => {
    try {
      // Check if we've already tried to notify for this booking
      const notificationKey = `notification_sent_${bookingId}`;
      if (sessionStorage.getItem(notificationKey)) {
        console.log('Notification already sent for booking:', bookingId);
        return;
      }

      console.log('Starting driver notification process for booking:', bookingId);
      
      // Mark as notified immediately to prevent retries
      sessionStorage.setItem(notificationKey, 'true');

      // Get the base URL for the API
      const baseUrl = process.env.NODE_ENV === 'development'
        ? process.env.VITE_API_URL || 'http://localhost:3001'
        : '';

      const apiUrl = `${baseUrl}/api/send-driver-sms`;

      console.log('Sending notification request to:', apiUrl);

      // Call the SMS API endpoint
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials for CORS
        body: JSON.stringify({ bookingId }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API error: ${errorData.error || response.status}`);
      }

      const result = await response.json();
      console.log('Driver notification result:', result);
      
      if (result.messagesSent === 0) {
        console.warn('No messages were sent to drivers');
        toast.warning('No available drivers found at the moment. Our team will contact you shortly.');
      } else {
        toast.success(`Notification sent to ${result.messagesSent} drivers`);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending driver notifications:', error);
      toast.error('Unable to notify drivers. Our team will contact you shortly.');
      // Don't throw the error, just log it
      return null;
    }
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
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
    </div>
  );
}