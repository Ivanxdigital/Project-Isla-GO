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
import { DriverSidebarProvider } from './contexts/DriverSidebarContext.jsx';
import DriverSidebar from './components/DriverSidebar.jsx';

function RootLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';
  
  return (
    <Layout noTopPadding={isHomePage}>
      {!isAdminRoute && (
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname} type="fade">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      )}
      {isAdminRoute && <Outlet />}
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <ScrollToTop />
      <Sidebar />
      <main className="flex-1 w-full">
        <div className={isMobile ? "pt-16" : ""}>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <div className="p-4 md:p-6">
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
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollToTop />
      <NavigationMenu />
      <main className="flex-grow">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <DriverSidebar />
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
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
                <div className="flex min-h-screen bg-gray-50">
                  {/* Driver Sidebar - Only shown on driver pages */}
                  <Routes>
                    <Route path="/driver/*" element={<DriverSidebar />} />
                  </Routes>
                  
                  <div className="flex-1">
                    {!isAdminRoute && <NavigationMenu />}
                    <div className={!isAdminRoute ? "pt-16" : ""}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<CompleteRegisterPage />} />
                        <Route path="/driver/register" element={<PrivateRoute><DriverRegister /></PrivateRoute>} />
                        <Route path="/driver/RegistrationSuccess" element={<RegistrationSuccess />} />
                        <Route path="/payment/*" element={
                          <Routes>
                            <Route path="success" element={<PaymentSuccess />} />
                            <Route path="cancel" element={<PaymentCancel />} />
                          </Routes>
                        } />
                        <Route path="/manage-bookings" element={<ManageBookings />} />
                        <Route path="/driver-registration" element={<PrivateRoute><DriverRegistration /></PrivateRoute>} />
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
                        </Route>
                        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                        <Route path="/driver/before-register" element={<BeforeRegister />} />
                        <Route path="/driver/*" element={<DriverRoute><Outlet /></DriverRoute>}>
                          <Route index element={<DriverDashboard />} />
                          <Route path="dashboard" element={<DriverDashboard />} />
                          <Route path="profile" element={<DriverProfile />} />
                          <Route path="trips" element={<DriverTrips />} />
                          <Route path="availability" element={<DriverAvailability />} />
                          <Route path="test" element={<TestDashboard />} />
                        </Route>
                        <Route path="/auth/callback" element={<AuthCallback />} />
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
                      </Routes>
                    </div>
                    <Footer />
                  </div>
                </div>
              </DriverSidebarProvider>
            </DriverAuthProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;