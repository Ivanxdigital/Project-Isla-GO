import React from 'react';
import { useFormContext } from 'react-hook-form';

const LICENSE_TYPES = [
  'Professional',
  'Non-Professional',
  'Student'
];

export default function LicenseDetailsStep() {
  const { register, formState: { errors } } = useFormContext();
  
  // Get tomorrow's date for minimum expiration date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
          Driver's License Number
        </label>
        <input
          {...register("licenseNumber", {
            required: "License number is required",
            pattern: {
              value: /^[A-Z0-9-]+$/i,
              message: "Enter a valid license number"
            },
            minLength: {
              value: 8,
              message: "License number must be at least 8 characters"
            }
          })}
          type="text"
          id="licenseNumber"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="XXX-XX-XXXXXX"
        />
        {errors.licenseNumber && (
          <p className="mt-1 text-sm text-red-500">{errors.licenseNumber.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Enter your LTO driver's license number exactly as it appears on your license.
        </p>
      </div>

      <div>
        <label htmlFor="licenseType" className="block text-sm font-medium text-gray-700">
          Type of License
        </label>
        <select
          {...register("licenseType", {
            required: "License type is required"
          })}
          id="licenseType"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select license type</option>
          {LICENSE_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.licenseType && (
          <p className="mt-1 text-sm text-red-500">{errors.licenseType.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Professional license holders may be given priority during the application process.
        </p>
      </div>

      <div>
        <label htmlFor="licenseExpiration" className="block text-sm font-medium text-gray-700">
          License Expiration Date
        </label>
        <input
          {...register("licenseExpiration", {
            required: "Expiration date is required",
            validate: {
              futureDate: (value) => {
                const date = new Date(value);
                const today = new Date();
                return date > today || "Expiration date must be in the future";
              }
            }
          })}
          type="date"
          id="licenseExpiration"
          min={minDate}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.licenseExpiration && (
          <p className="mt-1 text-sm text-red-500">{errors.licenseExpiration.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Your license must be valid for at least 6 months from today.
        </p>
      </div>

      <div className="rounded-md bg-yellow-50 p-4">
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
                Please ensure your license information is accurate and up-to-date. You will be required
                to upload a clear copy of your license in the documents section.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}