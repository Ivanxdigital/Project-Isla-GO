# IslaGO Project Overview

## Tech Stack Overview

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with PostCSS
- **UI Components**: 
  - Headless UI (@headlessui/react)
  - Heroicons (@heroicons/react)
  - Radix UI components
- **Animation**: Framer Motion
- **Form Handling**: React Hook Form
- **Calendar**: FullCalendar integration
- **Notifications**: React Hot Toast
- **Internationalization**: i18next

### Backend & Infrastructure
- **Database & Auth**: Supabase
- **API Platform**: Vercel Serverless Functions
- **SMS Integration**: Twilio
- **Payment Processing**: PayMongo
- **Email Services**: 
  - EmailJS
  - Resend
- **AI Integration**: OpenAI

## Key Features
- Van booking and rental system
- Multi-language support
- Real-time calendar management
- SMS notifications for drivers
- Secure payment processing
- Email communications
- Responsive design
- User authentication
- Admin dashboard

## Key Directories & Files

### Frontend Structure
- `/src/components/` - React components including:
  - `BookingForm.jsx` - Main booking interface
  - `ManageBookings.jsx` - Booking management
  - `NavigationMenu.jsx` - Site navigation
  - `PaymentSuccess.jsx` - Payment confirmation
  - `HeroSection.jsx` - Landing page hero section

### API Endpoints
- `/api/send-driver-sms.ts` - SMS notifications to drivers
- `/api/handle-driver-response.ts` - Driver response handling
- `/api/twilio-webhook.ts` - Twilio webhook handler

### Configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.env` & `.env.local` - Environment variables
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite configuration

## Development Scripts
- `npm run dev` - Start development server
- `npm run vercel-dev` - Start Vercel development environment
- `npm run build` - Build production bundle
- `npm run build:web` - Build web assets with 404 page
- `npm run build:api` - Build API endpoints
- `npm run lint` - Run ESLint

## Architecture Overview

The application follows a modern JAMstack architecture:
1. **Frontend Layer**: React-based SPA with client-side routing
2. **API Layer**: Serverless functions on Vercel
3. **Database Layer**: Supabase for data persistence and real-time features
4. **External Services**:
   - Twilio for SMS
   - PayMongo for payments
   - EmailJS/Resend for emails
   - OpenAI for AI features

## Security & Performance
- Environment variables for sensitive data
- API key management
- Optimized builds with Vite
- Modern bundle splitting
- Responsive image optimization
- Client-side caching strategies

## Deployment
- Production deployment via Vercel
- Automatic builds and deployments
- Environment-specific configurations
- Static asset optimization

## Important Notes for AI Context
1. This is a production application for van rental services in Palawan, Philippines
2. The system handles real-time bookings, payments, and communications
3. Multi-language support is crucial for international tourists
4. Mobile-first design approach
5. Integration with local payment systems through PayMongo
6. SMS communication is vital for driver coordination
7. Real-time calendar management for booking availability

## Future Considerations
- Expansion to other islands
- Enhanced driver management features
- Advanced analytics and reporting
- Dynamic pricing system
- In-app chat functionality
- Loyalty program implementation 