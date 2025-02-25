# IslaGO System Flow Documentation

## Table of Contents
1. [Booking Form Flow](#booking-form-flow)
2. [Payment Integration (PayMongo)](#payment-integration)
3. [SMS Notification System](#sms-notification-system)
4. [Driver Acceptance Process](#driver-acceptance-process)
5. [Database Schema](#database-schema)

## Booking Form Flow

### Step 1: User Input Collection
- Location selection (from/to)
- Date and time selection
- Service type (shared/private)
- Group size
- Pickup option (airport/hotel)
- Customer details (name, contact information)
- Payment method selection (online/cash)

### Step 2: Booking Creation
1. Customer record creation
2. Booking record creation with status 'pending'
3. Price calculation based on service type and route

### Step 3: Payment Method Processing
- For online payments: Redirect to PayMongo checkout
- For cash payments: Direct to success page

## Payment Integration

### PayMongo Integration
- **Configuration**: Uses PayMongo API for secure payment processing
- **Supported Methods**: GCash and Credit Card
- **Environment Variables**:
  - PAYMONGO_PUBLIC_KEY
  - PAYMONGO_SECRET_KEY

### Payment Flow
1. **Session Creation**
   - Creates PayMongo checkout session
   - Includes booking details and amount
   - Generates unique reference number
   - Sets success/cancel URLs

2. **Payment Processing**
   - User redirected to PayMongo checkout
   - Payment status tracked in database
   - Webhook handling for status updates

3. **Payment States**
   - PENDING: Initial state
   - PAID: Successfully completed
   - FAILED: Payment unsuccessful
   - CANCELLED: User cancelled
   - REFUNDED: Payment refunded

### Payment Success Handling
1. Verifies payment session
2. Updates booking status
3. Updates payment record
4. Triggers driver notification system
5. Redirects to booking management

## SMS Notification System

### Driver Notification Process
1. **Trigger**: Successful payment completion
2. **Driver Selection**:
   - Queries available drivers
   - Filters by status, verification, and availability

### SMS Content
- Booking details (locations, date, time)
- Service type
- Customer information
- Response instructions

### Implementation
- **Service**: Twilio SMS API
- **Environment Variables**:
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_PHONE_NUMBER

### Notification Flow
1. Fetches booking details
2. Retrieves available drivers
3. Sends SMS notifications
4. Creates notification records
5. Updates booking status to 'finding_driver'

## Driver Acceptance Process

### Driver Response Handling
1. **SMS Response**:
   - Driver replies with 'YES' to accept
   - Response tracked in database

2. **Acceptance Processing**:
   - Updates notification status
   - Updates booking status to 'assigned'
   - Creates trip assignment
   - Notifies customer

3. **Rejection Handling**:
   - Updates notification status
   - Keeps booking in pool for other drivers
   - Records response time

### Booking Assignment
1. **Validation**:
   - Checks driver availability
   - Verifies seating capacity
   - Confirms time slot availability

2. **Assignment Process**:
   - Creates trip assignment record
   - Updates booking status
   - Updates driver availability
   - Sends confirmation messages

## Database Schema

### Key Tables and Types

1. **Booking-Related Tables**
   - `bookings`: Core booking information with ENUM status:
     ```sql
     booking_status ENUM (
       'pending', 'finding_driver', 'assigned', 
       'completed', 'cancelled', 'expired'
     )
     ```
   - `customers`: Customer profile and contact information
   - `payments`: Payment tracking with ENUM status:
     ```sql
     payment_status ENUM (
       'pending', 'processing', 'paid',
       'failed', 'cancelled', 'refunded'
     )
     ```

2. **Driver-Related Tables**
   - `drivers`: Driver profiles with ENUM status:
     ```sql
     driver_status ENUM (
       'active', 'inactive', 'suspended',
       'pending_verification'
     )
     ```
   - `driver_applications`: Driver onboarding with ENUM status:
     ```sql
     driver_application_status ENUM (
       'draft', 'submitted', 'under_review',
       'approved', 'rejected'
     )
     ```
   - `driver_availability`: Schedule and availability tracking
   - `vehicles`: Vehicle information with ENUM status:
     ```sql
     vehicle_status ENUM (
       'active', 'maintenance', 'retired'
     )
     ```

3. **Notification System Tables**
   - `driver_notifications`: SMS notifications with ENUM status:
     ```sql
     notification_status ENUM (
       'PENDING', 'ACCEPTED', 'REJECTED'
     )
     ```
   - `notification_logs`: Delivery tracking and error logging
   - `driver_notification_logs`: Detailed notification history

4. **Assignment and Trip Tables**
   - `trip_assignments`: Trip management with ENUM status:
     ```sql
     trip_status ENUM (
       'pending', 'assigned', 'in_progress',
       'completed', 'cancelled'
     )
     ```
   - `routes`: Predefined travel routes and pricing
   - `driver_assignments`: Driver-booking relationships

### Key Database Functions

1. **Booking Management**
   - `handle_paymongo_webhook(payload jsonb)`: Processes payment webhooks
   - `notify_drivers()`: Triggers driver notifications on payment completion
   - `create_driver_notifications(booking_id uuid)`: Generates driver notifications

2. **Driver Management**
   - `find_available_drivers(date, time, from_loc, to_loc)`: Locates suitable drivers
   - `handle_driver_response(booking_id, driver_id, response_code)`: Processes driver responses
   - `update_driver_available_seats()`: Manages vehicle capacity

3. **Automated Triggers**
   - `on_booking_paid`: Triggers notifications when payment is completed
   - `on_driver_application_approved`: Handles driver role assignment
   - `update_available_seats`: Maintains seat inventory
   - `init_available_seats`: Initializes vehicle capacity

### Database Indexes
1. **Booking Performance**
   - `idx_bookings_status`: Optimizes booking status queries
   - `idx_driver_notifications_status`: Improves notification lookups

2. **Driver Operations**
   - `idx_drivers_status`: Enhances driver status searches
   - `idx_driver_availability_composite`: Optimizes availability checks
   - `idx_driver_availability_date_time`: Improves scheduling queries

3. **Customer Service**
   - `idx_customers_email`: Speeds up customer lookups
   - `profiles_role_idx`: Enhances role-based queries

### Security and Validation

1. **Role-Based Access**
   - `check_user_role(uuid)`: Validates user permissions
   - `is_staff()`: Verifies staff privileges
   - `get_user_role(uuid)`: Retrieves user roles

2. **Data Integrity**
   - Status ENUM types ensure valid state transitions
   - Foreign key constraints maintain referential integrity
   - Trigger-based validation for critical operations

3. **Automated Updates**
   - `handle_updated_at()`: Maintains timestamp accuracy
   - `update_updated_at_column()`: Updates modification timestamps

## Security Measures

1. **Payment Security**:
   - Secure API key handling
   - Payment data encryption
   - Session validation

2. **SMS Security**:
   - Secure webhook endpoints
   - Phone number validation
   - Response verification

3. **Database Security**:
   - Role-based access control
   - Secure function execution
   - Data validation rules 