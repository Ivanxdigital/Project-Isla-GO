import React, { useState, Fragment, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector.jsx';
import ReviewsSection from './ReviewsSection.jsx';
import { createPaymentSession } from '../utils/paymongo.js';
import { sendBookingEmail as _sendBookingEmail } from '../utils/email.js';
import { countryCodes } from '../data/countryCodes.js';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../utils/supabase.js';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';
import PaymentOptions from './PaymentOptions.jsx';
import debounce from 'lodash.debounce';
import HotelAutocomplete from './HotelAutocomplete.jsx';
import { format, addMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/20/solid';
import DatePicker from './DatePicker.jsx';

const ProgressSteps = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Trip Details', description: 'Select your destinations and dates' },
    { number: 2, title: 'Personal Info', description: 'Complete your booking details' }
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="relative flex-1">
            {index !== 0 && (
              <div
                className="absolute inset-0 -ml-px mt-4 h-0.5 w-full"
                aria-hidden="true"
              >
                <div
                  className={`h-full ${
                    currentStep > step.number
                      ? 'bg-blue-600'
                      : currentStep === step.number
                      ? 'bg-gradient-to-r from-blue-600 to-gray-200'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
            <div className="relative flex flex-col items-center group">
              <span className="h-9 flex items-center">
                <span
                  className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep > step.number
                      ? 'bg-blue-600 text-white'
                      : currentStep === step.number
                      ? 'border-2 border-blue-600 text-blue-600 bg-white'
                      : 'bg-white border-2 border-gray-300'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </span>
              </span>
              <div className="mt-3 text-center">
                <span className="text-sm font-medium text-gray-900">{step.title}</span>
                <p className="mt-1 text-xs text-gray-500 hidden sm:block">{step.description}</p>
                <p className="mt-1 text-xs text-gray-500 sm:hidden">{step.shortDescription}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (number) => {
  // Philippines mobile number format (9XXXXXXXXX)
  const phoneRegex = /^9\d{9}$/;
  return phoneRegex.test(number);
};

const validateMessenger = (contact, type) => {
  if (!contact) return false;
  
  switch (type) {
    case 'whatsapp':
      // WhatsApp format without country code
      return /^\d{10,}$/.test(contact.replace(/\D/g, ''));
    case 'telegram':
      // Telegram username format (at least 5 characters, letters, numbers, and underscores)
      return /^[a-zA-Z0-9_]{5,}$/.test(contact);
    default:
      return false;
  }
};

// Helper function to calculate hotel pickup time based on departure time and offset (in minutes)
const getHotelPickupTime = (departureTime, offset = 60) => {
  const [hour, minute] = departureTime.split(':').map(Number);
  let pickupHour = hour - Math.floor(offset / 60);
  let pickupMinute = minute - (offset % 60);
  if (pickupMinute < 0) {
    pickupMinute += 60;
    pickupHour -= 1;
  }
  return `${pickupHour.toString().padStart(2, '0')}:${pickupMinute.toString().padStart(2, '0')}`;
};

const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) throw new Error('Failed to create customer');
  return data;
};

const createBooking = async (bookingData) => {
  // Validate hotel details if hotel pickup is selected
  if (bookingData.pickup_option === 'hotel' && (!bookingData.hotel_details || !bookingData.hotel_details.name)) {
    throw new Error('Hotel details are required for hotel pickup');
  }

  // Clean up the hotel_details object to ensure no undefined values
  if (bookingData.hotel_details) {
    bookingData.hotel_details = {
      name: bookingData.hotel_details.name || null,
      address: bookingData.hotel_details.address || null,
      location: bookingData.hotel_details.location ? {
        lat: bookingData.hotel_details.location.lat || null,
        lng: bookingData.hotel_details.location.lng || null
      } : null
    };
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();

  if (error) {
    console.error('Booking creation error:', error);
    throw new Error('Failed to create booking: ' + error.message);
  }
  return data;
};

export default function BookingForm() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState('Puerto Princesa');
  const [toLocation, setToLocation] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [isReturn, setIsReturn] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [serviceType, setServiceType] = useState('shared'); // 'shared', 'private15', 'private10'
  const [groupSize, setGroupSize] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [messenger, setMessenger] = useState('');
  const [messengerType, setMessengerType] = useState('whatsapp');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+63');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [_error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // New state for hotel pickup
  const [pickupOption, setPickupOption] = useState('airport'); // 'airport' or 'hotel'
  const [selectedHotel, setSelectedHotel] = useState(null);
  const _hotelOptions = useMemo(() => [
    { id: 1, name: 'City Centre Hotel A', pickupTimeOffset: 60 },
    { id: 2, name: 'City Centre Hotel B', pickupTimeOffset: 60 },
    { id: 3, name: 'City Centre Hotel C', pickupTimeOffset: 60 }
  ], []);

  // New state for validation errors
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    mobileNumber: '',
    messenger: ''
  });

  const locations = ['Puerto Princesa', 'El Nido', 'San Vicente', 'Port Barton'];
  const basePrice = {
    'El Nido': 700,
    'San Vicente': 500
  };

  const isPeakHour = (time) => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0], 10);
    return (hour >= 6 && hour <= 10) || (hour >= 15 && hour <= 19);
  };

  const generateTimeSlots = () => {
    // For Puerto Princesa to El Nido shared van, show specific time slots
    if (fromLocation === 'Puerto Princesa' && toLocation === 'El Nido' && serviceType === 'shared') {
      const specificTimeSlots = [
        '07:30', // 07:30 AM
        '09:30', // 09:30 AM
        '12:30', // 12:30 PM
        '18:45'  // 06:45 PM
      ];
      
      return specificTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // For Puerto Princesa to San Vicente shared van, show specific time slots
    else if (fromLocation === 'Puerto Princesa' && toLocation === 'San Vicente' && serviceType === 'shared') {
      const sanVicenteTimeSlots = [
        '07:00', // 7:00 AM
        '09:00', // 9:00 AM
        '11:00'  // 11:00 AM
      ];
      
      return sanVicenteTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // For Puerto Princesa to Port Barton shared van, show specific time slots
    else if (fromLocation === 'Puerto Princesa' && toLocation === 'Port Barton' && serviceType === 'shared') {
      const portBartonTimeSlots = [
        '07:30', // 7:30 AM
        '09:00', // 9:00 AM
        '11:00'  // 11:00 AM
      ];
      
      return portBartonTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // For El Nido to Puerto Princesa shared van, show specific time slots
    else if (fromLocation === 'El Nido' && toLocation === 'Puerto Princesa' && serviceType === 'shared') {
      const elNidoToPPTimeSlots = [
        '07:00', // 7:00 AM
        '09:00', // 9:00 AM
        '11:00', // 11:00 AM
        '16:00'  // 4:00 PM
      ];
      
      return elNidoToPPTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // For San Vicente to Puerto Princesa shared van, show specific time slots
    else if (fromLocation === 'San Vicente' && toLocation === 'Puerto Princesa' && serviceType === 'shared') {
      const sanVicenteToPPTimeSlots = [
        '07:00', // 7:00 AM
        '09:00', // 9:00 AM
        '11:00', // 11:00 AM
        '13:00'  // 1:00 PM
      ];
      
      return sanVicenteToPPTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // For Port Barton to Puerto Princesa shared van, show specific time slots
    else if (fromLocation === 'Port Barton' && toLocation === 'Puerto Princesa' && serviceType === 'shared') {
      const portBartonToPPTimeSlots = [
        '08:00', // 8:00 AM
        '10:00', // 10:00 AM
        '13:00', // 1:00 PM
        '15:00', // 3:00 PM
        '17:00'  // 5:00 PM
      ];
      
      return portBartonToPPTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // For private vans, show times from 6 AM to 7 PM
    else if (serviceType === 'private15' || serviceType === 'private10') {
      const privateTimeSlots = [];
      
      // Generate hourly slots from 6 AM to 7 PM
      for (let hour = 6; hour <= 19; hour++) {
        // Add both on the hour and half past
        privateTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 19) { // Don't add 19:30 (7:30 PM)
          privateTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
      
      return privateTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
    // Default time slots for other routes
    else {
      const defaultTimeSlots = [
        '05:00', // Early Morning
        '07:30', // Morning
        '10:30', // Morning
        '13:30', // Afternoon
        '15:30', // Afternoon
        '17:30', // Evening
        '19:30'  // Evening
      ];

      return defaultTimeSlots.map(time => {
        const [hours] = time.split(':');
        const hour = parseInt(hours);
        const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
        
        // Format the time for display (convert to 12-hour format with AM/PM)
        const formattedTime = format(new Date(`2023-01-01T${time}:00`), 'hh:mm a');
        
        return {
          time,
          isPeak,
          label: `${formattedTime} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
        };
      });
    }
  };

  // Recalculate time slots when route or service type changes
  const timeSlots = useMemo(() => generateTimeSlots(), [fromLocation, toLocation, serviceType, t]);

  const calculatePrice = () => {
    if (!toLocation || !departureTime) return 0;
    
    const destination = toLocation === 'Puerto Princesa' ? fromLocation : toLocation;
    const base = basePrice[destination];
    const peakSurcharge = isPeakHour(departureTime) ? 150 : 0;
    const returnPeakSurcharge = isReturn && returnTime && isPeakHour(returnTime) ? 150 : 0;
    
    let oneWayPrice;
    switch (serviceType) {
      case 'shared':
        // Per person price for shared van
        oneWayPrice = (base + peakSurcharge) * groupSize;
        break;
      case 'private15':
        // 15-seater private van (higher price)
        oneWayPrice = (base + peakSurcharge) * 12;
        break;
      case 'private10':
        // 10-seater private van (slightly cheaper)
        oneWayPrice = (base + peakSurcharge) * 8;
        break;
      default:
        oneWayPrice = 0;
    }
    
    if (!isReturn) return oneWayPrice;
    
    // Calculate return trip price
    const returnPrice = serviceType === 'shared' 
      ? (base + returnPeakSurcharge) * groupSize
      : (base + returnPeakSurcharge) * (serviceType === 'private15' ? 12 : 8);
    
    return oneWayPrice + returnPrice;
  };

  const getPriceBreakdown = () => {
    if (!toLocation || !departureTime || (isReturn && !returnTime)) return null;
    
    const destination = toLocation === 'Puerto Princesa' ? fromLocation : toLocation;
    const baseFare = basePrice[destination];
    const peakSurcharge = isPeakHour(departureTime) ? 150 : 0;
    const returnPeakSurcharge = isReturn && isPeakHour(returnTime) ? 150 : 0;
    
    let tripBasePrice, totalPeakSurcharge, returnPrice, returnPeakPrice;
    
    switch (serviceType) {
      case 'shared':
        tripBasePrice = baseFare * groupSize;
        totalPeakSurcharge = peakSurcharge * groupSize;
        returnPrice = isReturn ? baseFare * groupSize : 0;
        returnPeakPrice = isReturn ? returnPeakSurcharge * groupSize : 0;
        break;
      case 'private15':
        tripBasePrice = baseFare * 12;
        totalPeakSurcharge = peakSurcharge;
        returnPrice = isReturn ? baseFare * 12 : 0;
        returnPeakPrice = isReturn ? returnPeakSurcharge : 0;
        break;
      case 'private10':
        tripBasePrice = baseFare * 8;
        totalPeakSurcharge = peakSurcharge;
        returnPrice = isReturn ? baseFare * 8 : 0;
        returnPeakPrice = isReturn ? returnPeakSurcharge : 0;
        break;
      default:
        return null;
    }
    
    return {
      basePrice: tripBasePrice,
      peakSurcharge: totalPeakSurcharge,
      returnPrice,
      returnPeakSurcharge: returnPeakPrice,
      total: tripBasePrice + totalPeakSurcharge + returnPrice + returnPeakPrice
    };
  };

  const paginate = (newDirection) => {
    // Scroll to top of form smoothly
    const formElement = document.querySelector('.booking-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    setCurrentStep(currentStep + newDirection);
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    paginate(1);
  };

  const handleBackStep = () => {
    paginate(-1);
  };

  const handleSubmit = async (e, skipUserCheck = false, currentUser = null) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate terms acceptance
    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    
    console.log('Submit handler started');
    console.log('Current payment method:', paymentMethod);
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Use either the passed currentUser or the user from context
      const userToUse = currentUser || user;
      console.log('User to use:', userToUse);
      
      // Check auth first
      if (!skipUserCheck && !userToUse) {
        console.log('No user found, showing auth modal');
        setShowAuthModal(true);
        setIsSubmitting(false);
        return;
      }

      // Payment method is always online now
      if (paymentMethod !== 'online') {
        setPaymentMethod('online');
      }

      console.log('Creating customer...');
      // Create customer record
      const customerData = {
        first_name: firstName,
        last_name: lastName,
        mobile_number: `${selectedCountryCode}${mobileNumber}`,
        messenger_type: messengerType,
        messenger_contact: messenger,
        user_id: userToUse.id
      };
      
      const customer = await createCustomer(customerData);
      console.log('Customer created:', customer);
      
      console.log('Creating booking...');
      // Create booking record
      const createBookingData = {
        customer_id: customer.id,
        user_id: userToUse.id,
        from_location: fromLocation,
        to_location: toLocation,
        departure_date: departureDate,
        departure_time: departureTime,
        return_date: isReturn ? returnDate : null,
        return_time: isReturn ? returnTime : null,
        service_type: serviceType,
        group_size: groupSize,
        pickup_option: pickupOption,
        hotel_pickup: pickupOption === 'hotel' ? selectedHotel?.name : null,
        hotel_details: pickupOption === 'hotel' ? {
          name: selectedHotel?.name,
          address: selectedHotel?.address,
          location: selectedHotel?.location
        } : null,
        payment_method: 'online', // Always set to online
        total_amount: calculatePrice(),
        payment_session_id: null,
        status: 'pending',
        payment_status: 'pending'
      };
      
      const bookingData = await createBooking(createBookingData);
      console.log('Booking created:', bookingData);
      
      // Store booking ID in sessionStorage for polling
      sessionStorage.setItem('lastBookingId', bookingData.id);
      
      // Process online payment (removed cash condition)
      console.log('Processing online payment...');
      try {
        const totalAmount = calculatePrice();
        const amountInCents = Math.round(totalAmount * 100);
        const description = `Booking #${bookingData.id} - ${fromLocation} to ${toLocation}`;

        const session = await createPaymentSession(
          amountInCents,
          description,
          bookingData.id  // Pass the booking ID here
        );

        if (!session?.attributes?.checkout_url) {
          throw new Error('Invalid payment session: Missing checkout URL');
        }

        // Update booking with payment session ID
        await supabase
          .from('bookings')
          .update({ 
            payment_session_id: session.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingData.id);

        // Redirect to PayMongo checkout
        globalThis.location.href = session.attributes.checkout_url;
        return;
      } catch (error) {
        console.error('Payment error:', error);
        throw new Error(`Payment failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setError(error.message || 'Failed to process booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const _handleRegister = async (e) => {
    e.preventDefault();
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: mobileNumber
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then, insert the user data into the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              phone: mobileNumber
            }
          ]);

        if (profileError) throw profileError;
      }
      
      // Show success message and close modal
      setAuthError('Registration successful! Please check your email to verify your account.');
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthError('');
      }, 3000);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLoginSuccess = async () => {
    try {
      console.log('Login success handler triggered');
      
      // Reset states
      setShowAuthModal(false);
      setAuthError('');
      setError('');
      setIsSubmitting(true);
      
      // Ensure we have the latest user data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User session not found');
      }
      
      console.log('Current user after login:', currentUser);
      
      // Update the auth context with the new user
      setUser(currentUser);
      
      // Important: Wait for state updates and modal animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new submission event
      const fakeEvent = { preventDefault: () => {} };
      
      // Pass skipUserCheck=true and the current user to prevent showing auth modal again
      console.log('Proceeding with form submission...');
      await handleSubmit(fakeEvent, true, currentUser);
    } catch (error) {
      console.error('Error in login success handler:', error);
      setError(error.message || 'An error occurred after login');
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoginSubmitting(true);

    try {
      console.log('Attempting login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful:', data);
      // Directly call handleLoginSuccess instead of relying on useEffect
      await handleLoginSuccess();
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
      setIsLoginSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsRegisterSubmitting(true);

    try {
      console.log('Attempting signup...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      console.log('Signup successful:', data);
      // The useEffect will handle the rest
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError(error.message);
      setIsRegisterSubmitting(false);
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const renderAuthModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 auth-modal-container">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create an Account or Sign In</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Please create an account or sign in to complete your booking.
            </p>
          </div>
          <form className="mt-4 space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-2 border ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 ${
                  validationErrors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                placeholder="your@email.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            {authError && (
              <div className="text-red-500 text-sm">{authError}</div>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isRegisterSubmitting || isLoginSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isRegisterSubmitting ? 'Processing...' : 'Register'}
              </button>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoginSubmitting || isRegisterSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoginSubmitting ? 'Processing...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const getAvailableDestinations = useCallback((from) => {
    // If starting from Puerto Princesa, allow travel to El Nido, San Vicente, and Port Barton
    if (from === 'Puerto Princesa') {
      return ['El Nido', 'San Vicente', 'Port Barton'];
    }
    // From any other location, only allow travel to Puerto Princesa
    return ['Puerto Princesa'];
  }, []);

  const handleFromLocationChange = useCallback((newFrom) => {
    setFromLocation(newFrom);
    setToLocation('');  // Reset the destination when changing origin
    setDepartureTime(''); // Reset departure time when origin changes
  }, []);

  // Handle destination change
  const handleToLocationChange = useCallback((newTo) => {
    setToLocation(newTo);
    setDepartureTime(''); // Reset departure time when destination changes
  }, []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const _availableDestinations = useMemo(() => {
    return fromLocation === 'Puerto Princesa'
      ? ['El Nido', 'San Vicente', 'Port Barton']
      : ['Puerto Princesa'];
  }, [fromLocation]);

  const debouncedValidateEmail = useCallback(
    debounce((value) => {
      if (value && !validateEmail(value)) {
        setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      } else {
        setValidationErrors(prev => ({ ...prev, email: '' }));
      }
    }, 300),
    []
  );

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    debouncedValidateEmail(value);
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    setMobileNumber(value);
    if (value && !validatePhoneNumber(value)) {
      setValidationErrors(prev => ({
        ...prev,
        mobileNumber: 'Please enter a valid Philippine mobile number (e.g., 9123456789)'
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        mobileNumber: ''
      }));
    }
  };

  const handleMessengerChange = (e) => {
    const value = e.target.value;
    setMessenger(value);
    if (value && !validateMessenger(value, messengerType)) {
      setValidationErrors(prev => ({
        ...prev,
        messenger: `Please enter a valid ${messengerType === 'whatsapp' ? 'phone number' : 'username'}`
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        messenger: ''
      }));
    }
  };

  // Monitor auth modal state
  useEffect(() => {
    console.log('Auth modal state changed:', showAuthModal);
  }, [showAuthModal]);

  return (
    <div className="bg-gray-50 pb-0">
      {showAuthModal && renderAuthModal()}
      <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 pb-0 booking-form-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="inline-block animate-gradient bg-gradient-to-r from-teal-300 via-purple-400 to-orange-300 text-transparent bg-clip-text bg-size-200 bg-pos-0">
              IslaGo
            </span>
          </h1>
          <LanguageSelector />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            <span className="inline-block animate-gradient bg-gradient-to-r from-teal-300 via-purple-400 to-orange-300 text-transparent bg-clip-text bg-size-200 bg-pos-0">
              IslaGo
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
          <ProgressSteps currentStep={currentStep} />
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {currentStep === 1 ? (
                <form onSubmit={handleInitialSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.from')}
                      </label>
                      <Listbox value={fromLocation} onChange={handleFromLocationChange}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all">
                            <span className="block truncate">{fromLocation}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              {locations.map((location) => (
                                <Listbox.Option
                                  key={location}
                                  value={location}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {location}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      )}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.to')}
                      </label>
                      <Listbox value={toLocation} onChange={handleToLocationChange}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all">
                            <span className="block truncate">{toLocation || 'Select destination'}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              {getAvailableDestinations(fromLocation).map((location) => (
                                <Listbox.Option
                                  key={location}
                                  value={location}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {location}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      )}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.departureDate')}
                      </label>
                      <DatePicker
                        value={departureDate}
                        onChange={(date) => setDepartureDate(date)}
                        minDate={minDate}
                        placeholder={t('form.selectDate')}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.departureTime')}
                      </label>
                      <select
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('form.selectTime')}</option>
                        {timeSlots.map(({ time, label }) => (
                          <option key={`departure-${time}`} value={time}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        id="return-trip"
                        type="checkbox"
                        checked={isReturn}
                        onChange={(e) => setIsReturn(e.target.checked)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="return-trip" className="ml-2 block text-sm font-medium text-gray-700">
                        {t('form.returnTrip')}
                      </label>
                    </div>

                    {isReturn && (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.returnDate')}
                          </label>
                          <DatePicker
                            value={returnDate}
                            onChange={(date) => setReturnDate(date)}
                            minDate={departureDate || minDate}
                            placeholder={t('form.selectDate')}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.returnTime')}
                          </label>
                          <select
                            value={returnTime}
                            onChange={(e) => setReturnTime(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">{t('form.selectTime')}</option>
                            {timeSlots.map(({ time, label }) => (
                              <option key={`return-${time}`} value={time}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Select Your Service Type</h3>
                    
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Time Flexibility:</span> Shared vans have fixed departure times, while private vans offer flexible scheduling between 6:00 AM and 7:00 PM.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 rounded-lg border-2 cursor-pointer shadow-sm transition-all ${
                          serviceType === 'shared'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setServiceType('shared');
                          setGroupSize(1);
                          setDepartureTime('');
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">Shared Van</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Book individual seats in a shared van. Perfect for solo travelers or small groups.
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          <li>Pay per person</li>
                          <li>Most economical option</li>
                          <li>Meet fellow travelers</li>
                        </ul>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 rounded-lg border-2 cursor-pointer shadow-sm transition-all ${
                          serviceType === 'private15'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setServiceType('private15');
                          setGroupSize(Math.min(groupSize, 15));
                          setDepartureTime('');
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">Private 15-Seater</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Book an entire 15-seater van for your group. Maximum comfort and flexibility.
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          <li>Up to 15 passengers</li>
                          <li>Full privacy</li>
                          <li>Flexible schedule</li>
                        </ul>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 rounded-lg border-2 cursor-pointer shadow-sm transition-all ${
                          serviceType === 'private10'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setServiceType('private10');
                          setGroupSize(Math.min(groupSize, 10));
                          setDepartureTime('');
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">Private 10-Seater</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Book a compact 10-seater van. Perfect for smaller groups at a better price.
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          <li>Up to 10 passengers</li>
                          <li>More economical private option</li>
                          <li>Ideal for families</li>
                        </ul>
                      </motion.div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.groupSize')}
                    </label>
                    <div className="inline-flex items-center rounded-md shadow-sm">
                      <button
                        type="button"
                        onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                        className="relative inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="relative w-20">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="1"
                          max={serviceType === 'private15' ? 15 : 10}
                          value={groupSize}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              const max = serviceType === 'private15' ? 15 : 10;
                              setGroupSize(Math.min(max, Math.max(1, value)));
                            } else if (e.target.value === '') {
                              setGroupSize(1);
                            }
                          }}
                          className="block w-full text-center py-2.5 border-t border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 text-lg font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroupSize(Math.min(serviceType === 'private15' ? 15 : 10, groupSize + 1))}
                        className="relative inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {serviceType === 'private15' 
                        ? 'Maximum 15 passengers' 
                        : serviceType === 'private10' 
                          ? 'Maximum 10 passengers' 
                          : 'Select the number of passengers'}
                    </p>
                  </div>

                  {fromLocation && toLocation && departureDate && departureTime && (
                    <div className="mt-8">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-3">{t('booking.summary')}</h3>
                        <div className="space-y-2">
                          <p>{t('form.from')}: {fromLocation}</p>
                          <p>{t('form.to')}: {toLocation}</p>
                          <p>
                            {t('form.departureDate')}: {departureDate} {departureTime} ({isPeakHour(departureTime) ? t('booking.peakHours') : t('booking.offPeakHours')})
                          </p>
                          {isReturn && (
                            <p>
                              {t('form.returnDate')}: {returnDate} {returnTime} ({isPeakHour(returnTime) ? t('booking.peakHours') : t('booking.offPeakHours')})
                            </p>
                          )}
                          <p>
                            {serviceType === 'shared'
                              ? `${t('form.groupSize')}: ${groupSize}`
                              : `${t('form.serviceType')}: ${serviceType === 'private15' ? 'Private 15-Seater' : 'Private 10-Seater'}`
                            }
                          </p>
                          <p>
                            <strong>Pickup Option:</strong> {pickupOption === 'hotel' ? `Hotel Pickup${selectedHotel ? ' from ' + selectedHotel.name : ''}` : 'Airport Pickup'}
                          </p>
                          <p className="font-bold">
                            {t('booking.total')}: ₱{calculatePrice()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Select Pickup Option</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 rounded-lg border-2 cursor-pointer shadow-sm transition-all ${
                          pickupOption === 'airport'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setPickupOption('airport')}
                      >
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                          <h4 className="font-semibold text-lg">Airport Pickup</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          We'll pick you up from the airport terminal.
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 rounded-lg border-2 cursor-pointer shadow-sm transition-all ${
                          pickupOption === 'hotel'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setPickupOption('hotel')}
                      >
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                          <h4 className="font-semibold text-lg">Hotel Pickup</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          We'll pick you up from your hotel.
                        </p>
                      </motion.div>
                    </div>
                    
                    {pickupOption === 'hotel' && (
                      <div className="mt-4 p-5 border border-gray-200 rounded-lg bg-white">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Your Hotel
                        </label>
                        <HotelAutocomplete
                          onSelect={setSelectedHotel}
                          defaultValue={selectedHotel?.name || ''}
                        />
                        {selectedHotel && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-800">{selectedHotel.name}</p>
                            {selectedHotel.address && (
                              <p className="text-xs text-gray-600 mt-1">{selectedHotel.address}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.groupSize')}
                    </label>
                    <div className="inline-flex items-center rounded-md shadow-sm">
                      <button
                        type="button"
                        onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                        className="relative inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="relative w-20">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="1"
                          max={serviceType === 'private15' ? 15 : 10}
                          value={groupSize}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              const max = serviceType === 'private15' ? 15 : 10;
                              setGroupSize(Math.min(max, Math.max(1, value)));
                            } else if (e.target.value === '') {
                              setGroupSize(1);
                            }
                          }}
                          className="block w-full text-center py-2.5 border-t border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 text-lg font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroupSize(Math.min(serviceType === 'private15' ? 15 : 10, groupSize + 1))}
                        className="relative inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {serviceType === 'private15' 
                        ? 'Maximum 15 passengers' 
                        : serviceType === 'private10' 
                          ? 'Maximum 10 passengers' 
                          : 'Select the number of passengers'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-colors mt-6"
                  >
                    {t('form.continue')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.firstName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.lastName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.mobileNumber')}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-lg sm:rounded-r-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        {countryCodes.map((country) => (
                          <option key={country.code + country.country} value={country.code}>
                            {country.country} ({country.code})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={handlePhoneNumberChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg sm:rounded-l-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="9123456789"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('form.messenger')}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={messengerType}
                        onChange={(e) => setMessengerType(e.target.value)}
                        className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="telegram">Telegram</option>
                      </select>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={messenger}
                          onChange={handleMessengerChange}
                          placeholder={t('form.messengerPlaceholder', { type: messengerType })}
                          className={`w-full px-4 py-3 border ${
                            validationErrors.messenger ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg shadow-sm focus:ring-2 ${
                            validationErrors.messenger ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                          } focus:border-${validationErrors.messenger ? 'red' : 'blue'}-500`}
                        />
                        {validationErrors.messenger && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.messenger}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="font-medium text-gray-700">
                          {t('form.termsAndConditions.checkbox')}
                        </label>
                        <p className="text-gray-500 mt-1">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowTerms(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {t('form.termsAndConditions.link')}
                          </a>
                        </p>
                        {!termsAccepted && termsError && (
                          <p className="mt-1 text-sm text-red-600">{t('form.termsAndConditions.required')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                    <button
                      type="button"
                      onClick={handleBackStep}
                      className="w-full sm:w-1/3 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-colors"
                    >
                      {t('form.back')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-2/3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-colors"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('form.processing', 'Processing...')}
                        </span>
                      ) : (
                        t('form.complete')
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
