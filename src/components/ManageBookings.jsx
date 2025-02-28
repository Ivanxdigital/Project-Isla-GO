import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

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

  useEffect(() => {
    if (user) {
      fetchBookings();
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

      // Fetch the bookings for the logged-in user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('departure_date', { ascending: true });

      if (bookingsError) throw bookingsError;

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

      // Combine bookings with their payments
      const bookingsWithPayments = bookingsData.map(booking => ({
        ...booking,
        payment: paymentsData?.find(payment => payment.booking_id === booking.id) || null
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Your Bookings</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`${
                activeTab === 'upcoming'
                  ? 'border-ai-500 text-ai-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
            >
              Upcoming Bookings ({bookings.upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`${
                activeTab === 'past'
                  ? 'border-ai-500 text-ai-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium`}
            >
              Past Bookings ({bookings.past.length})
            </button>
          </nav>
        </div>

        {/* Bookings Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p><strong>Hotel:</strong> {booking.hotel_details.name}</p>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-0">{booking.hotel_details.address}</p>
                      </div>
                      <p className="mt-2 sm:mt-0 sm:ml-4 text-sm whitespace-nowrap">
                        <strong>Pickup:</strong> {hotelPickupTime}
                        <span className="text-xs text-gray-500 block sm:inline sm:ml-1">
                          (be ready by {readyByTime})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Map Section */}
                  {mapUrl && (
                    <div className="relative rounded-lg overflow-hidden bg-gray-100">
                      {/* Aspect ratio container for consistent height */}
                      <div className="aspect-w-16 aspect-h-9 sm:aspect-h-7">
                        <img 
                          src={mapUrl}
                          alt={`Map showing ${booking.hotel_details.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Map Controls */}
                      <div className="absolute bottom-2 right-2 flex space-x-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${booking.hotel_details.location.lat},${booking.hotel_details.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium text-white bg-black/75 rounded-full hover:bg-black/90 transition-colors flex items-center space-x-1"
                        >
                          <span>Open in Maps</span>
                          {/* Optional: Add an external link icon */}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={booking.id}
                className="bg-gray-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                  <div className="w-full sm:w-auto mb-2 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.from_location} → {booking.to_location}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(booking.departure_date), 'MMM d, yyyy')} at {booking.departure_time.slice(0, 5)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Service: {booking.service_type}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
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

                <div className="space-y-2 mt-4 sm:flex sm:space-y-0 sm:space-x-2">
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

        {/* Empty State */}
        {bookings[activeTab].length === 0 && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming bookings."
                : "You don't have any past bookings."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
