import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase.ts';
import { verifyPaymentSession, mapPaymentStatus } from '../utils/paymongo.js';
import { sendDriverNotifications } from '../utils/twilio.js';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const MAX_POLLING_ATTEMPTS = 10;
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
        }
        
        setStatus('success');
        
        // Add a slight delay before redirecting
        setTimeout(() => {
          navigate('/manage-bookings', { 
            state: { 
              message: 'Payment successful! You can view your booking details below.',
              type: 'success'
            }
          });
        }, 2000);
        
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

        // Try to notify drivers
        try {
          console.log('Attempting to send driver notifications for booking:', bookingId);
          
          await sendDriverNotifications(bookingId);
          console.log('Driver notifications sent successfully');
          toast.success('Drivers have been notified of your booking');
        } catch (error) {
          console.error('Failed to notify drivers:', error);
          toast.error('There was an issue notifying drivers. Our team will handle this manually.');
        }

        setStatus('success');
        
        // Add a slight delay before redirecting
        setTimeout(() => {
          navigate('/manage-bookings', { 
            state: { 
              message: 'Payment successful! You can view your booking details below.',
              type: 'success'
            }
          });
        }, 2000);
        
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