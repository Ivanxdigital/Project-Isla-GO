import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const bookingId = sessionStorage.getItem('lastBookingId');
    if (!bookingId) {
      setError('No booking found');
      return;
    }

    const pollPaymentStatus = async () => {
      try {
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('payment_status, status')
          .eq('id', bookingId)
          .single();

        if (error) throw error;

        if (booking.payment_status === 'paid') {
          setPaymentStatus('success');
          // Clear the booking ID from session storage
          sessionStorage.removeItem('lastBookingId');
          // Redirect to home after 3 seconds
          setTimeout(() => navigate('/'), 3000);
        } else if (booking.payment_status === 'failed') {
          setPaymentStatus('failed');
          setError('Payment failed. Please try again.');
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
        setError('Failed to check payment status');
      }
    };

    // Poll every 3 seconds
    const pollInterval = setInterval(pollPaymentStatus, 3000);

    // Set timeout to stop polling after 5 minutes
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'processing') {
        setError('Payment verification timed out. Please contact support.');
      }
    }, 5 * 60 * 1000);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg page-fade-in">
        <div className="text-center">
          <div className="mx-auto h-16 w-16">
            {paymentStatus === 'success' ? (
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            ) : paymentStatus === 'failed' ? (
              <ExclamationCircleIcon className="h-16 w-16 text-red-500" />
            ) : (
              <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {paymentStatus === 'success'
              ? t('payment.success.title', 'Payment Successful')
              : paymentStatus === 'failed'
              ? t('payment.failed.title', 'Payment Failed')
              : t('payment.processing.title', 'Payment Processing')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {paymentStatus === 'success'
              ? t('payment.success.message', 'Your payment has been confirmed. You will receive an email confirmation shortly.')
              : paymentStatus === 'failed'
              ? t('payment.failed.message', 'There was an issue processing your payment.')
              : t('payment.processing.message', 'Please wait while we verify your payment...')}
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {paymentStatus === 'failed' && (
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