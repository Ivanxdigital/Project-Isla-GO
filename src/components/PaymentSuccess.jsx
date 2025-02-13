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
  
  // Get both bookingId and sessionId from URL
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');
  const sessionId = params.get('session_id');

  const pollPaymentStatus = async () => {
    try {
      console.log('Polling payment status for booking:', bookingId);
      
      // First verify the payment session with PayMongo
      const sessionData = await verifyPaymentSession(sessionId);
      const paymentStatus = mapPaymentStatus(sessionData.attributes.status);
      
      console.log('Payment session status:', paymentStatus);

      if (paymentStatus === 'paid') {
        // Update booking status in Supabase
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid',
            payment_session_id: sessionId
          })
          .eq('id', bookingId);

        if (updateError) throw updateError;

        // Try to send notifications
        try {
          console.log('Sending driver notifications...');
          await notifyDrivers(bookingId);
        } catch (notifyError) {
          console.error('Driver notification failed:', notifyError);
          // Don't fail the whole process if notifications fail
        }

        setStatus('success');
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
      console.log('Sending notification for booking:', bookingId);
      console.log('Using API URL:', '/api/send-driver-sms');

      const response = await fetch('/api/send-driver-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${text}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending driver notifications:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (bookingId && sessionId) {
      pollPaymentStatus();
    } else {
      setError('Missing booking or session information');
      setStatus('error');
    }
  }, [bookingId, sessionId]);

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