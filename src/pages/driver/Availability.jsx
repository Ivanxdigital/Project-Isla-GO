import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useDriverAuth } from '../../contexts/DriverAuthContext.jsx';
import { supabase } from '../../utils/supabase.ts';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  ListBulletIcon,
  MapPinIcon,
  UserIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import listPlugin from '@fullcalendar/list';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { Link } from 'react-router-dom';

// Define calendar styles
const calendarStyles = `
  /* Calendar container */
  .fc {
    --fc-border-color: #e2e8f0;
    --fc-button-bg-color: #3b82f6;
    --fc-button-border-color: #3b82f6;
    --fc-button-hover-bg-color: #2563eb;
    --fc-button-hover-border-color: #2563eb;
    --fc-button-active-bg-color: #1d4ed8;
    --fc-button-active-border-color: #1d4ed8;
    --fc-event-bg-color: #10b981;
    --fc-event-border-color: #059669;
    --fc-event-text-color: #fff;
    --fc-event-selected-overlay-color: rgba(0, 0, 0, 0.25);
    font-family: inherit;
    font-size: 0.875rem;
  }

  /* Toolbar and buttons */
  .fc .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .fc .fc-button-primary {
    background-color: var(--fc-button-bg-color);
    border-color: var(--fc-button-border-color);
    font-weight: 500;
  }

  .fc .fc-button-primary:hover {
    background-color: var(--fc-button-hover-bg-color);
    border-color: var(--fc-button-hover-border-color);
  }

  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: var(--fc-button-active-bg-color);
    border-color: var(--fc-button-active-border-color);
  }

  /* Time grid */
  .fc .fc-timegrid-slot {
    height: 3rem;
    border-bottom: 1px solid var(--fc-border-color);
    background-color: #f3f4f6;
  }

  /* Highlight specific time slots from BookingForm */
  .fc .fc-timegrid-slot[data-time="05:00:00"],
  .fc .fc-timegrid-slot[data-time="07:30:00"],
  .fc .fc-timegrid-slot[data-time="10:30:00"],
  .fc .fc-timegrid-slot[data-time="13:30:00"],
  .fc .fc-timegrid-slot[data-time="15:30:00"],
  .fc .fc-timegrid-slot[data-time="17:30:00"],
  .fc .fc-timegrid-slot[data-time="19:30:00"] {
    background-color: white;
    border-top: 2px solid #3b82f6;
    border-bottom: 2px solid #3b82f6;
    height: 3.5rem;
  }

  /* Highlight slot labels for bookable times */
  .fc-timegrid-slot-label-frame {
    font-weight: normal;
    color: #6b7280;
  }

  .fc-timegrid-slot-label[data-time="05:00:00"] .fc-timegrid-slot-label-frame,
  .fc-timegrid-slot-label[data-time="07:00:00"] .fc-timegrid-slot-label-frame,
  .fc-timegrid-slot-label[data-time="10:00:00"] .fc-timegrid-slot-label-frame,
  .fc-timegrid-slot-label[data-time="13:00:00"] .fc-timegrid-slot-label-frame,
  .fc-timegrid-slot-label[data-time="15:00:00"] .fc-timegrid-slot-label-frame,
  .fc-timegrid-slot-label[data-time="17:00:00"] .fc-timegrid-slot-label-frame,
  .fc-timegrid-slot-label[data-time="19:00:00"] .fc-timegrid-slot-label-frame {
    font-weight: bold;
    color: #1e40af;
  }

  .fc .fc-timegrid-col.fc-day-today {
    background-color: rgba(219, 234, 254, 0.3);
  }

  .fc .fc-timegrid-col-events {
    margin: 0 2px 0 2px;
  }

  .fc .fc-timegrid-now-indicator-line {
    border-color: #ef4444;
  }

  .fc .fc-timegrid-now-indicator-arrow {
    border-color: #ef4444;
    border-width: 5px;
  }

  /* Last time slot */
  .fc .fc-timegrid-slot:last-child {
    border-bottom: 1px solid var(--fc-border-color);
    background-color: white;
    padding-bottom: 16px;
  }

  /* Time grid body */
  .fc .fc-timegrid-body {
    padding-bottom: 16px;
  }

  /* Events */
  .fc-event {
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 4px;
  }

  .fc-event.available-event {
    background-color: #10b981;
    border-color: #059669;
  }

  .fc-event.unavailable-event {
    background-color: #ef4444;
    border-color: #dc2626;
  }

  /* List view */
  .fc-list-event:hover td {
    background-color: rgba(59, 130, 246, 0.1);
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .fc .fc-toolbar {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .fc .fc-toolbar-title {
      font-size: 1rem;
    }
    
    .fc .fc-button {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  }
`;

