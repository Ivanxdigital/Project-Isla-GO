import React, { useState, Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';
import ReviewsSection from './ReviewsSection';
import { createPaymentSession } from '../utils/paymongo';
import { sendBookingEmail } from '../utils/email';
import { countryCodes } from '../data/countryCodes';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const drivers = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c',
    vanImage: 'https://www.toyotamarilao.com.ph/wp-content/uploads/2021/05/Cars_SGEliteColor001.png',
    experience: '5 years',
    vanType: '15-Seater Toyota HiAce',
    rating: 4.9,
    trips: 2500
  },
  {
    id: 2,
    name: 'Maria Santos',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    vanImage: 'https://www.toyotamarilao.com.ph/wp-content/uploads/2021/05/Cars_SGEliteColor001.png',
    experience: '7 years',
    vanType: '15-Seater Toyota HiAce GL',
    rating: 4.8,
    trips: 3100
  },
  {
    id: 3,
    name: 'Pedro Reyes',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    vanImage: 'https://www.toyotamarilao.com.ph/wp-content/uploads/2021/05/Cars_SGEliteColor001.png',
    experience: '4 years',
    vanType: '15-Seater Nissan NV350',
    rating: 4.9,
    trips: 1800
  }
];

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

// Add these validation functions near the top of the component
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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+63');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Add new state for validation errors
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    mobileNumber: '',
    messenger: ''
  });

  // Add new state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const locations = ['Puerto Princesa', 'El Nido', 'San Vicente'];
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
    // Define fixed time slots
    const fixedTimeSlots = [
      '05:00', // Early Morning
      '07:30', // Morning
      '10:30', // Morning
      '13:30', // Afternoon
      '15:30', // Afternoon
      '17:30', // Evening
      '19:30'  // Evening
    ];

    return fixedTimeSlots.map(time => {
      const [hours] = time.split(':');
      const hour = parseInt(hours);
      const isPeak = (hour >= 7 && hour <= 11) || (hour >= 15 && hour <= 19);
      return {
        time,
        isPeak,
        label: `${time} (${isPeak ? t('booking.peakHours') : t('booking.offPeakHours')})`
      };
    });
  };

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
        oneWayPrice = (base + peakSurcharge) * 12; // Base price for private 15-seater
        break;
      case 'private10':
        // 10-seater private van (slightly cheaper)
        oneWayPrice = (base + peakSurcharge) * 8; // Base price for private 10-seater
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

  const renderPaymentOptions = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[
        { id: 'online', name: 'Online Payment', iconPlaceholder: '💳', description: 'Pay with GCash or Credit Card' },
        { id: 'cash', name: 'Cash', iconPlaceholder: '💵', description: '₱300 deposit required' }
      ].map((method) => (
        <label
          key={method.id}
          className={`
            relative border rounded-lg p-5 sm:p-4 cursor-pointer flex items-center space-x-3
            ${paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <input
            type="radio"
            name="payment"
            value={method.id}
            checked={paymentMethod === method.id}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="sr-only"
          />
          <div className="flex-shrink-0 text-2xl">
            {method.iconPlaceholder}
          </div>
          <div className="flex-1">
            <span className="font-medium block">{method.name}</span>
            <span className="text-sm text-gray-500">
              {method.description}
            </span>
          </div>
        </label>
      ))}
    </div>
  );

  const createCustomer = async (customerData) => {
    console.log('Creating customer with data:', customerData);
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer: ' + error.message);
    }

    console.log('Customer created successfully:', data);
    return data;
  };

  const createBooking = async (bookingData) => {
    console.log('Creating booking with data:', bookingData);
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking: ' + error.message);
    }

    console.log('Booking created successfully:', data);
    return data;
  };

  const handleSubmit = async (e, skipUserCheck = false, currentUser = null) => {
    if (e) {
      e.preventDefault();
    }
    
    // Reset validation errors
    setValidationErrors({
      email: '',
      mobileNumber: '',
      messenger: ''
    });

    // Validate email
    if (!validateEmail(email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(mobileNumber)) {
      setValidationErrors(prev => ({
        ...prev,
        mobileNumber: 'Please enter a valid Philippine mobile number (e.g., 9123456789)'
      }));
      return;
    }

    // Validate messenger contact if provided
    if (messenger && !validateMessenger(messenger, messengerType)) {
      setValidationErrors(prev => ({
        ...prev,
        messenger: `Please enter a valid ${messengerType === 'whatsapp' ? 'phone number' : 'username'}`
      }));
      return;
    }

    // Check if user is authenticated
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    
    if (!skipUserCheck && !currentAuthUser) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    // Use either the passed currentUser or the user from context
    const userToUse = currentUser || currentAuthUser;
    
    console.log('Starting booking submission with user:', userToUse);
    
    try {
      setIsProcessingPayment(true);
      
      // Create customer record first
      const customerData = {
        first_name: firstName,
        last_name: lastName,
        mobile_number: `${selectedCountryCode}${mobileNumber}`,
        messenger_type: messengerType,
        messenger_contact: messenger,
        user_id: userToUse.id
      };
      
      console.log('Creating customer with data:', customerData);
      const customer = await createCustomer(customerData);
      console.log('Customer created:', customer);
      
      // Create booking record
      const bookingData = {
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
        payment_method: paymentMethod.toLowerCase(),
        total_amount: calculatePrice(),
        payment_status: 'pending',
        status: 'pending'
      };
      
      console.log('Creating booking with data:', bookingData);
      const booking = await createBooking(bookingData);
      console.log('Booking created:', booking);
      
      if (paymentMethod.toLowerCase() === 'online') {
        toast.loading('Setting up payment...', { id: 'payment-setup' });
        
        const totalAmount = calculatePrice() * 100;
        console.log('Creating payment session for amount:', totalAmount);
        
        const session = await createPaymentSession(
          totalAmount,
          `Booking #${booking.id} - ${fromLocation} to ${toLocation}`
        ).catch(error => {
          console.error('PayMongo session creation failed:', error);
          throw new Error('Failed to create payment session: ' + error.message);
        });
        
        console.log('Payment session created successfully:', session);
        
        if (!session?.attributes?.checkout_url) {
          throw new Error('Invalid payment session: Missing checkout URL');
        }
        
        // Store booking ID in sessionStorage instead of localStorage
        sessionStorage.setItem('lastBookingId', booking.id);
        
        // Update booking with payment session ID
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_session_id: session.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (updateError) {
          throw new Error('Failed to update booking with payment session');
        }
        
        // Redirect to checkout
        const checkoutUrl = session.attributes.checkout_url;
        console.log('Redirecting to checkout URL:', checkoutUrl);
        
        toast.success('Redirecting to payment...', { id: 'payment-setup' });
        
        // Short delay to show the success message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        window.location.href = checkoutUrl;
        return;
      } else {
        // Handle cash payment
        toast.success('Booking completed successfully!');
        navigate('/booking/success');
      }
    } catch (error) {
      console.error('Error in submission:', error);
      toast.error(error.message || 'An error occurred during submission');
      setIsProcessingPayment(false);
    }
  };

  const handleRegister = async (e) => {
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Why create an account?</h4>
            <p className="text-sm text-blue-600">
              Creating an account allows us to:
            </p>
            <ul className="text-sm text-blue-600 list-disc list-inside mt-2">
              <li>Store and manage your bookings</li>
              <li>Send you booking confirmations</li>
              <li>Provide easy access to your travel history</li>
              <li>Keep you updated about your trip</li>
            </ul>
          </div>

          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create an Account or Sign In</h3>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            {authError && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{authError}</div>
            )}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isRegisterSubmitting || isLoginSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isRegisterSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoginSubmitting || isRegisterSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoginSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const handleFromLocationChange = (e) => {
    const newFrom = e.target.value;
    setFromLocation(newFrom);
    if (newFrom !== 'Puerto Princesa') {
      setToLocation('Puerto Princesa');
    } else {
      setToLocation('');
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const getAvailableDestinations = () => {
    if (fromLocation === 'Puerto Princesa') {
      return ['El Nido', 'San Vicente'];
    }
    return ['Puerto Princesa'];
  };

  const timeSlots = generateTimeSlots();

  // Add these validation handler functions after the validation functions
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
    } else {
      setValidationErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
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

  // Add this useEffect to handle successful authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && showAuthModal) {
        // Close the modal and continue with form submission
        setShowAuthModal(false);
        handleSubmit(null, true, currentUser);
      }
    };

    checkAuth();
  }, [user]); // Add user to dependency array to trigger when auth state changes

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 booking-form-container">
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="inline-block animate-gradient bg-gradient-to-r from-teal-300 via-purple-400 to-orange-300 text-transparent bg-clip-text bg-size-200 bg-pos-0">
              IslaGo
            </span>
          </h1>
          <p className="text-lg text-gray-600">{t('subtitle')}</p>
        </div>

        <ProgressSteps currentStep={currentStep} />

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.from')}
                      </label>
                      <Listbox value={fromLocation} onChange={setFromLocation}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300">
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
                      <Listbox value={toLocation} onChange={setToLocation}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300">
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
                              {locations.filter(loc => loc !== fromLocation).map((location) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.departureDate')}
                      </label>
                      <input
                        type="date"
                        min={minDate}
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isReturn}
                        onChange={(e) => {
                          setIsReturn(e.target.checked);
                          if (!e.target.checked) {
                            setReturnDate('');
                            setReturnTime('');
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{t('form.returnTrip')}</span>
                    </label>

                    {isReturn && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.returnDate')}
                          </label>
                          <input
                            type="date"
                            min={departureDate || minDate}
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

                  {/* Service Type Selection */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Select Your Service Type</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 sm:p-4 rounded-lg border-2 cursor-pointer ${
                          serviceType === 'shared'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                        onClick={() => {
                          setServiceType('shared');
                          setGroupSize(1);
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">Shared Van</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Book individual seats in a shared van. Perfect for solo travelers or small groups.
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          <li>Pay per person</li>
                          <li>Most economical option</li>
                          <li>Meet fellow travelers</li>
                        </ul>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 sm:p-4 rounded-lg border-2 cursor-pointer ${
                          serviceType === 'private15'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                        onClick={() => {
                          setServiceType('private15');
                          setGroupSize(Math.min(groupSize, 15));
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">Private 15-Seater</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Book an entire 15-seater van for your group. Maximum comfort and flexibility.
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          <li>Up to 15 passengers</li>
                          <li>Full privacy</li>
                          <li>Flexible schedule</li>
                        </ul>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-5 sm:p-4 rounded-lg border-2 cursor-pointer ${
                          serviceType === 'private10'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                        onClick={() => {
                          setServiceType('private10');
                          setGroupSize(Math.min(groupSize, 10));
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">Private 10-Seater</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Book a compact 10-seater van. Perfect for smaller groups at a better price.
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          <li>Up to 10 passengers</li>
                          <li>More economical private option</li>
                          <li>Ideal for families</li>
                        </ul>
                      </motion.div>
                    </div>
                  </div>

                  {/* Group Size Selection */}
                  <div className="mb-8 flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      {serviceType === 'shared' ? 'Number of Passengers' : 'Group Size (Optional)'}
                    </h3>
                    <div className="flex items-center justify-center space-x-6">
                      <button
                        type="button"
                        onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100"
                        disabled={groupSize <= 1}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-2xl font-semibold w-12 text-center">{groupSize}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxSize = serviceType === 'private10' ? 10 : serviceType === 'private15' ? 15 : 15;
                          setGroupSize(Math.min(maxSize, groupSize + 1));
                        }}
                        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100"
                        disabled={
                          (serviceType === 'private10' && groupSize >= 10) ||
                          (serviceType === 'private15' && groupSize >= 15) ||
                          (serviceType === 'shared' && groupSize >= 15)
                        }
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    {serviceType !== 'shared' && (
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        Optional: Let us know your group size to better accommodate your needs
                      </p>
                    )}
                  </div>

                  {toLocation && departureTime && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            {t('booking.summary')}
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>{t('form.from')}: {fromLocation}</p>
                            <p>{t('form.to')}: {toLocation}</p>
                            <p>{t('form.departureDate')}: {departureDate} {departureTime} ({isPeakHour(departureTime) ? t('booking.peakHours') : t('booking.offPeakHours')})</p>
                            {isReturn && <p>{t('form.returnDate')}: {returnDate} {returnTime} ({isPeakHour(returnTime) ? t('booking.peakHours') : t('booking.offPeakHours')})</p>}
                            <p>{serviceType === 'shared' ? `${t('form.groupSize')}: ${groupSize}` : `${t('form.serviceType')}: ${serviceType === 'private15' ? 'Private 15-Seater' : 'Private 10-Seater'}`}</p>
                            <p className="font-bold">
                              {t('booking.total')}: ₱{calculatePrice()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isProcessingPayment}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                      </div>
                    ) : isSubmitting ? (
                      'Processing...'
                    ) : (
                      t('form.complete')
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.firstName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                        className="w-full sm:w-48 px-4 py-3 sm:py-2 border border-gray-300 rounded-md sm:rounded-l-md sm:rounded-r-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-md sm:rounded-l-none focus:ring-2 focus:ring-blue-500"
                        placeholder="9123456789"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('form.messenger')}
                    </label>
                    <div className="flex gap-4">
                      <select
                        value={messengerType}
                        onChange={(e) => setMessengerType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                          className={`w-full px-4 py-2 border ${
                            validationErrors.messenger ? 'border-red-500' : 'border-gray-300'
                          } rounded-md focus:ring-2 ${
                            validationErrors.messenger ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                          }`}
                        />
                        {validationErrors.messenger && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.messenger}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('payment.method')}
                    </label>
                    {renderPaymentOptions()}
                    {paymentMethod === 'Cash' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              {t('payment.depositRequired')}
                            </h3>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-start">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                        {t('form.termsAndConditions.checkbox')}{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-800">
                          {t('form.termsAndConditions.link')}
                        </a>
                      </label>
                    </div>
                  </div>

                  {/* Payment Breakdown Section */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h4 className="text-lg font-semibold mb-3">Payment Breakdown</h4>
                    <div className="space-y-3 sm:space-y-2">
                      {getPriceBreakdown() && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {serviceType === 'shared' 
                                ? `Base Price (${groupSize} passenger${groupSize > 1 ? 's' : ''})`
                                : `Base Price (${serviceType === 'private15' ? '15-seater' : '10-seater'})`
                              }
                            </span>
                            <span>₱{getPriceBreakdown().basePrice}</span>
                          </div>

                          {getPriceBreakdown().peakSurcharge > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Peak Hour Surcharge</span>
                              <span>₱{getPriceBreakdown().peakSurcharge}</span>
                            </div>
                          )}

                          {isReturn && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Return Trip Base Price</span>
                                <span>₱{getPriceBreakdown().returnPrice}</span>
                              </div>

                              {getPriceBreakdown().returnPeakSurcharge > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Return Peak Hour Surcharge</span>
                                  <span>₱{getPriceBreakdown().returnPeakSurcharge}</span>
                                </div>
                              )}
                            </>
                          )}

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between font-semibold">
                              <span>Total Amount</span>
                              <span>₱{getPriceBreakdown().total}</span>
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            {serviceType === 'shared' ? (
                              <p>Price is calculated per passenger with applicable peak hour surcharges.</p>
                            ) : (
                              <p>Price is for the entire van regardless of the number of passengers.</p>
                            )}
                            {(getPriceBreakdown().peakSurcharge > 0 || getPriceBreakdown().returnPeakSurcharge > 0) && (
                              <p className="mt-1">Peak hour surcharge applies during high-demand periods (6:00-10:00 and 15:00-19:00).</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleBackStep}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      {t('form.back')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isProcessingPayment}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing Payment...
                        </div>
                      ) : isSubmitting ? (
                        'Processing...'
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

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">{t('drivers.title')}</h2>
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            className="mySwiper"
          >
            {drivers.map((driver) => (
              <SwiperSlide key={driver.id}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6">
                      <div className="aspect-w-1 aspect-h-1 rounded-full overflow-hidden mb-4 w-32 h-32 mx-auto">
                        <img
                          src={driver.image}
                          alt={driver.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{driver.name}</h3>
                      <div className="space-y-2 text-gray-600">
                        <p className="flex items-center justify-center">
                          <span className="font-medium">{t('drivers.experience')}:</span>
                          <span className="ml-2">{driver.experience}</span>
                        </p>
                        <p className="flex items-center justify-center">
                          <span className="font-medium">{t('drivers.rating')}:</span>
                          <span className="ml-2">{driver.rating}/5.0</span>
                        </p>
                        <p className="flex items-center justify-center">
                          <span className="font-medium">{t('drivers.trips')}:</span>
                          <span className="ml-2">{driver.trips}+</span>
                        </p>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50">
                      <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden mb-4">
                        <img
                          src={driver.vanImage}
                          alt={`${driver.name}'s van`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-lg font-semibold text-center text-gray-900 mb-2">{t('drivers.vehicle')}</h4>
                      <p className="text-center text-gray-600">{driver.vanType}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div>
          <ReviewsSection />
        </div>
      </div>

      {toLocation && departureTime && (!isReturn || (isReturn && returnTime)) && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {t('booking.summary')}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{t('form.from')}: {fromLocation}</p>
                <p>{t('form.to')}: {toLocation}</p>
                <p>{t('form.departureDate')}: {departureDate} {departureTime} ({isPeakHour(departureTime) ? t('booking.peakHours') : t('booking.offPeakHours')})</p>
                {isReturn && <p>{t('form.returnDate')}: {returnDate} {returnTime} ({isPeakHour(returnTime) ? t('booking.peakHours') : t('booking.offPeakHours')})</p>}
                <p>{serviceType === 'shared' ? `${t('form.groupSize')}: ${groupSize}` : `${t('form.serviceType')}: ${serviceType === 'private15' ? 'Private 15-Seater' : 'Private 10-Seater'}`}</p>
                
                {/* Detailed price breakdown */}
                {getPriceBreakdown() && (
                  <div className="mt-2 border-t border-blue-200 pt-2">
                    <p>Base Fare: ₱{getPriceBreakdown().basePrice}</p>
                    {getPriceBreakdown().peakSurcharge > 0 && (
                      <p>Peak Hour Surcharge: ₱{getPriceBreakdown().peakSurcharge}</p>
                    )}
                    {isReturn && (
                      <>
                        <p>Return Base Fare: ₱{getPriceBreakdown().returnPrice}</p>
                        {getPriceBreakdown().returnPeakSurcharge > 0 && (
                          <p>Return Peak Hour Surcharge: ₱{getPriceBreakdown().returnPeakSurcharge}</p>
                        )}
                      </>
                    )}
                    <p className="font-bold mt-1">
                      {t('booking.total')}: ₱{getPriceBreakdown().total}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && renderAuthModal()}
    </div>
  );
}