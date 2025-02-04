import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg page-fade-in">
        <div className="text-center">
          <div className="mx-auto h-16 w-16">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {t('payment.processing.title', 'Payment Processing')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('payment.processing.message', 'Your payment is being processed. You will receive an email confirmation shortly.')}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            {t('payment.processing.redirect', 'Redirecting to home page...')}
          </p>
        </div>
      </div>
    </div>
  );
}