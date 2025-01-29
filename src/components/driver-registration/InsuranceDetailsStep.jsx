import React from 'react';
import { useFormContext } from 'react-hook-form';

const INSURANCE_PROVIDERS = [
  'Standard Insurance',
  'Malayan Insurance',
  'Prudential Guarantee',
  'FPG Insurance',
  'Pioneer Insurance',
  'MAPFRE Insurance',
  'Other'
];

export default function InsuranceDetailsStep() {
  const { register, formState: { errors }, watch } = useFormContext();
  const selectedProvider = watch('insuranceProvider');
  
  // Get tomorrow's date for minimum expiration date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700">
          Insurance Provider
        </label>
        <select
          {...register("insuranceProvider", {
            required: "Insurance provider is required"
          })}
          id="insuranceProvider"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select insurance provider</option>
          {INSURANCE_PROVIDERS.map(provider => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
        {errors.insuranceProvider && (
          <p className="mt-1 text-sm text-red-500">{errors.insuranceProvider.message}</p>
        )}
      </div>

      {selectedProvider === 'Other' && (
        <div>
          <label htmlFor="otherInsuranceProvider" className="block text-sm font-medium text-gray-700">
            Specify Insurance Provider
          </label>
          <input
            {...register("otherInsuranceProvider", {
              required: selectedProvider === 'Other' ? "Please specify your insurance provider" : false
            })}
            type="text"
            id="otherInsuranceProvider"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter insurance provider name"
          />
          {errors.otherInsuranceProvider && (
            <p className="mt-1 text-sm text-red-500">{errors.otherInsuranceProvider.message}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700">
          Policy Number
        </label>
        <input
          {...register("policyNumber", {
            required: "Policy number is required",
            pattern: {
              value: /^[A-Z0-9-]+$/i,
              message: "Enter a valid policy number"
            },
            minLength: {
              value: 5,
              message: "Policy number must be at least 5 characters"
            }
          })}
          type="text"
          id="policyNumber"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your policy number"
        />
        {errors.policyNumber && (
          <p className="mt-1 text-sm text-red-500">{errors.policyNumber.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="policyExpiration" className="block text-sm font-medium text-gray-700">
          Policy Expiration Date
        </label>
        <input
          {...register("policyExpiration", {
            required: "Policy expiration date is required",
            validate: {
              futureDate: (value) => {
                const date = new Date(value);
                const today = new Date();
                return date > today || "Policy expiration date must be in the future";
              },
              minDuration: (value) => {
                const date = new Date(value);
                const threeMonths = new Date();
                threeMonths.setMonth(threeMonths.getMonth() + 3);
                return date > threeMonths || "Policy must be valid for at least 3 months";
              }
            }
          })}
          type="date"
          id="policyExpiration"
          min={minDate}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.policyExpiration && (
          <p className="mt-1 text-sm text-red-500">{errors.policyExpiration.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Your insurance policy must be valid for at least 3 months from today.
        </p>
      </div>

      <div>
        <label htmlFor="coverageType" className="block text-sm font-medium text-gray-700">
          Coverage Type
        </label>
        <select
          {...register("coverageType", {
            required: "Coverage type is required"
          })}
          id="coverageType"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select coverage type</option>
          <option value="Comprehensive">Comprehensive</option>
          <option value="CTPL">CTPL Only</option>
        </select>
        {errors.coverageType && (
          <p className="mt-1 text-sm text-red-500">{errors.coverageType.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Comprehensive coverage is recommended for better protection.
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
            <h3 className="text-sm font-medium text-yellow-800">Insurance Requirements</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Must have comprehensive insurance coverage</li>
                <li>Policy must include passenger insurance</li>
                <li>Policy must be valid for at least 6 months from registration date</li>
                <li>Insurance provider must be accredited by the Insurance Commission</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Note</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                You will be required to upload a copy of your insurance policy in the documents
                section. Please ensure all information matches your policy document exactly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}