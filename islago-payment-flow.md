# IslaGO Payment Flow Documentation

## Overview

This document explains how the booking and payment system works in the IslaGO transportation application. The payment flow is handled through several interconnected components:

1. **BookingForm.jsx** - Handles the booking creation and initial payment setup
2. **PaymentOptions.jsx** - Provides UI for selecting payment methods
3. **paymongo.js** - Integrates with the PayMongo payment gateway
4. **PaymentSuccess.jsx** - Handles payment verification and post-payment processes
5. **Dashboard.jsx** - Driver dashboard for accepting bookings
6. **ManageBookings.jsx** - User interface for managing bookings

## Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   BookingForm   │────▶│  PaymentOptions │────▶│   paymongo.js   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│ Driver Assignment◀────│ PaymentSuccess  │◀────│  PayMongo API   │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Driver Dashboard    │     │    brevo.js     │────▶│ ManageBookings  │
│  (Dashboard.jsx)│     │    (Email)      │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Database Structure

The payment system primarily uses these Supabase tables:

### bookings
- `id` (UUID): Primary key
- `customer_id` (UUID): References customers table
- `user_id` (UUID): References auth.users table
- `from_location` (text): Departure location
- `to_location` (text): Destination location
- `departure_date` (timestamp): Date of travel
- `departure_time` (time): Time of travel
- `service_type` (text): 'shared' or 'private'
- `group_size` (integer): Number of passengers
- `payment_method` (text): Payment method used
- `total_amount` (decimal): Total booking amount
- `payment_status` (text): Status of payment
- `status` (text): Status of booking ('pending', 'confirmed', 'finding_driver', 'driver_assigned', 'completed', 'cancelled')
- `payment_session_id` (text): PayMongo session ID
- `assigned_driver_id` (UUID): References drivers table
- Additional fields for tracking notifications and emails

### payments
- `id` (UUID): Primary key
- `booking_id` (UUID): References bookings table
- `user_id` (UUID): References auth.users table
- `amount` (decimal): Payment amount
- `status` (text): Payment status
- `provider` (text): Payment provider
- `provider_session_id` (text): Session ID from provider
- `provider_payment_id` (text): Payment ID from provider
- `created_at` (timestamp): Record creation time
- `updated_at` (timestamp): Record update time

### customers
- `id` (UUID): Primary key
- `first_name` (text): Customer's first name
- `last_name` (text): Customer's last name
- `email` (text): Customer's email
- `mobile_number` (text): Customer's mobile number

### drivers
- `id` (UUID): Primary key
- `name` (text): Driver's name
- `mobile_number` (text): Driver's contact number
- `vehicle_type` (text): Type of vehicle
- `license_plate` (text): License plate number
- Additional fields for driver availability and ratings

### driver_notifications
- `id` (UUID): Primary key
- `driver_id` (UUID): References drivers table
- `booking_id` (UUID): References bookings table
- `status` (text): Notification status ('pending', 'accepted', 'declined', 'expired')
- `created_at` (timestamp): When the notification was created
- `updated_at` (timestamp): When the notification was last updated

## Detailed Component Analysis

### 1. BookingForm.jsx

This component handles the entire booking process, from collecting user information to initiating payment.

Key functions:
- `validateEmail`, `validatePhoneNumber`, `validateMessenger` - Validate user input
- `createCustomer` - Creates a customer record in the database
- `createBooking` - Creates a booking record
- `calculatePrice` - Calculates the trip price based on various factors
- `getPriceBreakdown` - Provides a detailed breakdown of the price
- `handleSubmit` - Processes the form submission, creates records, and initiates payment

**Key Code Snippet - createBooking:**
```javascript
const createBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: bookingData.customer_id,
        user_id: bookingData.user_id || null,
        from_location: bookingData.from_location,
        to_location: bookingData.to_location,
        departure_date: bookingData.departure_date,
        departure_time: bookingData.departure_time,
        service_type: bookingData.service_type,
        group_size: bookingData.group_size,
        payment_method: bookingData.payment_method,
        total_amount: bookingData.total_amount,
        payment_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Additional fields
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};
```

