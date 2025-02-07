import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase.js';
import { sendBookingConfirmationEmail } from '../utils/email.js';
import { verifyPaymentSession, mapPaymentStatus } from '../utils/paymongo.js';
import { sendBookingNotificationToDrivers } from '../utils/twilio.js';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const bookingId = sessionStorage.getItem('lastBookingId');
    console.log('Retrieved bookingId:', bookingId);

    if (!bookingId) {
      setError('No booking found');
      return;
    }

    const pollPaymentStatus = async () => {
      try {
        console.log('Polling payment status for booking:', bookingId);
        
        // Get booking details including PayMongo session ID
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('payment_status, status, confirmation_email_sent, payment_session_id')
          .eq('id', bookingId)
          .single();

        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }

        console.log('Current booking status:', booking);

        // Check PayMongo session status
        if (booking.payment_session_id) {
          const paymongoSession = await verifyPaymentSession(booking.payment_session_id);
          console.log('PayMongo session status:', paymongoSession.attributes.status);

          // If payment is already marked as paid in our database, process success
          if (booking.payment_status === 'paid') {
            console.log('Payment already marked as paid');
            setPaymentStatus('success');
            
            if (!booking.confirmation_email_sent) {
              try {
                console.log('Sending confirmation email...');
                await sendBookingConfirmationEmail(bookingId);
              } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
              }
            }
            
            sessionStorage.removeItem('lastBookingId');
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          // Map PayMongo status to our status
          const mappedStatus = mapPaymentStatus(paymongoSession.attributes.status);
          
          // Update booking status if it's different
          if (mappedStatus !== booking.payment_status) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ 
                payment_status: mappedStatus,
                status: mappedStatus === 'paid' ? 'confirmed' : booking.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingId);

            if (updateError) {
              console.error('Error updating booking status:', updateError);
            }
          }

          // Update local state based on PayMongo status
          if (mappedStatus === 'paid') {
            console.log('Payment confirmed as paid');
            setPaymentStatus('success');
            
            if (!booking.confirmation_email_sent) {
              try {
                console.log('Initiating confirmation email send...');
                await sendBookingConfirmationEmail(bookingId);
                console.log('Confirmation email sent successfully');
              } catch (emailError) {
                console.error('Detailed email error:', {
                  error: emailError,
                  message: emailError.message,
                  stack: emailError.stack
                });
                // Don't throw the error - we still want to show success
                // but maybe show a warning to the user
                setError('Payment successful but confirmation email failed to send. Our team will contact you shortly.');
              }
            }
            
            sessionStorage.removeItem('lastBookingId');
            setTimeout(() => navigate('/'), 3000);
          } else if (mappedStatus === 'failed') {
            console.log('Payment marked as failed');
            setPaymentStatus('failed');
            setError('Payment failed. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
        setError('Failed to check payment status');
      }
    };

    // Initial check
    pollPaymentStatus();

    // Poll every 3 seconds
    const pollInterval = setInterval(pollPaymentStatus, 3000);

    // Set timeout to stop polling after 5 minutes
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'processing') {
        console.log('Payment verification timed out');
        setError('Payment verification timed out. Please contact support.');
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  useEffect(() => {
    const bookingId = sessionStorage.getItem('lastBookingId');
    console.log('Retrieved bookingId:', bookingId);

    const processPaymentSuccess = async () => {
      try {
        if (!bookingId) {
          console.error('No booking ID found');
          return;
        }

        // Update payment status to trigger notifications
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', bookingId);

        if (updateError) throw updateError;

        // Clear the booking ID from session storage
        sessionStorage.removeItem('lastBookingId');
        
        // Redirect after a delay
        setTimeout(() => navigate('/'), 3000);
      } catch (error) {
        console.error('Error processing payment success:', error);
        setError('There was an issue updating the booking. Please contact support.');
      }
    };

    processPaymentSuccess();
  }, []);

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