import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function PersonalInformationStep() {
  const { register, formState: { errors } } = useFormContext();

  const PhoneNumberInput = ({ id, label, registerName, required = true }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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
          {...register(registerName, {
            required: required ? `${label} is required` : false,
            pattern: {
              value: /^(09\d{9})$/,
              message: "Please enter a valid 11-digit number starting with '09'"
            },
            minLength: {
              value: 11,
              message: "Mobile number must be 11 digits"
            },
            maxLength: {
              value: 11,
              message: "Mobile number must be 11 digits"
            }
          })}
          type="tel"
          id={id}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-16"
          placeholder="09XX XXX XXXX"
        />
      </div>
      {errors[registerName] && (
        <p className="mt-1 text-sm text-red-500">{errors[registerName].message}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Enter complete 11-digit number starting with '09' (e.g., 09993702550)
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
          <span className="text-red-500 ml-1">*</span>
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
          <span className="text-red-500 ml-1">*</span>
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

      <PhoneNumberInput
        id="mobileNumber"
        label="Contact Number"
        registerName="mobileNumber"
      />

      <PhoneNumberInput
        id="emergencyContact"
        label="Emergency Contact Number"
        registerName="emergencyContact"
      />

      <div>
        <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
          Emergency Contact Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          {...register("emergencyContactName", {
            required: "Emergency contact name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" }
          })}
          type="text"
          id="emergencyContactName"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Emergency contact full name"
        />
        {errors.emergencyContactName && (
          <p className="mt-1 text-sm text-red-500">{errors.emergencyContactName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-700">
          Relationship to Emergency Contact
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          {...register("emergencyContactRelation", {
            required: "Relationship is required"
          })}
          type="text"
          id="emergencyContactRelation"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Parent, Spouse, Sibling"
        />
        {errors.emergencyContactRelation && (
          <p className="mt-1 text-sm text-red-500">{errors.emergencyContactRelation.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Complete Address
          <span className="text-red-500 ml-1">*</span>
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