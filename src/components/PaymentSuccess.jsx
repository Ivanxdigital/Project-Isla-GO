import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase.js';
import { sendBookingConfirmationEmail } from '../utils/email.js';
import { verifyPaymentSession, mapPaymentStatus } from '../utils/paymongo.js';
import { sendBookingNotificationToDrivers } from '../utils/twilio.js';
import { toast } from 'react-hot-toast';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [error, setError] = useState(null);
  
  const notifyDrivers = async (bookingId) => {
    try {
      console.log('Sending notification for booking:', bookingId);
      
      // Use environment-specific URL
      const apiUrl = import.meta.env.PROD 
        ? '/api/send-driver-sms'  // Production URL
        : 'http://localhost:3001/api/send-driver-sms';  // Development URL - use your actual dev server port
      
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId })
      });

      // Log response details for debugging
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send notifications');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending driver notifications:', {
        error,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const pollPaymentStatus = async () => {
    try {
      const bookingId = sessionStorage.getItem('lastBookingId');
      console.log('Polling payment status for booking:', bookingId);

      if (!bookingId) {
        setError('No booking found');
        return;
      }

      // Get booking details including PayMongo session ID
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('payment_status, status, confirmation_email_sent, payment_session_id, driver_notification_sent')
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        console.error('Error fetching booking:', bookingError);
        throw bookingError;
      }

      console.log('Current booking status:', booking);

      if (booking.payment_status === 'paid') {
        try {
          if (!booking.driver_notification_sent) {
            console.log('Sending driver notifications...');
            await notifyDrivers(bookingId);
            
            // Update booking status after successful notification
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ 
                driver_notification_sent: true,
                driver_notification_sent_at: new Date().toISOString(),
                status: 'PENDING_DRIVER_ACCEPTANCE'
              })
              .eq('id', bookingId);

            if (updateError) {
              console.error('Error updating booking status:', updateError);
            }
          }
          
          setPaymentStatus('success');
          sessionStorage.removeItem('lastBookingId');
          setTimeout(() => navigate('/'), 3000);
        } catch (notificationError) {
          console.error('Driver notification failed:', notificationError);
          toast.error('Payment successful but failed to notify drivers. Our team will handle this manually.');
          // Continue with success flow even if notification fails
          setPaymentStatus('success');
        }
      } else if (booking.payment_status === 'failed') {
        setPaymentStatus('failed');
        setError('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
      setError(error.message);
      setPaymentStatus('error');
    }
  };

  useEffect(() => {
    pollPaymentStatus();
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

        // Update payment status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ payment_status: 'paid' })
          .eq('id', bookingId);

        if (updateError) throw updateError;

        // Add driver notification here
        try {
          console.log('Starting SMS notification process for booking:', bookingId);
          const response = await fetch('/api/send-driver-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              bookingId,
              test: true // Add this flag for testing
            }),
          });

          const data = await response.json();
          console.log('SMS test response:', data);
          
          if (!response.ok) {
            throw new Error(`SMS test failed: ${data.error}`);
          }
        } catch (notificationError) {
          console.error('Error sending driver notifications:', {
            error: notificationError,
            message: notificationError.message,
            stack: notificationError.stack
          });
        }

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