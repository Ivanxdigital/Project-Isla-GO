import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { verifyPaymentSession } from '../utils/paymongo';
import { supabase } from '../utils/supabase';
import { sendBookingEmail } from '../utils/email';

const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY;

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [emailStatus, setEmailStatus] = useState('pending');
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLL_ATTEMPTS = 24; // Increase poll attempts (2 minutes)
  const POLL_INTERVAL = 5000; // 5 seconds

  const verifyPayment = useCallback(async (sessionId, bookingId) => {
    try {
      console.log(`Verifying payment (attempt ${pollCount + 1}/${MAX_POLL_ATTEMPTS})`, { sessionId, bookingId });
      
      const sessionData = await verifyPaymentSession(sessionId);
      console.log('Payment session data:', sessionData);

      if (!sessionData) {
        throw new Error('No session data returned');
      }

      const paymentStatus = sessionData.attributes?.payment_intent?.attributes?.status;
      const isTestMode = sessionData.attributes?.payment_intent?.attributes?.livemode === false;

      console.log('Payment status:', { paymentStatus, isTestMode });

      // Handle different payment statuses
      switch(paymentStatus?.toLowerCase()) {
        case 'succeeded':
        case 'paid':
          await updateBookingStatus(bookingId, 'completed', sessionId);
          setVerificationStatus('success');
          break;

        case 'awaiting_payment_method':
        case 'awaiting_next_action':
        case 'processing':
        case 'pending':
          if (pollCount < MAX_POLL_ATTEMPTS) {
            console.log(`Payment pending, polling... (${pollCount + 1}/${MAX_POLL_ATTEMPTS})`);
            setError('Payment is being processed. Please wait...');
            setPollCount(prev => prev + 1);
            setTimeout(() => verifyPayment(sessionId, bookingId), POLL_INTERVAL);
          } else {
            setError('Payment is still processing. Please check your booking status later.');
            setVerificationStatus('pending');
          }
          break;

        case 'failed':
        case 'cancelled':
          throw new Error(`Payment ${paymentStatus.toLowerCase()}`);

        default:
          throw new Error(`Unexpected payment status: ${paymentStatus}`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error.message || 'Payment verification failed. Please contact support.');
      setVerificationStatus('error');
    }
  }, [pollCount]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let sessionId = params.get('session_id');
    const lastBookingId = sessionStorage.getItem('lastBookingId');
    const storedSessionId = sessionStorage.getItem('paymentSessionId');

    // Debug logging
    console.log('Payment verification initialization:', {
      urlSessionId: sessionId,
      storedSessionId,
      lastBookingId,
      fullUrl: window.location.href
    });

    // Try to get a valid session ID
    if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
      if (storedSessionId) {
        console.log('Using stored session ID as fallback');
        sessionId = storedSessionId;
      } else {
        console.error('No valid session ID found');
        setError('Payment session not found. Please contact support.');
        setVerificationStatus('error');
        return;
      }
    }

    // Validate booking ID
    if (!lastBookingId) {
      console.error('No booking ID found');
      setError('Booking details not found. Please contact support.');
      setVerificationStatus('error');
      return;
    }

    // Start verification
    verifyPayment(sessionId, lastBookingId);

    // Cleanup
    return () => {
      sessionStorage.removeItem('lastBookingId');
      sessionStorage.removeItem('paymentSessionId');
    };
  }, [location.search, verifyPayment]);

  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg page-fade-in">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {t('payment.verifying', 'Verifying Payment...')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('payment.verifyingMessage', 'Please wait while we confirm your payment...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg page-fade-in">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 text-red-500">❌</div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {t('payment.error.title', 'Payment Verification Failed')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error || t('payment.error.message', 'We could not verify your payment. Please contact support if you believe this is an error.')}
            </p>
            <div className="mt-8 space-y-4">
              <Link
                to="/contact"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('payment.error.contact', 'Contact Support')}
              </Link>
              <Link
                to="/"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('payment.error.backHome', 'Return to Home')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg page-fade-in">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {t('payment.success.title', 'Payment Successful!')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {emailStatus === 'sent' 
              ? t('payment.success.emailSent', 'Your booking has been confirmed. Check your email for booking details.')
              : emailStatus === 'error'
              ? t('payment.success.emailError', 'Your booking is confirmed, but we could not send the confirmation email. Please contact support.')
              : t('payment.success.processing', 'Your booking has been confirmed. Processing confirmation email...')}
          </p>
          
          {emailStatus === 'error' && (
            <div className="mt-4">
              <Link
                to="/contact"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('payment.success.contactSupport', 'Contact Support')}
              </Link>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Link
            to="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('payment.success.backHome', 'Return to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

async function updateBookingStatus(bookingId, status, sessionId) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status,
        payment_status: status,
        payment_session_id: sessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw new Error('Failed to update booking status');
  }
}