import React from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function BeforeRegister() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Become an IslaGO Driver
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="rounded-md bg-blue-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Account Required</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To become an IslaGO driver, you'll need to create an account or sign in to your existing account first. 
                    This helps us maintain a secure and reliable service for our customers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ai-600 hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500"
              >
                Create New Account
              </Link>
            </div>
            <div>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500"
              >
                Sign in to Existing Account
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Why create an account?</span>
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <ul className="list-disc pl-5 space-y-2">
                <li>Secure and verified driver registration process</li>
                <li>Track your application status</li>
                <li>Access to driver portal and earnings dashboard</li>
                <li>Receive important updates and notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 