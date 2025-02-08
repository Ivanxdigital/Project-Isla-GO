import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation, Outlet, Link, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, StaffRoute } from './components/auth/ProtectedRoutes';
import NavigationMenu from './components/NavigationMenu';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import LoginPage from './components/LoginPage';
import CompleteRegisterPage from './components/RegisterPage';
import ManageBookings from './components/ManageBookings';
import PageTransition from './components/PageTransition';
import AdminLoginPage from './pages/admin/LoginPage';
import AdminDashboard from './pages/admin/Dashboard';
import BookingsPage from './pages/admin/BookingsPage';
import DriversPage from './pages/admin/DriversPage';
import VehiclesPage from './pages/admin/VehiclesPage';
import RoutesPage from './pages/admin/RoutesPage';
import AdminSettings from './pages/admin/Settings';
import { Toaster } from 'react-hot-toast';
import ProfilePage from './components/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import DriverRegistration from './pages/DriverRegistration';
import DriverRegister from './pages/driver/Register';
import RegistrationSuccess from './pages/driver/RegistrationSuccess';
import UserRegistration from './components/UserRegistration';
import { supabase } from './utils/supabase';
import BeforeRegister from './pages/driver/BeforeRegister';
import DriverApplicationsPage from './pages/admin/DriverApplicationsPage';
import Sidebar from './components/Sidebar';
import { DriverAuthProvider } from './contexts/DriverAuthContext';
import DriverRoute from './components/auth/DriverRoute';
import DriverDashboard from './pages/driver/Dashboard';
import DriverProfile from './pages/driver/Profile';
import DriverTrips from './pages/driver/Trips';
import DriverAvailability from './pages/driver/Availability';
import AuthCallback from './components/AuthCallback';
import TestDashboard from './pages/driver/test';
import ErrorBoundary from './components/ErrorBoundary';

function RootLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <>
      <NavigationMenu />
      <main className="min-h-screen relative pt-16">
        {!isAdminRoute && (
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname} type="fade">
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        )}
        {isAdminRoute && <Outlet />}
      </main>
      <Footer />
    </>
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
    loader: async () => {
      // You can add any initial data loading here
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
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <AdminAuthProvider>
          <DriverAuthProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" reverseOrder={false} />
          </DriverAuthProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </Suspense>
  );
}

export default App;