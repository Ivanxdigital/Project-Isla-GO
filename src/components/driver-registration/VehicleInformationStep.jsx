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

  // Common Philippine van models
  const commonVanModels = [
    'Toyota Hiace',
    'Nissan NV350 Urvan',
    'Hyundai Grand Starex',
    'Foton View Traveller',
    'JAC Sunray',
    'Maxus V80'
  ];

  // Vehicle year validation
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10; // Vehicles should not be older than 10 years
  const maxYear = currentYear + 1; // Allow registration of next year's models

  const selectedModel = watch('vehicleModel');
  
  // Default seating capacity based on model
  const getDefaultSeatingCapacity = (model) => {
    switch (model) {
      case 'Toyota Hiace':
      case 'Nissan NV350 Urvan':
        return '15';
      case 'Hyundai Grand Starex':
        return '12';
      case 'Foton View Traveller':
        return '16';
      case 'JAC Sunray':
        return '15';
      case 'Maxus V80':
        return '13';
      default:
        return '';
    }
  };

  // Get unique makes from VAN_MODELS
  const uniqueMakes = [...new Set(VAN_MODELS.map(van => van.make))];

  // Get models for selected make
  const availableModels = VAN_MODELS.filter(van => van.make === uniqueMakes[0]);

  // Update seating capacity when model changes
  React.useEffect(() => {
    if (uniqueMakes[0] && selectedModel) {
      const selectedVan = VAN_MODELS.find(
        van => van.make === uniqueMakes[0] && van.model === selectedModel
      );
      if (selectedVan) {
        setValue('seatingCapacity', selectedVan.capacity);
      }
    }
  }, [uniqueMakes, selectedModel, setValue]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Vehicle Information</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle Make
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('vehicleMake', {
              required: 'Vehicle make is required'
            })}
            placeholder="e.g., Toyota, Nissan, Hyundai"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.vehicleMake && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleMake.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle Model
            <span className="text-red-500">*</span>
          </label>
          <select
            {...register('vehicleModel', {
              required: 'Vehicle model is required'
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select vehicle model</option>
            {commonVanModels.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          {errors.vehicleModel && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleModel.message}</p>
          )}
        </div>

        {selectedModel === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Other Model
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('otherModel', {
                required: 'Please specify the vehicle model'
              })}
              placeholder="Enter vehicle model"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.otherModel && (
              <p className="mt-1 text-sm text-red-600">{errors.otherModel.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle Year
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('vehicleYear', {
              required: 'Vehicle year is required',
              min: {
                value: minYear,
                message: `Vehicle must not be older than ${currentYear - minYear} years`
              },
              max: {
                value: maxYear,
                message: 'Invalid vehicle year'
              }
            })}
            min={minYear}
            max={maxYear}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.vehicleYear && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleYear.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Vehicle Color
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('vehicleColor', {
              required: 'Vehicle color is required'
            })}
            placeholder="e.g., White, Silver, Black"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.vehicleColor && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleColor.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Plate Number
            <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-1">(e.g., ABC 1234)</span>
          </label>
          <input
            type="text"
            {...register('plateNumber', {
              required: 'Plate number is required',
              pattern: {
                value: /^[A-Z]{3} \d{4}$/,
                message: 'Please enter a valid plate number format (e.g., ABC 1234)'
              }
            })}
            placeholder="ABC 1234"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.plateNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.plateNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            OR/CR Number
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('orCrNumber', {
              required: 'OR/CR number is required'
            })}
            placeholder="Enter OR/CR number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.orCrNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.orCrNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Seating Capacity
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register('seatingCapacity', {
              required: 'Seating capacity is required',
              min: {
                value: 10,
                message: 'Minimum seating capacity is 10'
              },
              max: {
                value: 16,
                message: 'Maximum seating capacity is 16'
              }
            })}
            defaultValue={selectedModel ? getDefaultSeatingCapacity(selectedModel) : ''}
            min="10"
            max="16"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.seatingCapacity && (
            <p className="mt-1 text-sm text-red-600">{errors.seatingCapacity.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Vehicle must have a minimum of 10 and maximum of 16 seats
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Make sure all vehicle information matches your OR/CR. You will need to provide clear photos of your vehicle and registration documents in the next steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}