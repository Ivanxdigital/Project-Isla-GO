import React, { Suspense } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  useLocation, 
  Outlet,
  Link
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
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
}

const routes = [
  {
    element: <RootLayout />,
    loader: () => {
      return null;
    },
    children: [
      {
        path: "/",
        element: <HomePage />
      },
      {
        path: "/about",
        element: <AboutPage />
      },
      {
        path: "/contact",
        element: <ContactPage />
      },
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        path: "/register",
        element: <CompleteRegisterPage />
      },
      {
        path: "/driver/register",
        element: (
          <PrivateRoute>
            <DriverRegister />
          </PrivateRoute>
        )
      },
      {
        path: "/driver/RegistrationSuccess",
        element: <RegistrationSuccess />
      },
      {
        path: "/payment",
        children: [
          {
            path: "success",
            element: <PaymentSuccess />
          },
          {
            path: "cancel",
            element: <PaymentCancel />
          }
        ]
      },
      {
        path: "/manage-bookings",
        element: <ManageBookings />
      },
      {
        path: "/driver-registration",
        element: (
          <PrivateRoute>
            <DriverRegistration />
          </PrivateRoute>
        )
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            path: "login",
            element: <AdminLoginPage />
          },
          {
            path: "dashboard",
            element: (
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            )
          },
          {
            path: "settings",
            element: (
              <AdminRoute allowNonAdmin={true}>
                <AdminSettings />
              </AdminRoute>
            )
          },
          {
            path: "bookings",
            element: (
              <AdminRoute>
                <BookingsPage />
              </AdminRoute>
            )
          },
          {
            path: "drivers",
            element: (
              <AdminRoute>
                <DriversPage />
              </AdminRoute>
            )
          },
          {
            path: "vehicles",
            element: (
              <AdminRoute>
                <VehiclesPage />
              </AdminRoute>
            )
          },
          {
            path: "routes",
            element: (
              <AdminRoute>
                <RoutesPage />
              </AdminRoute>
            )
          },
          {
            path: "driver-applications",
            element: (
              <AdminRoute>
                <DriverApplicationsPage />
              </AdminRoute>
            ),
          }
        ]
      },
      {
        path: "/profile",
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        )
      },
      {
        path: "/driver/before-register",
        element: <BeforeRegister />
      },
      {
        path: "/driver",
        element: <RootLayout />,
        errorElement: <ErrorBoundary />,
        children: [
          {
            path: "dashboard",
            element: (
              <DriverRoute>
                <DriverDashboard />
              </DriverRoute>
            ),
            errorElement: <ErrorBoundary />
          },
          {
            path: "profile",
            element: (
              <DriverRoute>
                <DriverProfile />
              </DriverRoute>
            )
          },
          {
            path: "trips",
            element: (
              <DriverRoute>
                <DriverTrips />
              </DriverRoute>
            )
          },
          {
            path: "availability",
            element: (
              <DriverRoute>
                <DriverAvailability />
              </DriverRoute>
            )
          },
          {
            path: "test",
            element: (
              <DriverRoute>
                <TestDashboard />
              </DriverRoute>
            )
          }
        ]
      },
      {
        path: "/auth/callback",
        element: <AuthCallback />
      },
      {
        path: "*",
        element: (
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
        )
      }
    ]
  }
];

const router = createBrowserRouter(routes);

function App() {
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
              <Toaster position="top-right" />
              <RouterProvider 
                router={router} 
                fallbackElement={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                } 
              />
            </DriverAuthProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;