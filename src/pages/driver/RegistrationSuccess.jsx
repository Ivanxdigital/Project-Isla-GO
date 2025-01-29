import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Application Submitted!</h1>
            <p className="mt-4 text-lg text-gray-600">
              Thank you for applying to be a driver with IslaGO
            </p>
          </div>

          <div className="mt-8">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800">What happens next?</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal pl-5 space-y-3">
                      <li>
                        Our team will review your application and verify all submitted documents
                        (typically within 2-3 business days)
                      </li>
                      <li>
                        You'll receive an email notification about the status of your application
                      </li>
                      <li>
                        If approved, you'll get access to our driver portal where you can complete
                        your onboarding
                      </li>
                      <li>
                        After onboarding, you can start accepting rides through the IslaGO platform
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Please check your email (including spam folder) for a verification link. You'll need
                      to verify your email address before your application can be processed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Have questions?</h3>
              <p className="text-gray-600">
                If you need assistance or have questions about your application, please don't
                hesitate to contact our support team:
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>Email: support@islago.com</li>
                <li>Phone: (123) 456-7890</li>
                <li>Support Hours: Monday - Friday, 9:00 AM - 6:00 PM</li>
              </ul>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ai-600 hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500"
              >
                Return to Home
              </Link>
              <Link
                to="/faq"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500"
              >
                View FAQs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 