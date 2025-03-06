import React, { Suspense, useState, useEffect } from 'react';
import { 
  useLocation, 
  Outlet,
  Link,
  Routes,
  Route
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AdminAuthProvider } from './contexts/AdminAuthContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AdminRoute, StaffRoute } from './components/auth/ProtectedRoutes.jsx';
import NavigationMenu from './components/NavigationMenu.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './components/HomePage.jsx';
import AboutPage from './components/AboutPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import PaymentSuccess from './components/PaymentSuccess.jsx';
import PaymentCancel from './components/PaymentCancel.jsx';
import LoginPage from './components/LoginPage.jsx';
import CompleteRegisterPage from './components/RegisterPage.jsx';
import ManageBookings from './components/ManageBookings.jsx';
import PageTransition from './components/PageTransition.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import AdminLoginPage from './pages/admin/LoginPage.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import BookingsPage from './pages/admin/BookingsPage.jsx';
import DriversPage from './pages/admin/DriversPage.jsx';
import VehiclesPage from './pages/admin/VehiclesPage.jsx';
import RoutesPage from './pages/admin/RoutesPage.jsx';
import AdminSettings from './pages/admin/Settings.jsx';
import { Toaster } from 'react-hot-toast';
import ProfilePage from './components/ProfilePage.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import DriverRegistration from './pages/DriverRegistration.jsx';
import DriverRegister from './pages/driver/Register.jsx';
import RegistrationSuccess from './pages/driver/RegistrationSuccess.jsx';
import { supabase } from './utils/supabase.ts';
import BeforeRegister from './pages/driver/BeforeRegister.jsx';
import DriverApplicationsPage from './pages/admin/DriverApplicationsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import { DriverAuthProvider } from './contexts/DriverAuthContext.jsx';
import DriverRoute from './components/auth/DriverRoute.jsx';
import DriverDashboard from './pages/driver/Dashboard.jsx';
import DriverProfile from './pages/driver/Profile.jsx';
import DriverTrips from './pages/driver/Trips.jsx';
import DriverAvailability from './pages/driver/Availability.jsx';
import AuthCallback from './components/AuthCallback.jsx';
import TestDashboard from './pages/driver/test.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Layout from './components/Layout.jsx';
import { DriverSidebarProvider, useDriverSidebar } from './contexts/DriverSidebarContext.jsx';
import DriverSidebar from './components/DriverSidebar.jsx';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import WhatsAppTest from './components/WhatsAppTest.jsx';

function RootLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';
  
  return (
    <Layout noTopPadding={isHomePage}>
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname} type="fade">
          <Outlet />
        </PageTransition>
      </AnimatePresence>
    </Layout>
  );
}

