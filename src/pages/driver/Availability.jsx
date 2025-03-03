import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useDriverAuth } from '../../contexts/DriverAuthContext.jsx';
import { supabase } from '../../utils/supabase.ts';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ClockIcon, MapPinIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
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
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const calendarRef = useRef(null);

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

      // Create a structured availability object from the data
      const availObj = {};
      data.forEach(slot => {
        if (!availObj[slot.location]) {
          availObj[slot.location] = {};
        }
        // Use start_time as the key
        const timeKey = slot.start_time.substring(0, 5); // Format: "HH:MM"
        availObj[slot.location][timeKey] = slot.status === 'available';
      });
      
      setAvailability(availObj);

      const calendarEvents = data.map(slot => ({
        id: slot.id,
        title: `Available: ${slot.location}`,
        start: combineDateTime(slot.day_of_week, slot.start_time.substring(0, 5)),
        end: slot.end_time ? 
          combineDateTime(slot.day_of_week, slot.end_time.substring(0, 5)) : 
          addHour(combineDateTime(slot.day_of_week, slot.start_time.substring(0, 5))),
        backgroundColor: slot.status === 'available' ? '#10B981' : '#EF4444',
        borderColor: slot.status === 'available' ? '#059669' : '#DC2626',
        textColor: '#FFFFFF',
        extendedProps: {
          location: slot.location,
          isAvailable: slot.status === 'available',
          recurrenceRule: slot.recurrence_rule,
          exceptionDates: slot.exception_dates,
          dayOfWeek: slot.day_of_week,
          startTime: slot.start_time.substring(0, 5),
          endTime: slot.end_time ? slot.end_time.substring(0, 5) : null
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

      // Calculate end time (1 hour after start time)
      const [hours, minutes] = time.split(':');
      const endHour = parseInt(hours) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes}:00`;

      const { error } = await supabase
        .from('driver_availability')
        .upsert({
          driver_id: user.id,
          day_of_week: selectedDay,
          location,
          start_time: `${time}:00`, // Add seconds for proper time format
          end_time: endTime,
          status: newAvail[location][time] ? 'available' : 'unavailable',
          date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
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
      await fetchAvailability(); // Refresh the data
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
    const title = 'New Availability';
    const message = 'Would you like this availability to repeat weekly?';
    
    // Create a custom modal instead of using window.confirm
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
        <p class="text-gray-600 mb-4">${message}</p>
        <div class="flex flex-col space-y-2">
          <p class="text-sm text-gray-500">
            <span class="font-medium">Location:</span> ${selectedLocation}<br>
            <span class="font-medium">Date:</span> ${selectInfo.start.toLocaleDateString()}<br>
            <span class="font-medium">Time:</span> ${selectInfo.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(selectInfo.start.getTime() + 60*60*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <div class="mt-4 flex justify-end space-x-3">
          <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
            Cancel
          </button>
          <button id="no-repeat-btn" class="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
            One Time Only
          </button>
          <button id="repeat-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Repeat Weekly
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    return new Promise((resolve) => {
      document.getElementById('cancel-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
      
      document.getElementById('no-repeat-btn').addEventListener('click', async () => {
        document.body.removeChild(modal);
        await addAvailabilitySlot(selectInfo, false);
      });
      
      document.getElementById('repeat-btn').addEventListener('click', async () => {
        document.body.removeChild(modal);
        await addAvailabilitySlot(selectInfo, true);
      });
    });
  };
  
  const addAvailabilitySlot = async (selectInfo, isRecurring) => {
    try {
      // Format the time from the selection
      const startHour = selectInfo.start.getHours();
      const startMinute = selectInfo.start.getMinutes();
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      
      // Calculate end time (1 hour after start time)
      const endHour = startHour + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      
      const event = {
        driver_id: user.id,
        day_of_week: selectInfo.start.getDay(),
        start_time: startTime,
        end_time: endTime,
        location: selectedLocation,
        status: 'available',
        recurrence_rule: isRecurring ? 'FREQ=WEEKLY' : null,
        exception_dates: [],
        date: selectInfo.start.toISOString().split('T')[0] // Format: YYYY-MM-DD
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
    // Create a custom modal instead of using window.confirm
    const event = clickInfo.event;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Availability Details</h3>
        <div class="mb-4">
          <p class="text-sm text-gray-600">
            <span class="font-medium">Location:</span> ${event.extendedProps.location}<br>
            <span class="font-medium">Day:</span> ${daysOfWeek[event.extendedProps.dayOfWeek]}<br>
            <span class="font-medium">Time:</span> ${event.extendedProps.startTime} - ${event.extendedProps.endTime || addHourToTimeString(event.extendedProps.startTime)}<br>
            <span class="font-medium">Repeats:</span> ${event.extendedProps.recurrenceRule ? 'Weekly' : 'No'}
          </p>
        </div>
        <div class="mt-4 flex justify-end space-x-3">
          <button id="cancel-modal-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
            Cancel
          </button>
          <button id="delete-btn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            Remove Slot
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancel-modal-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    document.getElementById('delete-btn').addEventListener('click', async () => {
      document.body.removeChild(modal);
      
      try {
        const { error } = await supabase
          .from('driver_availability')
          .delete()
          .eq('id', event.id);

        if (error) throw error;

        toast.success('Availability slot removed');
        await fetchAvailability();
      } catch (error) {
        console.error('Error removing availability:', error);
        toast.error('Failed to remove availability slot');
      }
    });
  };

  const addHourToTimeString = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const newHour = (parseInt(hours) + 1) % 24;
    return `${newHour.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleViewChange = (view) => {
    setViewMode(view);
    if (view === 'calendar' && calendarRef.current) {
      // Force calendar to re-render
      const calendarApi = calendarRef.current.getApi();
      calendarApi.updateSize();
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
        <div className="flex justify-between items-start">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4"
            >
              Manage Your Availability
            </motion.h1>
            <p className="text-blue-100 text-sm sm:text-base">Set when you're available to drive</p>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
            aria-label="Help"
          >
            <InformationCircleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Help Section */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6"
          >
            <h3 className="font-medium text-blue-800 mb-2">How to set your availability:</h3>
            <ul className="list-disc pl-5 text-blue-700 space-y-1 text-sm">
              <li>Select a location from the buttons below</li>
              <li>Click and drag on the calendar to add a new availability slot</li>
              <li>Choose whether the slot repeats weekly or is a one-time slot</li>
              <li>Click on an existing slot to view details or remove it</li>
              <li>Toggle between calendar and list views using the buttons above the calendar</li>
            </ul>
            <button 
              onClick={() => setShowHelp(false)}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {locations.map(location => (
          <button
            key={location}
            onClick={() => setSelectedLocation(location)}
            className={`px-4 py-2 rounded-lg transition-all flex items-center ${
              selectedLocation === location
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPinIcon className="h-4 w-4 mr-1" />
            {location}
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewChange('calendar')}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Calendar View
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            List View
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
            Available
          </span>
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
            Unavailable
          </span>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-hidden">
          <div className="text-sm text-gray-500 mb-4 flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
            Click and drag on the calendar to add a new availability slot
          </div>
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              editable={false}
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
              allDaySlot={false}
              nowIndicator={true}
              slotDuration="01:00:00"
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }}
            />
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="font-medium text-lg mb-4">Your Availability Slots</h3>
          
          {events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No availability slots set for {selectedLocation}</p>
              <p className="text-sm text-gray-400 mt-1">Switch to calendar view to add slots</p>
            </div>
          ) : (
            <div className="divide-y">
              {events.map(event => (
                <div key={event.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        event.extendedProps.isAvailable ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className="font-medium">{daysOfWeek[event.extendedProps.dayOfWeek]}</span>
                    </div>
                    <div className="text-sm text-gray-600 ml-5 mt-1">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {event.extendedProps.startTime} - {event.extendedProps.endTime || addHourToTimeString(event.extendedProps.startTime)}
                      </div>
                      <div className="flex items-center mt-1">
                        <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {event.extendedProps.location}
                      </div>
                    </div>
                    {event.extendedProps.recurrenceRule && (
                      <span className="ml-5 text-xs text-blue-600 flex items-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Repeats weekly
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleEventClick({ event: { id: event.id, extendedProps: event.extendedProps } })}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    <div className="flex items-center space-x-1 p-1 text-xs">
      <span>{eventInfo.event.extendedProps.location}</span>
      {eventInfo.event.extendedProps.recurrenceRule && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
    </div>
  );
}; 