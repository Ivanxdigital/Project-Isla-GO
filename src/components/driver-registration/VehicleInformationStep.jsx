import React from 'react';
import { useFormContext } from 'react-hook-form';

// Common van models in the Philippines with their seating capacities
const VAN_MODELS = [
  { make: 'Toyota', model: 'HiAce Commuter', capacity: 15 },
  { make: 'Toyota', model: 'HiAce GL Grandia', capacity: 12 },
  { make: 'Nissan', model: 'NV350 Urvan', capacity: 15 },
  { make: 'Hyundai', model: 'Grand Starex', capacity: 10 },
  { make: 'Foton', model: 'View Transvan', capacity: 15 },
  { make: 'Maxus', model: 'V80', capacity: 13 },
  { make: 'JAC', model: 'Sunray', capacity: 15 },
  { make: 'Mercedes-Benz', model: 'Sprinter', capacity: 15 },
];

export default function VehicleInformationStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - i);
  
  const selectedMake = watch('vehicleMake');
  const selectedModel = watch('vehicleModel');

  // Get unique makes from VAN_MODELS
  const uniqueMakes = [...new Set(VAN_MODELS.map(van => van.make))];

  // Get models for selected make
  const availableModels = VAN_MODELS.filter(van => van.make === selectedMake);

  // Update seating capacity when model changes
  React.useEffect(() => {
    if (selectedMake && selectedModel) {
      const selectedVan = VAN_MODELS.find(
        van => van.make === selectedMake && van.model === selectedModel
      );
      if (selectedVan) {
        setValue('seatingCapacity', selectedVan.capacity);
      }
    }
  }, [selectedMake, selectedModel, setValue]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="vehicleMake" className="block text-sm font-medium text-gray-700">
            Vehicle Make
          </label>
          <select
            id="vehicleMake"
            {...register("vehicleMake", {
              required: "Vehicle make is required",
            })}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.vehicleMake ? 'border-red-300' : 'border-gray-300'
            }`}
            onChange={(e) => {
              setValue('vehicleMake', e.target.value);
              setValue('vehicleModel', ''); // Reset model when make changes
              setValue('seatingCapacity', ''); // Reset capacity when make changes
            }}
          >
            <option value="">Select make</option>
            {uniqueMakes.map(make => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
          {errors.vehicleMake && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleMake.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">
            Vehicle Model
          </label>
          <select
            id="vehicleModel"
            {...register("vehicleModel", {
              required: "Vehicle model is required",
            })}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.vehicleModel ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={!selectedMake}
          >
            <option value="">Select model</option>
            {availableModels.map(van => (
              <option key={van.model} value={van.model}>
                {van.model} ({van.capacity} seats)
              </option>
            ))}
          </select>
          {errors.vehicleModel && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleModel.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="vehicleYear" className="block text-sm font-medium text-gray-700">
            Vehicle Year
          </label>
          <select
            id="vehicleYear"
            {...register("vehicleYear", {
              required: "Vehicle year is required",
            })}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.vehicleYear ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select year</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.vehicleYear && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleYear.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="vehicleColor" className="block text-sm font-medium text-gray-700">
            Vehicle Color
          </label>
          <input
            type="text"
            id="vehicleColor"
            {...register("vehicleColor", {
              required: "Vehicle color is required",
              minLength: { value: 2, message: "Vehicle color must be at least 2 characters" },
            })}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.vehicleColor ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Silver"
          />
          {errors.vehicleColor && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleColor.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">
            Plate Number
          </label>
          <input
            type="text"
            id="plateNumber"
            {...register("plateNumber", {
              required: "Plate number is required",
              pattern: {
                value: /^[A-Z0-9 -]+$/i,
                message: "Enter a valid plate number (letters, numbers, spaces, and hyphens only)",
              },
              minLength: { value: 5, message: "Plate number must be at least 5 characters" },
              maxLength: { value: 10, message: "Plate number cannot exceed 10 characters" },
            })}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.plateNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="ABC 1234"
          />
          {errors.plateNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.plateNumber.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter your vehicle's plate number exactly as it appears.
          </p>
        </div>

        <div>
          <label htmlFor="orCrNumber" className="block text-sm font-medium text-gray-700">
            OR/CR Number
          </label>
          <input
            type="text"
            id="orCrNumber"
            {...register("orCrNumber", {
              required: "OR/CR number is required",
              pattern: {
                value: /^[A-Z0-9-]+$/i,
                message: "Enter a valid OR/CR number (letters, numbers, and hyphens only)",
              },
              minLength: { value: 5, message: "OR/CR number must be at least 5 characters" },
            })}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.orCrNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="123456789"
          />
          {errors.orCrNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.orCrNumber.message}</p>
          )}
        </div>
      </div>

      {/* Hidden seating capacity field */}
      <input
        type="hidden"
        {...register("seatingCapacity")}
      />

      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Vehicle Requirements</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Vehicle must be registered under your name or with proper authorization</li>
                <li>Vehicle must not be more than 7 years old from current year</li>
                <li>Must have complete and valid registration documents</li>
                <li>Must be in good working condition</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}