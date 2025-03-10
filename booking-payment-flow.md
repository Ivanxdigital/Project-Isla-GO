# IslaGO Booking and Payment Flow Documentation

## Overview

This document outlines the complete booking and payment process flow for the IslaGO transportation service application. The flow encompasses user journey from selecting travel details to completing payment and receiving booking confirmation.

## Table of Contents

1. [Booking Form Process](#booking-form-process)
2. [Payment Processing](#payment-processing)
3. [Payment Success Flow](#payment-success-flow)
4. [Payment Cancellation Flow](#payment-cancellation-flow)
5. [Driver Notification System](#driver-notification-system)
6. [Driver Assignment Process](#driver-assignment-process)
7. [Booking Management Interfaces](#booking-management-interfaces)
8. [Key Components and Functions](#key-components-and-functions)
9. [Data Models](#data-models)
10. [Status Codes](#status-codes)
11. [Integration Points](#integration-points)

## Booking Form Process

### Step 1: Trip Details

1. **Location Selection**
   - User selects origin (`fromLocation`) and destination (`toLocation`)
   - Available destinations are dynamically filtered based on origin
   - Main routes: Puerto Princesa ↔ El Nido, Puerto Princesa ↔ San Vicente, Puerto Princesa ↔ Port Barton

2. **Date and Time Selection**
   - User selects departure date (`departureDate`)
   - Available time slots (`departureTime`) are generated based on route and service type
   - Time slots display peak/off-peak hour status

3. **Pickup Option**
   - User selects between airport pickup or hotel pickup
   - For hotel pickup, user can search and select hotel via `HotelAutocomplete` component
   - Hotel pickup time is calculated based on departure time (typically 60 minutes before)

4. **Return Trip Option**
   - User can toggle return trip option (`isReturn`)
   - If enabled, user selects return date and time

5. **Service Type Selection**
   - Shared Van: Per-person pricing, fixed departure times
   - Private 15-Seater: Entire van booking, flexible scheduling, higher price
   - Private 10-Seater: Entire van booking, flexible scheduling, lower price than 15-seater

6. **Group Size Selection**
   - User selects number of passengers (impacts pricing for shared van)
   - Maximum limits: 15 for shared and private 15-seater, 10 for private 10-seater

7. **Price Calculation**
   - Base price determined by destination
   - Peak hour surcharge (₱150) applied during high-demand periods (6:00-10:00 and 15:00-19:00)
   - For shared vans: price calculated per passenger
   - For private vans: fixed price regardless of passenger count
   - Return trip doubles the price calculation with its own peak/off-peak status

### Step 2: Personal Information

1. **Customer Details**
   - User enters first name, last name
   - Mobile number with country code selection
   - Messenger contact (WhatsApp or Telegram) with validation

2. **Payment Method Selection**
   - Currently only online payment is supported via `PaymentOptions` component
   - Uses PayMongo for payment processing (supports GCash and credit cards)

3. **Authentication**
   - If user is not logged in, an authentication modal appears
   - User can sign in with existing account or register new account
   - Authentication is required to complete booking

4. **Booking Submission**
   - User reviews booking summary and price breakdown
   - Accepts terms and conditions
   - Submits booking form

## Payment Processing

1. **Booking Record Creation**
   - System creates customer record in database
   - System creates booking record with 'pending' status
   - Booking ID is stored in session storage

2. **Payment Session Creation**
   - `createPaymentSession` function creates PayMongo checkout session
   - Payment amount, description, and booking ID are passed to PayMongo
   - Success and cancel URLs are configured with booking ID
   - Payment record is created or updated in database
   - Booking record is updated with payment session ID

3. **Redirect to Payment Gateway**
   - User is redirected to PayMongo checkout page
   - User completes payment through GCash or credit card
   - PayMongo redirects user back to application based on payment result

## Payment Success Flow

1. **Payment Verification**
   - `PaymentSuccess` component receives booking ID from URL parameters
   - System polls PayMongo API to verify payment status
   - Polling continues until payment is confirmed or maximum attempts reached

2. **Booking Confirmation**
   - Once payment is verified as successful:
     - Payment record status updated to 'paid'
     - Booking record status updated to 'confirmed'
     - Payment confirmation email sent to customer via Brevo
     - Driver notifications sent via Twilio

3. **Driver Assignment**
   - System begins polling for driver assignment
   - When driver is assigned, driver details are displayed to user
   - If driver assignment fails, appropriate error message is shown

4. **Completion**
   - Success message displayed with booking details
   - User redirected to booking management page after delay
   - Booking can be tracked through the manage-bookings interface

## Payment Cancellation Flow

1. **Cancellation Handling**
   - If user cancels payment on PayMongo checkout page, they are redirected to cancel URL
   - `PaymentCancel` component displays cancellation message
   - No charges are made to the user
   - Booking remains in 'pending' status

2. **Recovery Options**
   - User can choose to try again by returning to booking form
   - Original booking remains in system but requires new payment attempt

## Driver Notification System

1. **Notification Initialization**
   - After successful payment, `sendDriverNotifications` function is called with booking ID
   - System first creates notification records in database via `createDriverNotificationsInDatabase`
   - Booking status is updated to 'finding_driver'

2. **Driver Selection**
   - System queries for active, verified, and available drivers
   - Drivers must have verified documents and be marked as available
   - Each eligible driver receives a notification

3. **Notification Channels**
   - **SMS**: Primary notification channel using Twilio
     - Formatted message includes trip details (from/to locations, date, time, service type)
     - Includes customer name and instructions to reply "YES" to accept
   - **WhatsApp** (optional): Secondary channel for enhanced messaging
     - Formatted with rich text and emojis for better readability
     - Sent via Twilio WhatsApp API

4. **Notification Storage**
   - Each notification is recorded in `driver_notifications` table
   - Includes booking ID, driver ID, status, Twilio message ID
   - Notification channels are tracked (SMS, WhatsApp)
   - Response codes and expiration times are set (typically 5 minutes)

5. **Error Handling**
   - System logs all notification attempts and errors
   - WhatsApp failures don't prevent SMS notifications
   - Booking is updated with notification attempt status

## Driver Assignment Process

1. **Driver Response Handling**
   - Drivers respond to notifications by replying "YES" to accept
   - Responses are processed via Twilio webhook
   - `handleDriverResponse` function updates notification status

2. **Assignment Logic**
   - First driver to accept gets assigned to the booking
   - Notification status updated to 'accepted'
   - Booking status updated to 'assigned'
   - Trip assignment record created linking driver to booking

3. **Driver Polling**
   - Client-side polling checks for driver assignment
   - `startDriverPolling` function in PaymentSuccess component
   - Polls every 5 seconds to check if a driver has been assigned
   - Displays driver information when assignment is confirmed

4. **Assignment Failure Handling**
   - If no driver accepts within timeout period, notifications expire
   - Booking status may be updated to 'finding_driver_failed'
   - User is notified that no driver was found
   - Manual intervention may be required

5. **Driver Details Display**
   - Once assigned, driver details are shown to customer
   - Includes driver name, photo, vehicle details
   - Contact options provided for communication

## Booking Management Interfaces

The IslaGO application provides specialized interfaces for different user roles to manage bookings throughout their lifecycle.

### Customer Booking Management

1. **ManageBookings Component**
   - Accessible to authenticated users
   - Displays all bookings associated with the user's account
   - Organized into tabs:
     - **Upcoming Bookings**: Future trips sorted by departure date
     - **Past Bookings**: Completed or expired trips

2. **Booking Details Display**
   - Each booking card shows:
     - Trip details (from/to locations, dates, times)
     - Service type and group size
     - Payment information and status
     - Visual status indicators with color coding

3. **Booking Actions**
   - **View Details**: Expand booking information
   - **Cancel Booking**: For upcoming bookings that haven't been cancelled
     - Requires confirmation
     - Updates booking status to 'cancelled'
     - No refund processing is currently implemented

4. **Status Notifications**
   - Success/error toast messages for actions
   - Status updates when navigating from payment completion

### Driver Dashboard Interface

1. **DriverDashboard Component**
   - Specialized interface for driver accounts
   - Real-time updates for new booking requests
   - Displays driver statistics and earnings

2. **Pending Booking Requests**
   - Shows active booking notifications awaiting response
   - Displays key trip details:
     - From/to locations
     - Date and time
     - Service type and group size
     - Expiration countdown
   - Action buttons:
     - **Accept**: Claim the booking assignment
     - **Decline**: Reject the booking request

3. **Trip Management**
   - Lists assigned trips with status tracking
   - Filters for upcoming and past trips
   - Mobile-optimized view for on-the-go management

4. **Real-time Notifications**
   - Polling mechanism checks for new booking requests
   - Sound alerts for new notifications
   - Visual indicators for unread notifications

5. **Confirmation System**
   - Modal dialogs for important actions
   - Prevents accidental acceptance/rejection
   - Provides feedback on action success/failure

### Admin Booking Management

1. **BookingsPage Component**
   - Comprehensive booking management for administrators
   - Advanced filtering, sorting, and search capabilities
   - Bulk operations for multiple bookings

2. **Booking CRUD Operations**
   - **Create**: Add new bookings manually
     - Customer selection or creation
     - Complete trip details configuration
     - Status and payment settings
   - **Read**: Detailed view of all booking information
   - **Update**: Edit any booking details
     - Change dates, times, locations
     - Update status and payment information
     - Assign or reassign drivers
   - **Delete**: Remove bookings with cascading deletion of related records

3. **Advanced Filtering**
   - Filter by status, date range, location
   - Search by customer name, booking ID
   - Sort by any field in ascending/descending order

4. **Responsive Design**
   - Desktop view with detailed table layout
   - Mobile view with card-based interface
   - Consistent functionality across devices

5. **Dashboard Analytics**
   - Booking statistics and trends
   - Revenue tracking and reporting
   - Driver performance metrics

## Key Components and Functions

### BookingForm.jsx
- Main component for the booking process
- Handles form state, validation, and submission
- Manages two-step booking process with progress indicator
- Calculates pricing based on route, service type, and time

### PaymentOptions.jsx
- Displays available payment methods
- Currently configured for online payment only
- Handles payment method selection

### paymongo.js
- Contains utility functions for PayMongo integration
- `createPaymentSession`: Creates checkout session with PayMongo
- `verifyPaymentSession`: Verifies payment status with PayMongo
- `mapPaymentStatus`: Maps PayMongo statuses to application statuses
- `updatePaymentStatus`: Updates payment and booking status in database

### PaymentSuccess.jsx
- Handles post-payment success flow
- Verifies payment with PayMongo
- Updates booking and payment records
- Sends confirmation emails and notifications
- Displays booking details and driver information
- Polls for driver assignment status

### PaymentCancel.jsx
- Simple component for handling payment cancellation
- Displays cancellation message and retry option

### send-driver-sms.ts (API)
- Serverless function for sending driver notifications
- Handles SMS and WhatsApp message formatting and sending
- Creates notification records in database
- Updates booking status based on notification results

### twilio.js
- Client-side utility for driver notifications
- `sendDriverNotifications`: Initiates driver notification process
- `createDriverNotificationsInDatabase`: Creates notification records
- `handleDriverResponse`: Processes driver responses to notifications

### ManageBookings.jsx
- User-facing component for booking management
- Displays upcoming and past bookings
- Provides booking cancellation functionality

### DriverDashboard.jsx
- Driver interface for managing bookings
- Displays pending booking requests
- Handles booking acceptance/rejection
- Shows trip history and earnings

### BookingsPage.jsx
- Admin interface for comprehensive booking management
- Provides CRUD operations for bookings
- Includes advanced filtering and search capabilities

## Data Models

### Booking
- `id`: Unique identifier
- `customer_id`: Reference to customer record
- `user_id`: Reference to user account
- `from_location`: Origin location
- `to_location`: Destination location
- `departure_date`: Date of departure
- `departure_time`: Time of departure
- `return_date`: Date of return (if applicable)
- `return_time`: Time of return (if applicable)
- `service_type`: 'shared', 'private15', or 'private10'
- `group_size`: Number of passengers
- `pickup_option`: 'airport' or 'hotel'
- `hotel_details`: Hotel information (if hotel pickup)
- `payment_method`: Payment method used
- `total_amount`: Total booking amount
- `payment_session_id`: PayMongo session ID
- `status`: Booking status
- `payment_status`: Payment status
- `assigned_driver_id`: Reference to assigned driver
- `driver_notification_attempted`: Whether driver notifications were sent
- `driver_notification_attempted_at`: When notifications were sent
- `driver_notification_success`: Whether notifications were successful

### Payment
- `id`: Unique identifier
- `booking_id`: Reference to booking record
- `user_id`: Reference to user account
- `amount`: Payment amount
- `status`: Payment status
- `provider`: Payment provider (e.g., 'paymongo')
- `provider_session_id`: Provider's session ID
- `provider_payment_id`: Provider's payment ID
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Customer
- `id`: Unique identifier
- `first_name`: Customer's first name
- `last_name`: Customer's last name
- `mobile_number`: Customer's mobile number
- `messenger_type`: Type of messenger contact
- `messenger_contact`: Messenger contact details
- `user_id`: Reference to user account

### Driver
- `id`: Unique identifier
- `user_id`: Reference to user account
- `driver_id`: Driver's unique identifier (format: DRV-XXXXXX)
- `full_name`: Driver's full name
- `email`: Driver's email address
- `mobile_number`: Driver's mobile number
- `photo_url`: URL to driver's photo
- `status`: Driver's status ('active', 'inactive', etc.)
- `is_available`: Whether driver is available for assignments
- `documents_verified`: Whether driver's documents are verified
- `vehicle_details`: Information about driver's vehicle

### Driver Notification
- `id`: Unique identifier
- `booking_id`: Reference to booking record
- `driver_id`: Reference to driver record
- `status`: Notification status ('pending', 'accepted', 'declined', 'expired')
- `twilio_message_id`: Twilio message SID
- `notification_channels`: Array of channels used (SMS, WhatsApp)
- `response_code`: Unique code for driver response
- `expires_at`: When notification expires
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Status Codes

### Payment Statuses
- `pending`: Payment initiated but not completed
- `paid`: Payment successfully completed
- `failed`: Payment attempt failed
- `cancelled`: Payment cancelled by user
- `refunded`: Payment refunded

### Booking Statuses
- `pending`: Booking created but payment not completed
- `confirmed`: Booking confirmed after successful payment
- `finding_driver`: System is looking for available drivers
- `assigned`: Driver has been assigned to booking
- `finding_driver_failed`: System failed to assign a driver
- `cancelled`: Booking cancelled
- `completed`: Trip completed

### Notification Statuses
- `pending`: Notification sent, awaiting driver response
- `accepted`: Driver accepted the booking
- `declined`: Driver declined the booking
- `expired`: Notification expired without response

## Integration Points

1. **Supabase**: Database for storing booking, payment, customer, and driver records
2. **PayMongo**: Payment processing gateway
3. **Brevo**: Email notification service
4. **Twilio**: SMS and WhatsApp notification service for drivers
   - SMS: Primary channel for driver notifications
   - WhatsApp: Optional enhanced messaging channel
   - Webhook: Processes driver responses 