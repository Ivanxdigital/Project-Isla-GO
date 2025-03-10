import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../utils/supabase.ts';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useLocation, Link } from 'react-router-dom';

// Helper function to compute the hotel pickup time based on the departure time and an offset (default is 60 minutes)
function getHotelPickupTime(departureTime, offset = 60) {
  // Expect departureTime in "HH:MM" or "HH:MM:SS" format – we take the first 5 characters for consistency.
  const timeStr = departureTime.slice(0, 5);
  const [hour, minute] = timeStr.split(':').map(Number);
  let computedHour = hour - Math.floor(offset / 60);
  let computedMinute = minute - (offset % 60);
  if (computedMinute < 0) {
    computedMinute += 60;
    computedHour -= 1;
  }
  return `${computedHour.toString().padStart(2, '0')}:${computedMinute.toString().padStart(2, '0')}`;
}

// Helper function to subtract minutes from a time string ("HH:MM") and return the result in the same format.
function subtractMinutes(timeStr, minutesToSubtract) {
  const [hour, minute] = timeStr.split(':').map(Number);
  let newHour = hour;
  let newMinute = minute - minutesToSubtract;
  if (newMinute < 0) {
    newMinute += 60;
    newHour -= 1;
  }
  return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
}

// Add this helper function at the top with other helpers
const getStaticMapUrl = (location) => {
  if (!location || !location.lat || !location.lng) return null;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=600x300&scale=2&markers=color:red%7C${location.lat},${location.lng}&key=${apiKey}`;
};

export default function ManageBookings() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Debug state removed

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
      setError('Please log in to view your bookings.');
    }
  }, [user]);

  // Add effect to handle success message
  useEffect(() => {
    if (location.state?.message) {
      toast[location.state.type || 'success'](location.state.message);
      // Clear the message from location state to prevent showing it again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // Fetch the bookings for the logged-in user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('departure_date', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      // Fetch related payments (if any)
      const bookingIds = bookingsData.map(booking => booking.id);
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('booking_id', bookingIds);

      if (paymentsError) {
        console.warn('Error fetching payments:', paymentsError);
        // Continue without payments data
      }

      // Fetch driver information for bookings with assigned drivers
      const bookingsWithDrivers = bookingsData.filter(booking => booking.assigned_driver_id);
      const driverIds = bookingsWithDrivers.map(booking => booking.assigned_driver_id);
      
      let driversData = [];
      if (driverIds.length > 0) {
        const { data: fetchedDriversData, error: driversError } = await supabase
          .from('drivers')
          .select('id, name, contact_number, photo_url')
          .in('id', driverIds);
          
        if (driversError) {
          console.warn('Error fetching drivers:', driversError);
        } else {
          driversData = fetchedDriversData || [];
        }
      }

      // Combine bookings with their payments and driver information
      const bookingsWithPayments = bookingsData.map(booking => ({
        ...booking,
        payment: paymentsData?.find(payment => payment.booking_id === booking.id) || null,
        driver: booking.assigned_driver_id ? driversData.find(driver => driver.id === booking.assigned_driver_id) || null : null
      }));

      const now = new Date();
      const sortedBookings = {
        upcoming: [],
        past: []
      };

      bookingsWithPayments.forEach(booking => {
        const departureDate = new Date(booking.departure_date);
        if (departureDate >= now) {
          sortedBookings.upcoming.push(booking);
        } else {
          sortedBookings.past.push(booking);
        }
      });

      setBookings(sortedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    // Confirm cancellation
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const loadingToast = toast.loading('Cancelling your booking...');

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('user_id', user.id); // Safety check

      if (error) throw error;

      toast.dismiss(loadingToast);
      toast.success('Booking cancelled successfully');
      await fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel booking. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Your Bookings</h1>
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">Please log in to view your bookings.</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Debug panel removed */}
      
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Manage Your Bookings</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`${
                activeTab === 'upcoming'
                  ? 'border-ai-500 text-ai-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base`}
            >
              Upcoming ({bookings.upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`${
                activeTab === 'past'
                  ? 'border-ai-500 text-ai-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm sm:text-base`}
            >
              Past ({bookings.past.length})
            </button>
          </nav>
        </div>

        {/* Show message if no bookings */}
        {bookings[activeTab].length === 0 && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">
              {activeTab === 'upcoming' 
                ? 'You have no upcoming bookings.' 
                : 'You have no past bookings.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book a Trip
              </Link>
            )}
          </div>
        )}

        {/* Bookings Grid */}
        {bookings[activeTab].length > 0 && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {bookings[activeTab].map((booking) => {
              // For hotel pickups, compute the pickup time (default offset: 60 minutes) 
              // and a "ready by" time (10 minutes earlier)
              let hotelPickupDisplay = null;
              if (booking.pickup_option === 'hotel' && booking.hotel_details && booking.departure_time) {
                const departureTimeStr = booking.departure_time.slice(0, 5);
                const hotelPickupTime = getHotelPickupTime(departureTimeStr, 60);
                const readyByTime = subtractMinutes(hotelPickupTime, 10);
                const mapUrl = getStaticMapUrl(booking.hotel_details.location);
                
                hotelPickupDisplay = (
                  <div className="mt-4 space-y-3">
                    {/* Hotel Info Section */}
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col space-y-2">
                        <div>
                          <p><strong>Hotel:</strong> {booking.hotel_details.name}</p>
                          <p className="text-xs text-gray-500 mt-1 break-words">{booking.hotel_details.address}</p>
                        </div>
                        <div className="flex items-center">
                          <p className="text-sm">
                            <strong>Pickup:</strong> {hotelPickupTime}
                          </p>
                          <span className="text-xs text-gray-500 ml-2">
                            (be ready by {readyByTime})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Map Section */}
                    {mapUrl && (
                      <div className="relative rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={mapUrl} 
                          alt="Hotel location map" 
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            console.error('Error loading map image');
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={booking.id}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start mb-4">
                    <div className="w-full">
                      <h3 className="text-lg font-semibold text-gray-900 break-words">
                        {booking.from_location} → {booking.to_location}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(booking.departure_date), 'MMM d, yyyy')} at {booking.departure_time.slice(0, 5)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Service: {booking.service_type}
                      </p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(booking.status)} mt-2 sm:mt-0`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p>Group Size: {booking.group_size}</p>
                    <p>Amount: ₱{parseFloat(booking.total_amount).toLocaleString()}</p>
                    <p>Payment Status: {booking.payment_status}</p>
                    {booking.payment && (
                      <p>Payment Provider: {booking.payment.provider}</p>
                    )}
                  </div>

                  {hotelPickupDisplay}
                  
                  {/* Display driver information if a driver is assigned */}
                  {booking.status === 'driver_assigned' && booking.driver && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <h4 className="font-medium text-green-800 mb-2">Driver Assigned</h4>
                      <div className="flex items-center">
                        {booking.driver.photo_url ? (
                          <img 
                            src={booking.driver.photo_url} 
                            alt={booking.driver.name} 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3"
                            onError={(e) => {
                              e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.driver.name);
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-500 text-lg">{booking.driver.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="font-medium truncate">{booking.driver.name}</p>
                          {booking.driver.contact_number && (
                            <p className="text-sm text-gray-600 truncate">
                              Contact: {booking.driver.contact_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                    <button 
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-ai-600 bg-ai-50 rounded-md hover:bg-ai-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500 transition-colors duration-200"
                    >
                      View Details
                    </button>
                    {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