function AdminLayout() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <ScrollToTop />
      <Sidebar />
      <main className="flex-1 w-full flex flex-col bg-gray-100">
        <div className={isMobile ? "pt-16" : ""}>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <div className="p-0">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function DriverLayout() {
  const location = useLocation();
  const { isOpen, isMobile, closeSidebar, openSidebar } = useDriverSidebar();
  
  // Log state changes
  useEffect(() => {
    console.log('DriverLayout: isOpen state changed to', isOpen);
    console.log('DriverLayout: isMobile state is', isMobile);
  }, [isOpen, isMobile]);
  
  // Ensure sidebar is open on desktop when component mounts
  useEffect(() => {
    if (!isMobile) {
      console.log('DriverLayout: Desktop detected on mount, ensuring sidebar is open');
      openSidebar();
    }
  }, [isMobile, openSidebar]);
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <DriverSidebar />
      <div className="flex-1 flex flex-col">
        <NavigationMenu />
        <main className="flex-1 pt-16 px-4 sm:px-6 lg:px-8 pb-4 bg-gray-50 overflow-y-auto">
          {/* Mobile sidebar toggle button - always show on mobile */}
          {isMobile && (
            <button
              type="button"
              className="md:hidden fixed bottom-4 right-4 z-50 bg-ai-600 text-white p-3 rounded-full shadow-lg hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-ai-500 focus:ring-offset-2"
              onClick={() => {
                console.log('Toggle button clicked, current isOpen state:', isOpen);
                // Directly set the opposite of the current state
                if (isOpen) {
                  console.log('Closing sidebar');
                  closeSidebar();
                } else {
                  console.log('Opening sidebar');
                  openSidebar();
                }
              }}
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <div className="py-2">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDriverRoute = location.pathname.startsWith('/driver');
  // Special case for driver registration - we want to show the navigation menu here
  const isDriverRegistration = location.pathname === '/driver/register';
  
  // Check if the current route is handled by RootLayout
  const isRootLayoutRoute = location.pathname === '/' || 
                           location.pathname === '/about' || 
                           location.pathname === '/contact';
  
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AuthProvider>
          <AdminAuthProvider>
            <DriverAuthProvider>
              <DriverSidebarProvider>
                <Toaster position="top-right" />
                <Routes>
                  {/* Root layout routes */}
                  <Route path="/" element={<RootLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                  </Route>
                  
                  {/* Admin routes */}
                  <Route path="/admin/*" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="login" element={<AdminLoginPage />} />
                    <Route path="dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="settings" element={<AdminRoute allowNonAdmin={true}><AdminSettings /></AdminRoute>} />
                    <Route path="bookings" element={<AdminRoute><BookingsPage /></AdminRoute>} />
                    <Route path="drivers" element={<AdminRoute><DriversPage /></AdminRoute>} />
                    <Route path="vehicles" element={<AdminRoute><VehiclesPage /></AdminRoute>} />
                    <Route path="routes" element={<AdminRoute><RoutesPage /></AdminRoute>} />
                    <Route path="driver-applications" element={<AdminRoute><DriverApplicationsPage /></AdminRoute>} />
                    <Route path="whatsapp-test" element={<AdminRoute><WhatsAppTest /></AdminRoute>} />
                  </Route>
                  
                  {/* Driver routes */}
                  <Route path="/driver/*" element={<DriverLayout />}>
                    <Route index element={<DriverDashboard />} />
                    <Route path="dashboard" element={<DriverDashboard />} />
                    <Route path="profile" element={<DriverProfile />} />
                    <Route path="trips" element={<DriverTrips />} />
                    <Route path="availability" element={<DriverAvailability />} />
                    <Route path="test" element={<TestDashboard />} />
                  </Route>
                  
                  {/* Other routes wrapped in Layout */}
                  <Route element={<Layout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<CompleteRegisterPage />} />
                    <Route path="/payment/success" element={
                      <ErrorBoundary>
                        <PaymentSuccess />
                      </ErrorBoundary>
                    } />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route path="/manage-bookings" element={
                      <ErrorBoundary>
                        <PrivateRoute>
                          <ManageBookings />
                        </PrivateRoute>
                      </ErrorBoundary>
                    } />
                    <Route path="/driver-registration" element={<PrivateRoute><DriverRegistration /></PrivateRoute>} />
                    <Route path="/driver/register" element={<PrivateRoute><DriverRegister /></PrivateRoute>} />
                    <Route path="/driver/RegistrationSuccess" element={<RegistrationSuccess />} />
                    <Route path="/driver/before-register" element={<BeforeRegister />} />
                    <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/whatsapp-test" element={<WhatsAppTest />} />
                    <Route path="*" element={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8 text-center">
                          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Page Not Found
                          </h2>
                          <p className="mt-2 text-sm text-gray-600">
                            The page you're looking for doesn't exist or has been moved.
                          </p>
                          <div className="mt-5">
                            <Link
                              to="/"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Return to Home
                            </Link>
                          </div>
                        </div>
                      </div>
                    } />
                  </Route>
                </Routes>
              </DriverSidebarProvider>
            </DriverAuthProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;