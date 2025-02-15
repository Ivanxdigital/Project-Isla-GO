import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase.ts';
import { verifyPaymentSession, mapPaymentStatus } from '../utils/paymongo.js';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  
  const pollPaymentStatus = async () => {
    try {
      // Get parameters from URL or sessionStorage
      const urlParams = new URLSearchParams(location.search);
      let sessionId = urlParams.get('session_id');
      let bookingId = urlParams.get('bookingId');

      console.log('Initial parameters:', { sessionId, bookingId, urlParams: Object.fromEntries(urlParams) });

      // If not in URL, try sessionStorage
      if (!sessionId) {
        sessionId = sessionStorage.getItem('paymentSessionId');
        console.log('Retrieved session ID from storage:', sessionId);
      }
      if (!bookingId) {
        bookingId = sessionStorage.getItem('bookingId');
        console.log('Retrieved booking ID from storage:', bookingId);
      }

      // If still no session ID but we have booking ID, try to get it from the database
      if (!sessionId && bookingId) {
        console.log('Attempting to fetch session ID from database for booking:', bookingId);
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('payment_session_id')
          .eq('id', bookingId)
          .single();

        if (!error && booking?.payment_session_id) {
          sessionId = booking.payment_session_id;
          console.log('Retrieved session ID from database:', sessionId);
        }
      }

      console.log('Payment verification starting...', {
        bookingId,
        sessionId,
        url: location.search
      });

      if (!sessionId || !bookingId) {
        console.error('Missing required parameters:', { sessionId, bookingId });
        throw new Error('Missing booking or session information');
      }

      // Add 'cs_' prefix if not present
      const fullSessionId = sessionId.startsWith('cs_') ? sessionId : `cs_${sessionId}`;

      // First verify the payment session with PayMongo
      console.log('Verifying payment session:', fullSessionId);
      const sessionData = await verifyPaymentSession(fullSessionId);
      
      if (!sessionData) {
        throw new Error('Failed to retrieve session data');
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
            payment_session_id: fullSessionId,
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
        
        // Only clear storage after successful update
        setTimeout(() => {
          sessionStorage.removeItem('paymentSessionId');
          sessionStorage.removeItem('paymentIntentId');
          sessionStorage.removeItem('bookingId');
          sessionStorage.removeItem('paymentAmount');
        }, 5000); // Wait 5 seconds before clearing
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
        setError('Payment verification failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setStatus('error');
      setError(error.message);
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

      console.log('Attempting to send notification for booking:', bookingId);
      
      // Mark as notified immediately to prevent retries
      sessionStorage.setItem(notificationKey, 'true');

      // Only proceed with API call if the endpoint exists
      if (import.meta.env.VITE_ENABLE_DRIVER_NOTIFICATIONS === 'true') {
        const response = await fetch('/api/send-driver-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookingId }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Driver notification sent successfully:', result);
        return result;
      } else {
        console.log('Driver notifications are disabled');
        return null;
      }
    } catch (error) {
      console.warn('Error sending driver notifications:', error);
      // Don't throw the error, just log it
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let pollInterval;
    let retryCount = 0;
    const maxRetries = 5;
    
    const startPolling = async () => {
      if (mounted) {
        try {
          await pollPaymentStatus();
          
          // If status is still processing and we haven't exceeded max retries,
          // poll every 5 seconds
          if (mounted && status === 'processing' && retryCount < maxRetries) {
            pollInterval = setInterval(() => {
              retryCount++;
              if (retryCount >= maxRetries) {
                clearInterval(pollInterval);
                setStatus('error');
                setError('Payment verification timed out');
              } else {
                pollPaymentStatus();
              }
            }, 5000);
          }
        } catch (error) {
          console.error('Polling error:', error);
          if (retryCount < maxRetries) {
            // Wait 2 seconds before retrying
            setTimeout(startPolling, 2000);
            retryCount++;
          } else {
            setStatus('error');
            setError('Payment verification failed after multiple attempts');
          }
        }
      }
    };
    
    startPolling();
    
    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [location.search]);

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