# IslaGO Components Documentation

## Core Architecture

### Layout & Structure
#### Layout.jsx
Primary layout wrapper that provides the basic structure for all pages.
- Manages the consistent layout across the application
- Includes NavigationMenu and Footer
- Handles top padding configuration
- Props:
  - `children`: React nodes to render
  - `noTopPadding`: Boolean to control top spacing

#### NavigationMenu.jsx
Main navigation component with responsive design.
- Features:
  - Responsive mobile menu
  - User authentication status
  - Dynamic navigation links
  - Profile dropdown
  - Language selector integration
  - Admin/Driver role-based menu items
- State Management:
  - User authentication status
  - Mobile menu state
  - Profile dropdown state
- Key Functions:
  - handleSignOut
  - handleMobileMenuToggle
  - renderProfileDropdown

### Authentication System

#### AuthCallback.jsx
Handles OAuth authentication callbacks and user profile creation.
- Manages:
  - OAuth redirect handling
  - User profile creation
  - Session verification
  - Error handling
  - Redirect logic
- Integration with:
  - Supabase authentication
  - User profiles database
  - Navigation system

#### LoginPage.jsx
User authentication interface.
- Features:
  - Email/password login
  - Google OAuth integration
  - Form validation
  - Error handling
  - Loading states
  - Remember me functionality
- State Management:
  - Form data
  - Loading states
  - Error messages
  - Authentication status

#### RegisterPage.jsx
New user registration interface.
- Features:
  - Email/password registration
  - Personal information collection
  - Form validation
  - Age verification
  - Terms acceptance
- Data Collection:
  - Email
  - Password
  - Full name
  - Date of birth
  - Mobile number
  - Messenger contact

### Booking System

#### BookingForm.jsx
Complex multi-step booking form.
- Features:
  - Multi-step form process
  - Location selection
  - Date/time picking
  - Service type selection
  - Passenger information
  - Price calculation
  - Payment integration
- State Management:
  - Form data across steps
  - Validation states
  - Price calculations
  - Loading states
- Integrations:
  - Payment gateway
  - Google Places API
  - Date/time handling

#### HotelAutocomplete.jsx
Google Places integration for hotel selection.
- Features:
  - Google Places API integration
  - Location autocomplete
  - Custom styling
  - Error handling
  - Loading states
- Props:
  - onSelect: Callback function
  - defaultValue: Initial value

#### ManageBookings.jsx
Booking management interface.
- Features:
  - Booking list view
  - Filtering options
  - Booking details
  - Cancellation handling
  - Status updates
- Data Display:
  - Booking details
  - Payment status
  - Trip information
  - Driver details

### Payment Processing

#### PaymentOptions.jsx
Payment method selection interface.
- Options:
  - Online payment (GCash/Credit Card)
  - Cash payment
- Features:
  - Visual selection
  - Payment method validation
  - Dynamic pricing display

#### PaymentSuccess.jsx
Payment confirmation handling.
- Features:
  - Payment verification
  - Success message display
  - Booking confirmation
  - Email notification trigger
- Integration:
  - Payment gateway verification
  - Booking status updates

### Landing Page Components

#### HeroSection.jsx
Main landing page hero component.
- Features:
  - Animated text
  - Background effects
  - Call-to-action buttons
  - Responsive design
- Animations:
  - Text fade-in
  - Background parallax
  - Button hover effects

#### WhyIslaGO.jsx
Features and benefits showcase.
- Sections:
  - Key benefits
  - Destination highlights
  - Service features
- Components:
  - Feature cards
  - Destination grid
  - Animated elements

#### ReviewsSection.jsx
Customer testimonials display.
- Features:
  - Auto-rotating reviews
  - Star ratings
  - Customer photos
  - Location information
- Animation:
  - Smooth transitions
  - Fade effects

### User Profile Management

#### ProfilePage.jsx
User profile management interface.
- Features:
  - Personal information editing
  - Avatar upload
  - Password change
  - Contact information
  - Preferences management
- Data Management:
  - Form validation
  - Image upload
  - Profile updates
  - Error handling

### Admin Interface

#### Sidebar.jsx
Admin dashboard navigation.
- Features:
  - Navigation menu
  - Active state tracking
  - Icon integration
  - Responsive design
- Menu Items:
  - Dashboard
  - Bookings
  - Drivers
  - Vehicles
  - Routes
  - Settings

### Utility Components

#### ErrorBoundary.jsx
Error handling wrapper component.
- Features:
  - Error catching
  - Fallback UI
  - Error logging
  - Recovery options

#### BeforeUnload.jsx
Form navigation protection.
- Features:
  - Unsaved changes detection
  - Navigation warning
  - Configurable messages

#### LanguageSelector.jsx
Language switching component.
- Features:
  - Multiple language support
  - Persistent selection
  - Dynamic translation loading
- Supported Languages:
  - English
  - Español
  - 中文
  - 한국어
  - Polski

## Technical Implementation Details

### State Management
- React Hooks for local state
- Context API for global state
- Supabase real-time subscriptions

### API Integrations
- Supabase Authentication
- Google Places API
- Payment Gateway
- Email Service

### Performance Optimization
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

### Security Measures
- Input validation
- XSS prevention
- CSRF protection
- Authentication checks

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

### Testing Considerations
- Unit tests
- Integration tests
- E2E testing
- Performance monitoring 