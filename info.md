# IslaGo - Technical Documentation

## Project Overview
IslaGo is a modern web application for van hire services in Palawan, Philippines, with plans for expansion to other islands. The platform connects travelers with van services, handling bookings, payments, and driver coordination.

## Tech Stack

### Frontend
- React (with Vite as build tool)
- TailwindCSS for styling
- Framer Motion for animations
- React Router for navigation
- i18n for internationalization (supports English, Spanish, Chinese)

### Backend
- Supabase for database and authentication
- Vercel for deployment and serverless functions
- Deno for some serverless functions

### External Services
- PayMongo for payment processing
- Twilio for SMS notifications
- Google Maps API for location services
- Resend for email notifications

## Key Features
1. Booking System
   - Multi-language support
   - Location selection with Google Maps integration
   - Date and time scheduling
   - Service type selection
   - Anonymous and authenticated bookings

2. Payment Processing
   - Integration with PayMongo
   - Multiple payment method support
   - Payment status tracking
   - Booking confirmation system

3. Driver Management
   - Driver notification system via Twilio
   - Driver response handling
   - Real-time status updates

4. User Management
   - Authentication (email, Google OAuth)
   - Profile management
   - Booking history
   - Avatar upload support

## Database Schema
The application uses Supabase with the following main tables:
- bookings
- customers
- drivers
- payments
- staff_roles
- driver_notification_logs

## Security Features
- Row Level Security (RLS) in Supabase
- Protected API routes
- Role-based access control (Admin, Staff, Driver, User)
- Secure file storage policies

## Environment Configuration
Required environment variables:
- Supabase credentials
- Twilio credentials
- PayMongo API keys
- Google Maps API key
- Resend API key

## Deployment
- Frontend: Vercel
- API Routes: Vercel Serverless Functions
- Database: Supabase
- File Storage: Supabase Storage

## Project Structure
project/
├── src/ # React application source
│ ├── components/ # React components
│ ├── contexts/ # React context providers
│ ├── utils/ # Utility functions
│ └── i18n/ # Internationalization files
├── api/ # Serverless API functions
├── supabase/ # Database migrations and functions
├── public/ # Static assets
└── dist/ # Production build output

## Development Workflow
1. Local Development
   - `npm run dev` - Runs development server
   - `vercel dev` - Runs Vercel development environment

2. Building
   - `npm run build` - Builds both web and API
   - `npm run build:web` - Builds just the web application

## Current Status
The project is in active development with ongoing features:
- Payment system enhancements
- Driver availability calendar
- Trip history improvements
- Image optimization implementation
- Migration tracking system

## Future Plans
- Expansion to other islands
- Enhanced driver management system
- Advanced booking analytics
- Mobile application development