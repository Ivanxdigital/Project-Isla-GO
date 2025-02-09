# IslaGo Project Analysis

## Project Overview
IslaGo is a modern web application focused on van hire services in Palawan, Philippines. The project is built with scalability and user experience in mind, featuring a comprehensive booking system, payment integration, and multi-language support.

## Tech Stack

### Frontend
- React (with Vite as build tool)
- TailwindCSS for styling
- Framer Motion for animations
- React Router for navigation
- i18n for internationalization

### Backend
- Supabase for database and authentication
- Vercel for serverless functions and hosting
- PostgreSQL as the database

### Third-Party Integrations
- PayMongo for payment processing
- Twilio for SMS notifications
- Google Maps API for location services
- Resend for email communications

## Current Functionality

### Core Features
1. **Booking System**
   - Van booking with location selection
   - Date and time scheduling
   - Multiple service types
   - Real-time availability checking

2. **Authentication**
   - Email/Password login
   - Google OAuth
   - Role-based access (Admin, Staff, Driver)

3. **Payment Processing**
   - PayMongo integration
   - Multiple payment methods
   - Payment status tracking

4. **Driver Management**
   - Driver notification system
   - Booking acceptance workflow
   - SMS-based communication

5. **Internationalization**
   - Multi-language support (English, Spanish, Chinese)
   - Dynamic content translation

### Database Structure
The application uses a complex database schema with key tables:
- bookings
- customers
- drivers
- payments
- staff_roles
- driver_notifications
- notification_logs

## Project Structure
project/
├── src/ # React application source
│ ├── components/ # React components
│ ├── contexts/ # Context providers
│ ├── utils/ # Utility functions
│ └── i18n/ # Internationalization
├── api/ # Vercel serverless functions
├── supabase/ # Database migrations and functions
└── public/ # Static assets


## Current Development Status
- Core booking functionality is implemented
- Payment integration is operational
- Driver notification system is in place
- Basic admin dashboard exists
- Multi-language support is implemented

## Security Measures
- Row Level Security (RLS) in Supabase
- Protected API routes
- Role-based access control
- Secure payment handling

## Areas for AI Context
1. **Database Schema**: Complex relationships between tables, especially for bookings and notifications

2. **API Structure**: 
   - RESTful endpoints for booking management
   - Webhook handlers for payment and SMS
   - Serverless function architecture

3. **Authentication Flow**:
   - Multiple auth contexts (User, Admin, Driver)
   - Session management
   - Role-based permissions

4. **Business Logic**:
   - Booking workflow
   - Payment processing
   - Driver notification system
   - Email/SMS communication

## Development Patterns
- Component-based architecture
- Context API for state management
- Serverless architecture
- Database-driven security policies

## Environmental Considerations
- Production vs Development environments
- API keys and sensitive data handling
- Cross-origin resource sharing setup
- Database connection pooling

## Configuration Files
The project includes several important configuration files:

1. **vite.config.js**
   - Development server configuration
   - Proxy settings for Supabase
   - Path aliases
   - Environment variable handling

2. **tailwind.config.js**
   - Custom color schemes
   - Animation configurations
   - Typography settings
   - Responsive design utilities

3. **vercel.json**
   - Deployment configuration
   - API routes
   - Build settings
   - Static file handling

4. **package.json**
   - Project dependencies
   - Build scripts
   - Development tools
   - Project metadata

## Environment Variables
The project uses various environment variables for:
- Supabase configuration
- Twilio integration
- Google Maps API
- PayMongo API keys
- Resend API configuration

## Deployment
The application is deployed using Vercel with:
- Automatic deployments from main branch
- Preview deployments for pull requests
- Environment-specific configurations
- Static asset optimization

## Database Schema

### Tables Overview

#### admin_access
- **user_id** (uuid, PK, FK)
  - References auth.users(id)
  - Not nullable
- **is_super_admin** (boolean)
  - Default: false
- **created_at** (timestamp with time zone)
  - Default: timezone('utc'::text, now())

#### bookings
- **id** (uuid, PK)
  - Default: uuid_generate_v4()
  - Not nullable
- **customer_id** (uuid, FK)
  - References customers(id)
- **user_id** (uuid, FK)
  - References auth.users(id)
- **from_location** (text)
  - Not nullable
- **to_location** (text)
  - Not nullable
- **departure_date** (date)
  - Not nullable
- **departure_time** (time without time zone)
  - Not nullable
- **return_date** (date)
- **return_time** (time without time zone)
- **service_type** (text)
  - Not nullable
- **group_size** (integer)
  - Not nullable
  - Precision: 32
- **payment_method** (text)
  - Not nullable
- **total_amount** (numeric)
  - Not nullable
  - Precision: 10, Scale: 2
- **payment_status** (text)
  - Not nullable
- **status** (text)
  - Not nullable
- **payment_session_id** (text)
- **created_at** (timestamp with time zone)
  - Default: now()
- **updated_at** (timestamp with time zone)
  - Default: now()
- **pickup_option** (text)
  - Default: 'airport'::text
  - Not nullable
- **hotel_pickup** (text)
- **hotel_details** (jsonb)
- **confirmation_email_sent** (boolean)
  - Default: false
- **confirmation_email_sent_at** (timestamp with time zone)
- **driver_assignment_email_sent** (boolean)
  - Default: false

### Key Relationships
1. **Bookings → Customers**
   - booking.customer_id → customers.id
   - Tracks which customer made the booking

2. **Bookings → Users**
   - booking.user_id → auth.users.id
   - Associates bookings with user accounts

3. **Bookings → Drivers**
   - booking.assigned_driver_id → drivers.id
   - Links bookings to assigned drivers

4. **Admin Access → Users**
   - admin_access.user_id → auth.users.id
   - Manages administrative privileges

### Constraints
1. **Primary Keys**
   - admin_access: user_id
   - bookings: id

2. **Foreign Keys**
   - Multiple foreign key constraints ensuring referential integrity
   - Relationships with auth.users, customers, and drivers tables

3. **Not Null Constraints**
   - Critical booking information (locations, dates, service details)
   - Payment and status information
   - User identification fields

### Data Types
1. **Date/Time**
   - timestamp with time zone: for created_at, updated_at fields
   - date: for departure and return dates
   - time without time zone: for specific time entries

2. **Numeric**
   - uuid: for unique identifiers
   - numeric(10,2): for monetary values
   - integer: for countable values

3. **Text/JSON**
   - text: for general string data
   - jsonb: for structured data (hotel_details)
   - boolean: for flags and status indicators

### Automated Fields
1. **Timestamps**
   - created_at: automatically set on record creation
   - updated_at: automatically updated on record modification

2. **Default Values**
   - UUID generation for IDs
   - Boolean flags defaulting to false
   - Pickup option defaulting to 'airport'

This schema supports the core functionality of the booking system while maintaining data integrity and providing flexibility for future extensions.

This documentation provides a comprehensive overview of the IslaGo project's current state and can be used as a reference for AI assistance in future development tasks.