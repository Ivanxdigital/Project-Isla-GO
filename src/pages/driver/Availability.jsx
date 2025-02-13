import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';

export default function DriverAvailability() {
  const { user } = useAuth();
  const { driverStatus } = useDriverAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState({});
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Sunday
  const [events, setEvents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Puerto Princesa');
  const [recurrenceRule, setRecurrenceRule] = useState(null);
  const [exceptionDates, setExceptionDates] = useState([]);

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
  }, [user, selectedDay, selectedLocation]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('driver_id', user.id)
        .eq('location', selectedLocation);

      if (error) throw error;

      const calendarEvents = data.map(slot => ({
        id: slot.id,
        title: `Available: ${slot.location}`,
        start: combineDateTime(slot.day_of_week, slot.time_slot),
        end: addHour(combineDateTime(slot.day_of_week, slot.time_slot)),
        backgroundColor: slot.is_available ? '#10B981' : '#EF4444',
        extendedProps: {
          location: slot.location,
          isAvailable: slot.is_available,
          recurrenceRule: slot.recurrence_rule,
          exceptionDates: slot.exception_dates
        },
        ...(slot.recurrence_rule && { rrule: slot.recurrence_rule })
      }));

      setEvents(calendarEvents);
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

  const handleDateSelect = async (selectInfo) => {
    const isRecurring = window.confirm('Would you like this availability to repeat weekly?');
    
    try {
      const event = {
        driver_id: user.id,
        day_of_week: selectInfo.start.getDay(),
        time_slot: selectInfo.start.toTimeString().slice(0, 5),
        location: selectedLocation,
        is_available: true,
        recurrence_rule: isRecurring ? 'FREQ=WEEKLY' : null,
        exception_dates: []
      };

      const { error } = await supabase
        .from('driver_availability')
        .insert([event]);

      if (error) throw error;

      toast.success('Availability slot added');
      await fetchAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
      toast.error('Failed to add availability slot');
    }
  };

  const handleEventClick = async (clickInfo) => {
    if (window.confirm('Would you like to remove this availability slot?')) {
      try {
        const { error } = await supabase
          .from('driver_availability')
          .delete()
          .eq('id', clickInfo.event.id);

        if (error) throw error;

        toast.success('Availability slot removed');
        await fetchAvailability();
      } catch (error) {
        console.error('Error removing availability:', error);
        toast.error('Failed to remove availability slot');
      }
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

      {/* Location Selector */}
      <div className="mb-6 flex space-x-4">
        {locations.map(location => (
          <button
            key={location}
            onClick={() => setSelectedLocation(location)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedLocation === location
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {location}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          eventContent={renderEventContent}
        />
      </div>
    </motion.div>
  );
}

// Helper functions
function combineDateTime(dayOfWeek, timeSlot) {
  const date = new Date();
  // Get the current day of week
  const currentDay = date.getDay();
  // Calculate days to add to get to the target day
  const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  // Set the date to the target day
  date.setDate(date.getDate() + daysToAdd);
  // Set the time
  const [hours, minutes] = timeSlot.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
}

function addHour(date) {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + 1);
  return newDate;
}

const renderEventContent = (eventInfo) => {
  return (
    <div className="flex items-center space-x-2">
      <span>{eventInfo.event.title}</span>
      {eventInfo.event.extendedProps.recurrenceRule && (
        <span className="text-xs text-gray-500">↻</span>
      )}
    </div>
  );
}; 