**Key Code Snippet - handleSubmit:**
```javascript
const handleSubmit = async (e, skipUserCheck = false, currentUser = null) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    // Create customer
    const customer = await createCustomer({
      first_name: firstName,
      last_name: lastName,
      email: email,
      mobile_number: phoneNumber,
      // Other customer data
    });
    
    // Create booking
    const booking = await createBooking({
      customer_id: customer.id,
      // Other booking data
    });
    
    // If online payment, create payment session
    if (paymentMethod === 'online') {
      const session = await createPaymentSession(
        totalPrice * 100, // Convert to centavos for PayMongo
        `IslaGO Transport - ${fromLocation} to ${toLocation}`,
        booking.id
      );
      
      window.location.href = session.attributes.checkout_url;
    }
    
    setIsSubmitting(false);
  } catch (error) {
    console.error('Submission error:', error);
    setIsSubmitting(false);
    toast.error('An error occurred. Please try again.');
  }
};
```

The form is divided into multiple steps using a paginated approach, with `paginate()` handling navigation between steps.

### 2. PaymentOptions.jsx

A simple component that provides the UI for selecting payment methods. Currently supports only online payment via GCash or credit card through PayMongo.

**Key Code Snippet:**
```javascript
export default function PaymentOptions({ paymentMethod, setPaymentMethod }) {
  const handlePaymentMethodChange = (value) => {
    console.log('Payment method selected:', value);
    setPaymentMethod(value);
  };

  const options = [
    {
      id: 'online',
      name: 'Online Payment',
      iconPlaceholder: '💳',
      description: 'Pay with GCash or Credit Card'
    }
  ];

  React.useEffect(() => {
    if (!paymentMethod) {
      setPaymentMethod('online');
    }
  }, [paymentMethod, setPaymentMethod]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
      {options.map((method) => (
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
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
            className="sr-only"
          />
          <div className="flex-shrink-0 text-2xl">
            {method.iconPlaceholder}
          </div>
          <div className="flex-1">
            <span className="font-medium block">{method.name}</span>
            <span className="text-sm text-gray-500">{method.description}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
```

### 3. paymongo.js

This utility file handles all PayMongo payment gateway integration:

**Key Code Snippet - createPaymentSession:**
```javascript
export const createPaymentSession = async (amount, description, bookingId) => {
  try {
    if (!amount || amount <= 0) throw new Error('Invalid amount provided');
    if (!description) throw new Error('Description is required');
    if (!bookingId) throw new Error('Booking ID is required');
    if (!PAYMONGO_SECRET_KEY) throw new Error('PayMongo secret key is not configured');

    const encodedAuth = base64Encode(PAYMONGO_SECRET_KEY + ':');

    // Create the session with success_url that includes the session ID placeholder
    const payload = {
      data: {
        attributes: {
          line_items: [{
            name: description,
            amount: Math.round(amount),
            currency: 'PHP',
            quantity: 1
          }],
          payment_method_types: ['gcash', 'card'],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: description,
          reference_number: `ISLAGO-${bookingId}-${Date.now()}`,
          success_url: `${baseUrl}/payment/success?bookingId=${bookingId}`,
          cancel_url: `${baseUrl}/payment/cancel?bookingId=${bookingId}`,
          // Additional attributes
        }
      }
    };

    // Create the session
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedAuth}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      const errorDetail = responseData.errors?.[0]?.detail || 'Unknown error';
      const errorCode = responseData.errors?.[0]?.code || 'NO_CODE';
      throw new Error(`PayMongo API error (${errorCode}): ${errorDetail}`);
    }

    // Store session information and update database records
    // ...

    return responseData.data;
  } catch (error) {
    console.error('PayMongo error:', error);
    throw error;
  }
};
```

**Key Code Snippet - mapPaymentStatus:**
```javascript
export const mapPaymentStatus = (paymongoStatus) => {
  switch (paymongoStatus?.toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'succeeded':
    case 'active':
      return VALID_PAYMENT_STATUSES.PAID;
    case 'pending':
    case 'awaiting_payment_method':
    case 'processing':
      return VALID_PAYMENT_STATUSES.PENDING;
    case 'unpaid':
      return VALID_PAYMENT_STATUSES.PENDING;
    case 'failed':
      return VALID_PAYMENT_STATUSES.FAILED;
    case 'expired':
    case 'cancelled':
      return VALID_PAYMENT_STATUSES.CANCELLED;
    case 'voided':
    case 'refunded':
      return VALID_PAYMENT_STATUSES.REFUNDED;
    default:
      console.warn('Unhandled PayMongo status:', paymongoStatus);
      return VALID_PAYMENT_STATUSES.PENDING;
  }
};
```

### 4. PaymentSuccess.jsx

Handles the post-payment flow when a user is redirected back to the application after payment:

