import React from 'react';
import { Link } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function PaymentCancel() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {t('payment.cancelled.title', 'Payment Cancelled')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('payment.cancelled.message', 'Your payment was cancelled. No charges were made.')}
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('payment.cancelled.tryAgain', 'Try Again')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}