import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function PersonalInformationStep() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          {...register("fullName", {
            required: "Full name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" }
          })}
          type="text"
          id="fullName"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Juan Dela Cruz"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="juan@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          We'll use this email for all communications regarding your application.
        </p>
      </div>

      <div>
        <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
          Mobile Number
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 flex items-center">
            <select
              className="h-full py-0 pl-3 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
              disabled
            >
              <option>+63</option>
            </select>
          </div>
          <input
            {...register("mobileNumber", {
              required: "Mobile number is required",
              pattern: {
                value: /^9\d{9}$/,
                message: "Enter a valid Philippine mobile number starting with 9"
              },
              minLength: { value: 10, message: "Mobile number must be 10 digits" },
              maxLength: { value: 10, message: "Mobile number must be 10 digits" }
            })}
            type="tel"
            id="mobileNumber"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-16"
            placeholder="9XX XXX XXXX"
          />
        </div>
        {errors.mobileNumber && (
          <p className="mt-1 text-sm text-red-500">{errors.mobileNumber.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Enter your 10-digit mobile number without the leading zero.
        </p>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Complete Address
        </label>
        <textarea
          {...register("address", {
            required: "Address is required",
            minLength: { value: 10, message: "Please provide a complete address" }
          })}
          id="address"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="House/Unit Number, Street Name, Barangay, City/Municipality, Province, ZIP Code"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Please provide your complete residential address.
        </p>
      </div>
    </div>
  );
}