**Key Code Snippet - pollPaymentStatus:**
```javascript
const pollPaymentStatus = async () => {
  try {
    // Get booking ID from URL
    const urlParams = new URLSearchParams(location.search);
    const bookingId = urlParams.get('bookingId');

    if (!bookingId) {
      throw new Error('Missing booking information');
    }

    // Get payment record
    const { data: records, error: fetchError } = await supabase
      .from('payments')
      .select(`
        id,
        status,
        provider_session_id
      `)
      .eq('booking_id', bookingId)
      .single();

    if (fetchError) {
      throw new Error('Failed to retrieve payment information');
    }

    // If payment is already marked as paid
    if (records.status === 'paid') {
      // Update booking status, send emails, notify drivers
      // ...
      setStatus('success');
      return true;
    }

    // Verify with PayMongo if needed
    if (records.provider_session_id) {
      const sessionData = await verifyPaymentSession(records.provider_session_id);
      const paymentStatus = mapPaymentStatus(sessionData.attributes.status);
      
      if (paymentStatus === 'paid') {
        // Update payment and booking records, send emails, notify drivers
        // ...
        setStatus('success');
        return true;
      }
    }
    
    return false; // Continue polling
  } catch (error) {
    console.error('Error processing payment:', error);
    setStatus('error');
    setError(error.message);
    return true; // Stop polling
  }
};
```

### 5. Dashboard.jsx (Driver Interface)

This component provides the driver dashboard interface where drivers can view and respond to booking requests.

Key functions:
- `fetchNotifications` - Retrieves booking notifications for the driver
- `fetchPendingBookings` - Gets bookings waiting for driver acceptance
- `fetchDriverData` - Gets driver profile information
- `fetchEarnings` - Retrieves driver earnings data
- `handleBookingResponse` - Processes driver's response to a booking request (accept/decline)

**Key Code Snippet - handleBookingResponse:**
```javascript
const handleBookingResponse = async (notificationId, bookingId, accept) => {
  try {
    // Show loading toast
    const loadingToast = toast.loading(
      accept ? 'Accepting booking...' : 'Declining booking...'
    );
    
    // Update notification status
    const { error: notificationError } = await supabase
      .from('driver_notifications')
      .update({
        status: accept ? 'accepted' : 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);
    
    if (notificationError) throw notificationError;
    
    if (accept) {
      // If accepting, update booking with driver assignment
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          assigned_driver_id: driverId,
          status: 'driver_assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (bookingError) {
        // Use fallback mechanism if direct update fails
        return useBookingUpdateFallback(bookingId, notificationId, driverId, accept, loadingToast);
      }
      
      // Send notification to customer
      // ...
    }
    
    toast.dismiss(loadingToast);
    toast.success(accept ? 'Booking accepted!' : 'Booking declined');
    
    // Refresh notifications
    fetchNotifications();
    fetchPendingBookings();
  } catch (error) {
    console.error('Error handling booking response:', error);
    toast.error('Failed to process your response. Please try again.');
  }
};
```

### 6. ManageBookings.jsx (User Booking Management)

This component allows users to view and manage their bookings. It displays booking details, status, and assigned driver information.

Key functions:
- `fetchBookings` - Retrieves user's bookings with payment and driver information
- `handleCancelBooking` - Allows user to cancel a booking
- `getStatusColor` - Determines display style based on booking status

**Key Code Snippet - fetchBookings:**
```javascript
const fetchBookings = async () => {
  try {
    setLoading(true);
    setError(null);

    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }

    // Fetch the bookings for the logged-in user
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('departure_date', { ascending: true });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    // Fetch related payments and driver information
    // ...

    // Combine bookings with their payments and driver information
    const bookingsWithPayments = bookingsData.map(booking => ({
      ...booking,
      payment: paymentsData?.find(payment => payment.booking_id === booking.id) || null,
      driver: booking.assigned_driver_id ? driversData.find(driver => driver.id === booking.assigned_driver_id) || null : null
    }));

    // Sort into upcoming and past bookings
    // ...

    setBookings(sortedBookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    setError('Failed to load bookings. Please try again later.');
  } finally {
    setLoading(false);
  }
};
```

## Complete Booking and Payment Flow

### 1. Booking Creation
   - User fills out booking form in BookingForm.jsx
   - User selects payment method in PaymentOptions.jsx
   - System creates customer and booking records
   - BookingForm.jsx calls createPaymentSession from paymongo.js

### 2. Payment Processing
   - User is redirected to PayMongo's checkout page
   - User completes payment on PayMongo's platform
   - PayMongo redirects back to the success URL

### 3. Payment Verification
   - PaymentSuccess.jsx receives the redirect
   - Component polls for payment status using pollPaymentStatus
   - System verifies payment with PayMongo API
   - System updates payment and booking records

