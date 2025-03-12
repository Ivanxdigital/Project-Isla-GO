import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase.ts';
import { toast } from 'react-hot-toast';

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

export default function AddVehicleModal({ isOpen, onClose, onVehicleAdded }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plate_number: '',
    vin_number: '',
    registration_number: '',
    registration_expiry: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    seating_capacity: 15,
    status: 'active',
    fuel_type: 'diesel',
    vehicle_type: 'van'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusOptions, setStatusOptions] = useState(['active', 'maintenance', 'out_of_service', 'reserved']);

  // Get current year for validation
  const currentYear = new Date().getFullYear();
  
  // Check if vehicle_status is an enum type
  useEffect(() => {
    const checkVehicleStatusType = async () => {
      try {
        // Try to get the vehicle_status enum values
        const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'vehicle_status' });
        
        if (!error && data && data.length > 0) {
          setStatusOptions(data);
        }
      } catch (error) {
        console.error('Error checking vehicle_status type:', error);
        // Keep default status options if there's an error
      }
    };
    
    checkVehicleStatusType();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill seating capacity based on make and model selection
    if (name === 'make' || name === 'model') {
      const selectedModel = VAN_MODELS.find(
        van => van.make === (name === 'make' ? value : formData.make) && 
               van.model === (name === 'model' ? value : formData.model)
      );
      
      if (selectedModel) {
        setFormData(prev => ({ ...prev, seating_capacity: selectedModel.capacity }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.make) newErrors.make = 'Make is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (formData.year < 2000 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 2000 and ${currentYear + 1}`;
    }
    if (!formData.plate_number) newErrors.plate_number = 'Plate number is required';
    if (!formData.seating_capacity) newErrors.seating_capacity = 'Seating capacity is required';
    if (formData.seating_capacity < 1 || formData.seating_capacity > 20) {
      newErrors.seating_capacity = 'Seating capacity must be between 1 and 20';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Format dates properly
      const formattedData = {
        ...formData,
        year: parseInt(formData.year),
        seating_capacity: parseInt(formData.seating_capacity),
        registration_expiry: formData.registration_expiry || null,
        insurance_expiry: formData.insurance_expiry || null
      };
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([formattedData])
        .select();
      
      if (error) throw error;
      
      toast.success('Vehicle added successfully');
      onVehicleAdded(data[0]);
      onClose();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Get unique makes from VAN_MODELS
  const uniqueMakes = [...new Set(VAN_MODELS.map(van => van.make))];
  
  // Get models for selected make
  const availableModels = VAN_MODELS.filter(van => van.make === formData.make);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add New Vehicle
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                          {/* Vehicle Make */}
                          <div>
                            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                              Make <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="make"
                              name="make"
                              value={formData.make}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Select Make</option>
                              {uniqueMakes.map(make => (
                                <option key={make} value={make}>{make}</option>
                              ))}
                              <option value="Other">Other</option>
                            </select>
                            {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
                          </div>

                          {/* Vehicle Model */}
                          <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                              Model <span className="text-red-500">*</span>
                            </label>
                            {formData.make && formData.make !== 'Other' ? (
                              <select
                                id="model"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              >
                                <option value="">Select Model</option>
                                {availableModels.map(van => (
                                  <option key={van.model} value={van.model}>{van.model}</option>
                                ))}
                                <option value="Other">Other</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                id="model"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Enter model"
                              />
                            )}
                            {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
                          </div>

                          {/* Year */}
                          <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                              Year <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              id="year"
                              name="year"
                              value={formData.year}
                              onChange={handleChange}
                              min="2000"
                              max={currentYear + 1}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
                          </div>

                          {/* Color */}
                          <div>
                            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                              Color
                            </label>
                            <input
                              type="text"
                              id="color"
                              name="color"
                              value={formData.color}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Plate Number */}
                          <div>
                            <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700">
                              Plate Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="plate_number"
                              name="plate_number"
                              value={formData.plate_number}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.plate_number && <p className="mt-1 text-sm text-red-600">{errors.plate_number}</p>}
                          </div>

                          {/* VIN Number */}
                          <div>
                            <label htmlFor="vin_number" className="block text-sm font-medium text-gray-700">
                              VIN Number
                            </label>
                            <input
                              type="text"
                              id="vin_number"
                              name="vin_number"
                              value={formData.vin_number}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Registration Number */}
                          <div>
                            <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                              Registration Number
                            </label>
                            <input
                              type="text"
                              id="registration_number"
                              name="registration_number"
                              value={formData.registration_number}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Registration Expiry */}
                          <div>
                            <label htmlFor="registration_expiry" className="block text-sm font-medium text-gray-700">
                              Registration Expiry
                            </label>
                            <input
                              type="date"
                              id="registration_expiry"
                              name="registration_expiry"
                              value={formData.registration_expiry}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Insurance Provider */}
                          <div>
                            <label htmlFor="insurance_provider" className="block text-sm font-medium text-gray-700">
                              Insurance Provider
                            </label>
                            <input
                              type="text"
                              id="insurance_provider"
                              name="insurance_provider"
                              value={formData.insurance_provider}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Insurance Policy Number */}
                          <div>
                            <label htmlFor="insurance_policy_number" className="block text-sm font-medium text-gray-700">
                              Insurance Policy Number
                            </label>
                            <input
                              type="text"
                              id="insurance_policy_number"
                              name="insurance_policy_number"
                              value={formData.insurance_policy_number}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Insurance Expiry */}
                          <div>
                            <label htmlFor="insurance_expiry" className="block text-sm font-medium text-gray-700">
                              Insurance Expiry
                            </label>
                            <input
                              type="date"
                              id="insurance_expiry"
                              name="insurance_expiry"
                              value={formData.insurance_expiry}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Seating Capacity */}
                          <div>
                            <label htmlFor="seating_capacity" className="block text-sm font-medium text-gray-700">
                              Seating Capacity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              id="seating_capacity"
                              name="seating_capacity"
                              value={formData.seating_capacity}
                              onChange={handleChange}
                              min="1"
                              max="20"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.seating_capacity && <p className="mt-1 text-sm text-red-600">{errors.seating_capacity}</p>}
                          </div>

                          {/* Status */}
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                              Status <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>

                          {/* Fuel Type */}
                          <div>
                            <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                              Fuel Type
                            </label>
                            <select
                              id="fuel_type"
                              name="fuel_type"
                              value={formData.fuel_type}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="diesel">Diesel</option>
                              <option value="gasoline">Gasoline</option>
                              <option value="electric">Electric</option>
                              <option value="hybrid">Hybrid</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 disabled:opacity-50"
                          >
                            {loading ? 'Adding...' : 'Add Vehicle'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 