export default function DriverAvailability() {
  const { user } = useAuth();
  const { driverStatus } = useDriverAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState({});
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Sunday
  const [events, setEvents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [recurrenceRule, setRecurrenceRule] = useState(null);
  const [exceptionDates, setExceptionDates] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [calendarLoadFailed, setCalendarLoadFailed] = useState(false);
  const calendarRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

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
    if (user) {
      fetchAvailability();
    } else {
      setLoading(false);
    }
  }, [user, selectedDay, selectedLocation]);

  // Auto-switch to list view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'calendar') {
      handleViewChange('list');
    }
  }, [isMobile]);

  // Initialize calendar when component mounts
  useEffect(() => {
    if (viewMode === 'calendar' && calendarRef.current) {
      console.log('Initializing calendar on mount');
      setCalendarLoading(true);
      setCalendarLoadFailed(false);
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        try {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.updateSize();
          calendarApi.changeView('timeGridWeek');
          console.log('Calendar initialized successfully');
        } catch (error) {
          console.error('Error initializing calendar:', error);
          setCalendarLoadFailed(true);
        } finally {
          setCalendarLoading(false);
        }
      }, 500); // Increased timeout for better reliability
    }
  }, [viewMode]); // Added viewMode as dependency to re-initialize when view changes
  
  // Effect to update calendar when events change
  useEffect(() => {
    if (viewMode === 'calendar' && calendarRef.current && events.length > 0) {
      console.log('Updating calendar with events:', events.length);
      try {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      } catch (error) {
        console.error('Error updating calendar with events:', error);
      }
    }
  }, [events, viewMode]);

  // Add effect to force calendar re-render when selectedLocation changes
  useEffect(() => {
    if (viewMode === 'calendar' && calendarRef.current && selectedLocation) {
      console.log('Location changed, updating calendar');
      setCalendarLoading(true);
      setTimeout(() => {
        try {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.updateSize();
          console.log('Calendar updated after location change');
        } catch (error) {
          console.error('Error updating calendar after location change:', error);
        } finally {
          setCalendarLoading(false);
        }
      }, 300);
    }
  }, [selectedLocation, viewMode]);

  // Effect to ensure calendar loads properly on initial render
  useEffect(() => {
    // Only run this once when the component mounts
    const initialLoad = () => {
      if (viewMode === 'calendar' && selectedLocation) {
        console.log('Initial calendar load');
        setCalendarLoading(true);
        setCalendarLoadFailed(false);
        
        // Give the DOM time to fully render
        setTimeout(() => {
          if (calendarRef.current) {
            try {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.updateSize();
              console.log('Initial calendar load successful');
            } catch (error) {
              console.error('Error during initial calendar load:', error);
              setCalendarLoadFailed(true);
            } finally {
              setCalendarLoading(false);
            }
          }
        }, 1000); // Longer timeout for initial load
      }
    };
    
    // Run on component mount
    initialLoad();
    
    // Also set up a backup timer in case the calendar is still loading after 5 seconds
    const backupTimer = setTimeout(() => {
      if (calendarLoading) {
        console.log('Backup timer triggered - calendar still loading');
        setCalendarLoading(false);
        setCalendarLoadFailed(true);
      }
    }, 5000);
    
    // Clean up
    return () => clearTimeout(backupTimer);
  }, []); // Empty dependency array means this runs once on mount

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('driver_id', user.id);
        
      if (error) throw error;
      
      // Transform the data for FullCalendar
      const transformedEvents = data.map(slot => {
        const isAvailable = slot.status === 'available';
        const startDate = new Date(slot.date);
        startDate.setHours(parseInt(slot.start_time.split(':')[0]));
        startDate.setMinutes(parseInt(slot.start_time.split(':')[1]));
        
        const endDate = new Date(slot.date);
        endDate.setHours(parseInt(slot.end_time.split(':')[0]));
        endDate.setMinutes(parseInt(slot.end_time.split(':')[1]));
        
        return {
          id: slot.id,
          title: `${slot.location} (${isAvailable ? 'Available' : 'Unavailable'})`,
          start: startDate,
          end: endDate,
          className: isAvailable ? 'available' : 'unavailable',
          extendedProps: {
            location: slot.location,
            status: slot.status,
            startTime: slot.start_time.substring(0, 5),
            endTime: slot.end_time.substring(0, 5),
            recurrenceRule: slot.recurrence_rule,
            isAvailable: isAvailable
          },
          ...(slot.recurrence_rule && {
            rrule: {
              freq: 'weekly',
              dtstart: startDate,
              until: new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from start
            }
          })
        };
      });
      
      setEvents(transformedEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
      setLoading(false);
    }
  };

  const handleTimeSlotToggle = async (location, time) => {
    try {
      // Check if user is logged in
      if (!user) {
        toast.error('Please log in to update your availability');
        return;
      }
      
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
    if (!selectedLocation) {
      toast.error('Please select a location first');
      return;
    }

    // Get the selected time
    const startHour = selectInfo.start.getHours();
    const startMinutes = selectInfo.start.getMinutes();
    const timeString = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    
    // Match the BookingForm time slots
    const allowedTimeSlots = ['05:00', '07:30', '10:30', '13:30', '15:30', '17:30', '19:30'];
    
    // Check if the selected time is in our allowed time slots
    if (!allowedTimeSlots.includes(timeString)) {
      toast.error('Please select one of the available time slots: 5:00 AM, 7:30 AM, 10:30 AM, 1:30 PM, 3:30 PM, 5:30 PM, or 7:30 PM');
      return;
    }

    // Continue with the existing logic
    setShowAddModal(true);
    setSelectedTimeSlot({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
  };

  const handleEventClick = async (clickInfo) => {
    // Create a custom modal instead of using window.confirm
    const event = clickInfo.event;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <div className="bg-${event.extendedProps.isAvailable ? 'green' : 'red'}-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-${event.extendedProps.isAvailable ? 'green' : 'red'}-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">Availability Details</h3>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-md mb-4">
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="font-medium">${event.extendedProps.location}</span>
          </div>
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="font-medium">${daysOfWeek[event.extendedProps.dayOfWeek]}</span>
          </div>
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">${event.extendedProps.startTime} - ${event.extendedProps.endTime || addHourToTimeString(event.extendedProps.startTime)}</span>
          </div>
          ${event.extendedProps.recurrenceRule ? `
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="font-medium">Repeats weekly</span>
          </div>
          ` : ''}
        </div>
        
        <div class="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button id="cancel-modal-btn" class="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-base">
            Close
          </button>
          <button id="delete-btn" class="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-base flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
    console.log(`Changing view to: ${view}`);
    setViewMode(view);
    
    if (view === 'calendar') {
      setCalendarLoading(true);
      setCalendarLoadFailed(false);
    }
    
    // Use setTimeout to ensure the DOM has updated before manipulating the calendar
    setTimeout(() => {
      if (view === 'calendar' && calendarRef.current) {
        console.log('Updating calendar in handleViewChange');
        try {
          // Force calendar to re-render and update its size
          const calendarApi = calendarRef.current.getApi();
          
          // First destroy and re-render for a clean slate
          try {
            calendarApi.destroy();
            setTimeout(() => {
              if (calendarRef.current) {
                const newApi = calendarRef.current.getApi();
                newApi.render();
                newApi.updateSize();
                
                // Switch to timeGridWeek view to ensure the calendar grid is displayed
                newApi.changeView('timeGridWeek');
                console.log('Calendar view updated successfully');
                setCalendarLoadFailed(false);
              }
            }, 200);
          } catch (innerError) {
            console.error('Error during calendar re-render:', innerError);
            // Fallback to just updating size if destroy/render fails
            calendarApi.updateSize();
            calendarApi.changeView('timeGridWeek');
          }
        } catch (error) {
          console.error('Error updating calendar view:', error);
          toast.error('There was an issue loading the calendar. Please try again.');
          setCalendarLoadFailed(true);
        } finally {
          setCalendarLoading(false);
        }
      }
    }, 300);
  };

  // Add the modal component for adding availability
  const AddAvailabilityModal = () => {
    if (!selectedTimeSlot) return null;

    const startTime = selectedTimeSlot.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const endTime = new Date(selectedTimeSlot.start.getTime() + 60*60*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const handleAddAvailability = async (recurring) => {
      try {
        // Format the time from the selection
        const startHour = selectedTimeSlot.start.getHours();
        const startMinute = selectedTimeSlot.start.getMinutes();
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
        
        // Calculate end time (1 hour after start time)
        const endHour = startHour + 1;
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
        
        const event = {
          driver_id: user.id,
          day_of_week: selectedTimeSlot.start.getDay(),
          start_time: startTime,
          end_time: endTime,
          location: selectedLocation,
          status: 'available',
          recurrence_rule: recurring ? 'FREQ=WEEKLY' : null,
          exception_dates: [],
          date: selectedTimeSlot.start.toISOString().split('T')[0] // Format: YYYY-MM-DD
        };

        const { error } = await supabase
          .from('driver_availability')
          .insert([event]);

        if (error) throw error;

        toast.success('Availability slot added');
        setShowAddModal(false);
        await fetchAvailability();
      } catch (error) {
        console.error('Error adding availability:', error);
        toast.error('Failed to add availability slot');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Add Availability Slot</h3>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <div className="flex items-center mb-2">
              <MapPinIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">{selectedLocation}</span>
            </div>
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">
                {selectedTimeSlot.start.toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'})}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">{startTime} - {endTime}</span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-5">Would you like this availability to repeat weekly?</p>
          
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button 
              onClick={() => setShowAddModal(false)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-base"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleAddAvailability(false)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-base"
            >
              One Time Only
            </button>
            <button 
              onClick={() => handleAddAvailability(true)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-base"
            >
              Repeat Weekly
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleRetryCalendarLoad = () => {
    console.log('Retrying calendar load');
    setCalendarLoadFailed(false);
    setCalendarLoading(true);
    
    // Force a complete re-render of the calendar
    setTimeout(() => {
      if (calendarRef.current) {
        try {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.destroy();
          
          // Wait a bit and then re-initialize
          setTimeout(() => {
            if (calendarRef.current) {
              const newCalendarApi = calendarRef.current.getApi();
              newCalendarApi.render();
              newCalendarApi.updateSize();
              console.log('Calendar re-initialized successfully');
              setCalendarLoadFailed(false);
            }
          }, 200);
        } catch (error) {
          console.error('Error during calendar retry:', error);
          setCalendarLoadFailed(true);
        } finally {
          setCalendarLoading(false);
        }
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show login message if user is not logged in
  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <UserIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to manage your availability as a driver.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Sign In
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      {/* Add global styles for FullCalendar */}
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      
      {/* Add Availability Modal */}
      {showAddModal && <AddAvailabilityModal />}
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-4 sm:p-8 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2"
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
              <li className="font-medium">On mobile, list view is recommended for easier management</li>
            </ul>
            <button 
              onClick={() => setShowHelp(false)}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium p-2"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Selector */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {locations.map(location => (
          <button
            key={location}
            onClick={() => setSelectedLocation(location)}
            className={`px-3 py-3 sm:px-4 sm:py-2 rounded-lg transition-all flex items-center justify-center sm:justify-start ${
              selectedLocation === location
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="text-sm sm:text-base">{location}</span>
          </button>
        ))}
      </div>

      {/* Selected Location Indicator */}
      {selectedLocation && (
        <div className="mb-4 bg-blue-50 p-3 rounded-md flex items-center">
          <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">
            Selected Location: {selectedLocation}
          </span>
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex w-full sm:w-auto">
          <button
            onClick={() => handleViewChange('calendar')}
            className={`flex-1 sm:flex-initial px-4 py-3 sm:py-2 rounded-l-lg text-base flex items-center justify-center ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Calendar
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className={`flex-1 sm:flex-initial px-4 py-3 sm:py-2 rounded-r-lg text-base flex items-center justify-center ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ListBulletIcon className="h-5 w-5 mr-2" />
            List
          </button>
        </div>
        
        <div className="flex items-center justify-center sm:justify-start space-x-4 text-sm">
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Available
          </span>
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span>
            Unavailable
          </span>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-hidden mb-8">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-md">
            <div className="flex items-start">
              <InformationCircleIcon className="h-6 w-6 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">How to add availability:</p>
                <ol className="text-sm text-blue-600 list-decimal pl-5 space-y-1">
                  <li><strong>First, select a location</strong> from the buttons above</li>
                  <li>{isMobile ? 'Tap and hold on a time slot' : 'Click and drag on a time slot'} in the calendar</li>
                  <li>Choose if it repeats weekly or is one-time only</li>
                  <li>Your availability will appear in green</li>
                </ol>
                <p className="text-sm text-blue-600 mt-2 font-medium">Available time slots: 5:00 AM, 7:30 AM, 10:30 AM, 1:30 PM, 3:30 PM, 5:30 PM, and 7:30 PM</p>
                <p className="text-sm text-blue-600 italic">(These match our standard booking times)</p>
              </div>
            </div>
          </div>
          
          {/* Add Availability Button for Calendar View */}
          {selectedLocation && (
            <div className="mb-4 flex justify-center sm:justify-start">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                <div className="mr-3 bg-green-100 rounded-full p-2">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-green-800 font-medium">Ready to add availability for {selectedLocation}</p>
                  <p className="text-sm text-green-600">
                    {isMobile ? 'Tap and hold' : 'Click and drag'} on a time slot in the calendar below
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div 
            className="calendar-container bg-white rounded-lg overflow-auto" 
            style={{ 
              height: isMobile ? '650px' : '750px',
              border: '1px solid #e2e8f0',
              padding: '8px 8px 24px 8px',
              position: 'relative',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {calendarLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-blue-600 font-medium">Loading calendar...</p>
                </div>
              </div>
            )}
            
            {calendarLoadFailed && (
              <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="bg-red-100 p-2 rounded-full mb-4">
                    <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Calendar Failed to Load</h3>
                  <p className="text-gray-600 mb-4 max-w-md">
                    There was a problem loading the calendar. This could be due to a temporary issue.
                  </p>
                  <button
                    onClick={handleRetryCalendarLoad}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Retry Loading Calendar
                  </button>
                </div>
              </div>
            )}
            
            {!selectedLocation ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MapPinIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Location First</h3>
                <p className="text-gray-500 max-w-md">
                  Please select a location from the buttons above to start adding your availability.
                </p>
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                key={`calendar-${selectedLocation}-${viewMode}`}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin, listPlugin]}
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
                slotMinTime="05:00:00"
                slotMaxTime="20:30:00"
                eventContent={renderEventContent}
                allDaySlot={false}
                nowIndicator={true}
                slotDuration="00:30:00"
                slotLabelInterval="01:00:00"
                snapDuration="00:30:00"
                slotLabelFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }}
                views={{
                  timeGridWeek: {
                    titleFormat: { month: 'long', day: 'numeric' },
                    dayHeaderFormat: { weekday: isMobile ? 'short' : 'long' }
                  },
                  timeGridDay: {
                    titleFormat: { month: 'long', day: 'numeric', weekday: 'long' }
                  }
                }}
                footerToolbar={false}
                handleWindowResize={true}
                windowResizeDelay={100}
              />
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          {/* Info message for list view */}
          {isMobile && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-md">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700">
                    To add availability, tap the calendar button <span className="font-medium">at the bottom left</span> of the screen.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Your Availability Slots</h2>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            {events.length > 0 && (
              <div className="text-sm text-gray-500 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-1 text-blue-500" />
                Tap a slot to view details
              </div>
            )}
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-2">No availability slots set for {selectedLocation}</p>
              <p className="text-sm text-gray-500 mb-6">
                {isMobile ? 
                  'Tap the calendar button at the bottom left to add availability' : 
                  'Switch to calendar view to add availability slots'}
              </p>
              <button
                onClick={() => handleViewChange('calendar')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Switch to Calendar View
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {events.map(event => (
                <div 
                  key={event.id} 
                  className="py-4 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 cursor-pointer transition-colors"
                  onClick={() => handleEventClick({ event: { id: event.id, extendedProps: event.extendedProps } })}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                        event.extendedProps.isAvailable ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className="font-medium">{daysOfWeek[event.extendedProps.dayOfWeek]}</span>
                      {event.extendedProps.recurrenceRule && (
                        <span className="ml-2 text-xs text-blue-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Weekly
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 ml-6 mt-2">
                      <div className="flex items-center mb-1">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {event.extendedProps.startTime} - {event.extendedProps.endTime || addHourToTimeString(event.extendedProps.startTime)}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {event.extendedProps.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick({ event: { id: event.id, extendedProps: event.extendedProps } });
                      }}
                      className="p-2 hover:text-red-500 transition-colors"
                      aria-label="View or remove availability slot"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Add Button (Fixed) - Always show in list view */}
      {isMobile && viewMode === 'list' && (
        <div className="fixed bottom-6 left-6">
          <div className="relative group">
            <button 
              onClick={() => handleViewChange('calendar')}
              className="bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
              aria-label="Switch to calendar to add availability"
            >
              <CalendarIcon className="h-6 w-6" />
            </button>
            <div className="absolute -top-10 left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200">
              Add Availability
            </div>
          </div>
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
  const isAvailable = eventInfo.event.extendedProps.status === 'available';
  
  return (
    <div className={`flex items-center p-1 text-xs ${isAvailable ? 'text-white' : 'text-white'}`}>
      <div className="flex-1 overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.extendedProps.location}</div>
        <div className="text-xs opacity-90 truncate">
          {eventInfo.event.extendedProps.startTime} - {eventInfo.event.extendedProps.endTime || addHourToTimeString(eventInfo.event.extendedProps.startTime)}
        </div>
      </div>
      {eventInfo.event.extendedProps.recurrenceRule && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
    </div>
  );
}; 