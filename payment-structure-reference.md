# IslaGO Payment System Documentation

## Overview
The IslaGO payment system integrates PayMongo for online payments and supports cash payments. The system handles payment processing, booking management, and driver notifications through a multi-step workflow.

## Architecture

### Payment Flow
1. User completes booking form
2. Payment method selection (Online/Cash)
3. Payment processing via PayMongo (for online payments)
4. Success/Cancel handling
5. Driver notification system
6. Booking status management

## Components

### 1. Booking Form
**Location**: `src/components/BookingForm.jsx`
- Handles initial booking data collection
- Validates user inputs
- Manages payment method selection
- Creates payment sessions
- Updates booking status in database

Key Payment Logic:
javascript
const handlePaymentProcess = async () => {
if (paymentMethod === 'online') {
const session = await createPaymentSession(
amountInCents,
description
);
await updateBookingWithSession(bookingId, session.id);
redirectToPayMongo(session.checkout_url);
} else {
handleCashPayment();
}
};


### 2. PayMongo Integration
**Location**: `src/utils/paymongo.js`

Features:
- Secure payment session creation
- Payment verification
- Success/failure handling
- Webhook processing

Configuration:
javascript
const paymentConfig = {
methods: ['gcash', 'card'],
currency: 'PHP',
captureMethod: 'automatic',
descriptor: 'IslaGO Transport'
};


### 3. Payment Success Handler
**Location**: `src/components/PaymentSuccess.jsx`

Responsibilities:
- Verifies payment completion
- Updates booking status
- Triggers driver notifications
- Handles session validation

### 4. API Endpoints

#### Driver Notification System
**Location**: `api/send-driver-sms.ts`
- Sends booking notifications to available drivers
- Manages driver responses
- Updates booking assignments

#### Payment Webhook Handler
**Location**: `api/twilio-webhook.ts`
- Processes driver responses
- Updates booking statuses
- Sends confirmation messages

## Database Schema

### Bookings Table
sql
CREATE TABLE bookings (
id UUID PRIMARY KEY,
payment_session_id TEXT,
payment_status TEXT,
payment_method TEXT,
amount DECIMAL,
status TEXT,
driver_id UUID,
created_at TIMESTAMP,
updated_at TIMESTAMP
);


## Payment States

1. **PENDING**
   - Initial booking state
   - Awaiting payment processing

2. **PROCESSING**
   - Payment session created
   - Awaiting PayMongo confirmation

3. **COMPLETED**
   - Payment verified
   - Ready for driver assignment

4. **FAILED**
   - Payment unsuccessful
   - Requires user intervention

## Security Measures

1. **Payment Data Protection**
   - No storage of sensitive payment information
   - PayMongo handles all card data
   - Secure webhook validation

2. **API Security**
   - Request signature validation
   - Rate limiting
   - Environment variable protection

## Error Handling

1. **Payment Failures**
   - Automatic retry mechanism
   - User notification
   - Booking status rollback

2. **Network Issues**
   - Session recovery
   - Idempotency keys
   - Transaction logging

## Testing

### Payment Testing
typescript:api/test-sms.ts
startLine: 1
endLine: 35


### Environment Validation
typescript:api/test-env.ts
startLine: 1
endLine: 42


## Monitoring & Logging

1. **Payment Tracking**
   - Transaction logging
   - Error monitoring
   - Success rate tracking

2. **Performance Metrics**
   - Response times
   - Success/failure rates
   - Driver response times

## Future Improvements

1. **Payment Features**
   - Additional payment methods
   - Partial payments
   - Refund automation

2. **System Enhancements**
   - Real-time payment status updates
   - Advanced fraud detection
   - Automated reconciliation

## Troubleshooting Guide

1. **Common Issues**
   - Payment session timeout
   - Webhook failures
   - Driver notification delays

2. **Resolution Steps**
   - Session verification
   - Manual status checks
   - Support contact procedures