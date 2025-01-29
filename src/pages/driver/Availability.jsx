import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function DriverAvailability() {
  const { user } = useAuth();
  const { driverStatus } = useDriverAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState({});
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Sunday

  const locations = ['Puerto Princesa', 'El Nido', 'San Vicente'];
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate return availability based on departure time
  const getReturnTimeSlot = (departureTime, location) => {
    const [hours] = departureTime.split(':');
    const departureHour = parseInt(hours);
    
    // Estimated travel times in hours
    const travelTimes = {
      'El Nido': 5,
      'San Vicente': 4
    };

    const travelTime = travelTimes[location] || 0;
    const returnHour = departureHour + travelTime;

    if (returnHour <= 22) {
      return `${returnHour.toString().padStart(2, '0')}:00`;
    }
    return null;
  };

  useEffect(() => {
    fetchAvailability();
  }, [user, selectedDay]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('driver_id', user.id)
        .eq('day_of_week', selectedDay);

      if (error) throw error;

      // Convert array to object for easier manipulation
      const availObj = {};
      data.forEach(slot => {
        if (!availObj[slot.location]) {
          availObj[slot.location] = {};
        }
        availObj[slot.location][slot.time_slot] = slot.is_available;
      });

      setAvailability(availObj);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotToggle = async (location, time) => {
    try {
      setSaving(true);

      // First, check if driver exists
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (driverError || !driverData) {
        // Get driver application data to create driver record
        const { data: applicationData, error: applicationError } = await supabase
          .from('driver_applications')
          .select(`
            full_name,
            license_number,
            mobile_number,
            license_expiration,
            emergency_contact
          `)
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();

        if (applicationError || !applicationData) {
          throw new Error('No approved driver application found');
        }

        // Create driver record using application data with all required fields
        const { error: createError } = await supabase
          .from('drivers')
          .insert({
            id: user.id,
            name: applicationData.full_name,
            license_number: applicationData.license_number,
            contact_number: applicationData.mobile_number,
            emergency_contact: applicationData.emergency_contact || null,
            license_expiry: applicationData.license_expiration,
            status: 'active',
            documents_verified: true,
            notes: 'Created from availability page'
          });

        if (createError) {
          console.error('Driver creation error:', createError);
          throw new Error('Failed to create driver record');
        }
      }

      // Now update availability
      const newAvail = {
        ...availability,
        [location]: {
          ...(availability[location] || {}),
          [time]: !(availability[location]?.[time])
        }
      };

      const { error } = await supabase
        .from('driver_availability')
        .upsert({
          driver_id: user.id,
          day_of_week: selectedDay,
          location,
          time_slot: time,
          is_available: newAvail[location][time]
        });

      if (error) throw error;

      setAvailability(newAvail);

      // If setting availability for departure, suggest return slot
      if (newAvail[location][time]) {
        const returnTime = getReturnTimeSlot(time, location);
        if (returnTime) {
          const shouldAddReturn = window.confirm(
            `Would you like to add a return trip from ${location} at ${returnTime}?`
          );

          if (shouldAddReturn) {
            await handleTimeSlotToggle(
              location === 'Puerto Princesa' ? 'El Nido' : 'Puerto Princesa',
              returnTime
            );
          }
        }
      }

      toast.success('Availability updated');
    } catch (error) {
      console.error('Error updating availability:', error);
      if (error.message.includes('driver_status')) {
        toast.error('Invalid driver status. Please contact support.');
      } else if (error.message === 'No approved driver application found') {
        toast.error('Please complete your driver application first.');
      } else {
        toast.error(error.message || 'Failed to update availability');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-4 sm:p-8 mb-6 sm:mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4"
        >
          Manage Your Availability
        </motion.h1>
        <p className="text-blue-100 text-sm sm:text-base">Select your available time slots for each location</p>
      </div>

      {/* Day selector - Made scrollable on mobile */}
      <div className="mb-6 sm:mb-8 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center mb-4">
          <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Select Day</h2>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {daysOfWeek.map((day, index) => (
            <motion.button
              key={day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                selectedDay === index
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {day}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time slots grid - Single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        <AnimatePresence>
          {locations.map((location, idx) => (
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 border-b">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{location}</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-1 sm:space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                  {timeSlots.map(time => (
                    <motion.label
                      key={`${location}-${time}`}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg cursor-pointer border border-transparent hover:border-blue-100 transition-all duration-200"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={!!availability[location]?.[time]}
                          onChange={() => handleTimeSlotToggle(location, time)}
                          disabled={saving}
                          className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                        />
                        {saving && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-gray-200 rounded animate-pulse"
                          />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{time}</span>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 