### 4. Driver Notification
   - After successful payment, system sends notifications to available drivers
   - Notifications are sent via:
     - SMS through twilio.js
     - Email through brevo.js
     - In-app notifications in the driver dashboard
   - Booking status is updated to 'finding_driver'
   - System continues polling for driver assignment

### 5. Driver Assignment
   - Drivers receive notifications in their Dashboard.jsx
   - When a notification arrives, a sound is played using playNotificationSound()
   - Driver can accept or decline using handleBookingResponse()
   - First driver to accept is assigned to the booking
   - Booking status is updated to 'driver_assigned'
   - Other drivers' notifications are marked as expired

### 6. Customer Notification
   - Customer is notified of driver assignment via:
     - Email notification
     - SMS notification
     - In-app notification in ManageBookings.jsx
   - Driver details are displayed to the customer
   - Customer can see driver's name, photo, and contact information

### 7. Trip Management
   - Customer can view and manage bookings in ManageBookings.jsx
   - Customer can cancel a booking if needed (subject to cancellation policy)
   - Driver can manage active bookings in Dashboard.jsx
   - Both parties can contact each other via the provided contact information

## Common Edge Cases and Solutions

### 1. Payment Timeout
**Scenario**: User initiates payment but doesn't complete it within the session timeout.
**Handling**:
- Payment session has a timeout set by PayMongo (typically 1 hour)
- Booking remains in 'pending' status
- System doesn't reserve the seat/service until payment is confirmed
- Stale bookings are cleaned up by a scheduled process

### 2. Payment Success but Redirect Failure
**Scenario**: User completes payment but fails to return to the app (closes browser, connection issue, etc.).
**Handling**:
- PayMongo webhooks capture successful payments
- `handlePayMongoWebhook` function processes these events even without user redirect
- System can update payment status asynchronously
- Email confirmation is sent even if the user doesn't return to the success page

### 3. Failed Driver Assignment
**Scenario**: Payment successful but no drivers available or all drivers decline.
**Handling**:
- `startDriverPolling` checks for driver assignment for up to 5 minutes
- If no driver is assigned within this time, system shows a message
- Booking status changes to 'finding_driver_failed'
- Admin is notified to handle the booking manually
- Customer is shown appropriate messaging and contact options

### 4. Email Sending Failures
**Scenario**: Payment successful but email notifications fail.
**Handling**:
- System tries to send emails via Brevo API
- If email sending fails, error is logged to 'email_failures' table
- Toast notifications inform user about the issue
- System continues with other processes despite email failure
- Admins can manually resend emails based on failure logs

### 5. Driver Assignment Update Failure
**Scenario**: Driver accepts booking but database update fails.
**Handling**:
- `useBookingUpdateFallback` function provides a fallback mechanism
- System retries the update with exponential backoff
- If still failing, notification is sent to admin for manual intervention
- Driver is informed of the issue with appropriate error messaging

## Additional Components

Several other components are involved in the booking flow:

- **supabase.js** - Handles all database interactions
- **twilio.js** - Sends SMS notifications to drivers and customers
- **brevo.js** - Sends email confirmations and notifications
- **DriverDetails.jsx** - Displays driver information after assignment
- **ContactOptions.jsx** - Provides contact options for customer support

## Error Handling

The payment system includes robust error handling:
- Error boundaries to prevent component crashes
- Error logging to console
- User-friendly error messages through toast notifications
- Fallback mechanisms when services fail (e.g., if email sending fails)
- Database logging of failures for manual follow-up

## Booking Statuses

The system tracks booking statuses through the entire flow:
- **pending** - Booking created but not paid
- **confirmed** - Payment confirmed but no driver assigned yet
- **finding_driver** - System is looking for an available driver
- **driver_assigned** - Driver has accepted the booking
- **finding_driver_failed** - No driver available or all declined
- **completed** - Trip successfully completed
- **cancelled** - Booking cancelled by customer, driver, or system

## Payment Statuses

The system tracks payment statuses through the entire flow:
- **pending** - Payment initiated but not completed
- **paid** - Payment successfully completed
- **failed** - Payment attempt failed
- **cancelled** - Payment cancelled by user or expired
- **refunded** - Payment refunded to customer

## Conclusion

The IslaGO system provides a complete end-to-end flow for handling transportation bookings, from creating the booking to processing payment, assigning drivers, and managing the trip. The integration between customer-facing components (BookingForm, PaymentSuccess, ManageBookings) and driver-facing components (Dashboard) creates a seamless experience for both parties, while robust error handling and notification systems ensure reliable operation even in edge cases. 