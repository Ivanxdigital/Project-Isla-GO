import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function InsuranceDetailsStep() {
  const { register, formState: { errors } } = useFormContext();

  // Common Philippine insurance providers for commercial vehicles
  const insuranceProviders = [
    'Standard Insurance',
    'Malayan Insurance',
    'FPG Insurance',
    'Charter Ping An',
    'MAPFRE Insurance',
    'Pioneer Insurance',
    'Oriental Assurance',
    'Commonwealth Insurance',
    'BPI/MS Insurance',
    'Prudential Guarantee'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Insurance Details</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Insurance Provider
            <span className="text-red-500">*</span>
          </label>
          <select
            {...register('insuranceProvider', {
              required: 'Insurance provider is required'
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select insurance provider</option>
            {insuranceProviders.map(provider => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          {errors.insuranceProvider && (
            <p className="mt-1 text-sm text-red-600">{errors.insuranceProvider.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Policy Number
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('policyNumber', {
              required: 'Policy number is required',
              minLength: {
                value: 5,
                message: 'Policy number must be at least 5 characters'
              }
            })}
            placeholder="Enter your policy number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.policyNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.policyNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Policy Expiration Date
            <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('policyExpiration', {
              required: 'Policy expiration date is required',
              validate: value => {
                const date = new Date(value);
                const today = new Date();
                const sixMonthsFromNow = new Date();
                sixMonthsFromNow.setMonth(today.getMonth() + 6);
                return date > sixMonthsFromNow || 'Policy must be valid for at least 6 months';
              }
            })}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.policyExpiration && (
            <p className="mt-1 text-sm text-red-600">{errors.policyExpiration.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Your insurance policy should be valid for at least 6 months from today
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your vehicle must have Comprehensive Insurance coverage with Passenger Personal Accident Insurance (PPAI) for commercial use.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Required Insurance Coverage</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Comprehensive Insurance</li>
                  <li>Passenger Personal Accident Insurance (PPAI)</li>
                  <li>Third Party Liability (TPL)</li>
                  <li>Acts of Nature Coverage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}