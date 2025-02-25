import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function LicenseDetailsStep() {
  const { register, formState: { errors } } = useFormContext();

  // Philippine license types
  const licenseTypes = [
    { value: 'professional', label: 'Professional - Any vehicle except motorcycle' },
    { value: 'sp_professional', label: 'Professional with SP - Special Permit for PUV' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">License Details</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            License Number
            <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-1">(e.g., N01-12-345678)</span>
          </label>
          <input
            type="text"
            {...register('licenseNumber', {
              required: 'License number is required',
              pattern: {
                value: /^[A-Z][0-9]{2}-\d{2}-\d{6}$/,
                message: 'Please enter a valid LTO license number format'
              }
            })}
            placeholder="N01-12-345678"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.licenseNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            License Type
            <span className="text-red-500">*</span>
          </label>
          <select
            {...register('licenseType', {
              required: 'Please select a license type'
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select license type</option>
            {licenseTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.licenseType && (
            <p className="mt-1 text-sm text-red-600">{errors.licenseType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            License Expiration Date
            <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('licenseExpiration', {
              required: 'License expiration date is required',
              validate: value => {
                const date = new Date(value);
                const today = new Date();
                return date > today || 'License must not be expired';
              }
            })}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.licenseExpiration && (
            <p className="mt-1 text-sm text-red-600">{errors.licenseExpiration.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Note: Your professional license should be valid for at least 6 months
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
                Make sure your license is a valid Professional Driver's License with appropriate restrictions for public utility vehicles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}