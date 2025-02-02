// src/pages/driver/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { useDriverAuth } from '../../contexts/DriverAuthContext';

export default function DriverDashboard() {
  const { user } = useAuth();
  const { loading: driverAuthLoading } = useDriverAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    pendingTrips: 0
  });
  const [earnings, setEarnings] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    totalTrips: 0,
    rating: 0
  });

  useEffect(() => {
    if (driverAuthLoading) return;
    if (!user) return;

    let mounted = true;

    async function fetchDriverData() {
      try {
        const { data: tripData, error: tripError } = await supabase
          .from('trip_assignments')
          .select(`
            *,
            bookings (
              id,
              from_location,
              to_location,
              departure_date,
              departure_time,
              service_type,
              status
            ),
            vehicles (
              id,
              model,
              plate_number,
              capacity,
              status
            ),
            drivers (
              id,
              name,
              contact_number,
              license_number,
              status,
              license_expiry
            )
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (tripError) throw tripError;

        if (mounted) {
          // Calculate stats from the joined data
          const completed = tripData.filter(t => t.bookings?.status === 'COMPLETED').length;
          const pending = tripData.filter(t => t.bookings?.status === 'PENDING').length;

          setTrips(tripData);
          setStats({
            totalTrips: tripData.length,
            completedTrips: completed,
            pendingTrips: pending
          });
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        if (mounted) {
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    const fetchEarnings = async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('trip_assignments')
        .select(`
          *,
          bookings (
            total_amount,
            status,
            created_at
          )
        `)
        .eq('driver_id', user.id)
        .eq('bookings.status', 'COMPLETED');

      if (error) throw error;

      const calculateEarnings = (trips, startDate) => {
        return trips
          .filter(trip => new Date(trip.bookings.created_at) >= new Date(startDate))
          .reduce((sum, trip) => sum + (trip.bookings.total_amount * 0.8), 0); // Assuming 80% driver share
      };

      setEarnings({
        daily: calculateEarnings(data, today),
        weekly: calculateEarnings(data, weekAgo),
        monthly: calculateEarnings(data, monthAgo),
        totalTrips: data.length,
        rating: 4.5 // You'll need to implement actual rating calculation
      });
    };

    fetchDriverData();
    fetchEarnings();

    return () => {
      mounted = false;
    };
  }, [user, driverAuthLoading]);

  if (loading || driverAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
        {trips[0]?.drivers && (
          <div className="text-right">
            <h2 className="text-lg font-medium">{trips[0].drivers.name}</h2>
            <p className="text-sm text-gray-600">License: {trips[0].drivers.license_number}</p>
            <p className="text-sm text-gray-600">
              Expires: {new Date(trips[0].drivers.license_expiry).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Trips</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalTrips}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Completed Trips</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completedTrips}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Pending Trips</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingTrips}</p>
        </div>
      </div>

      {/* Recent Trips Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Trips</h2>
          {trips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {trip.bookings?.from_location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {trip.bookings?.to_location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {trip.bookings?.departure_date && new Date(trip.bookings.departure_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{trip.vehicles?.model}</p>
                          <p className="text-gray-500">{trip.vehicles?.plate_number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${trip.bookings?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                            trip.bookings?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {trip.bookings?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent trips found.</p>
          )}
        </div>
      </div>

      {/* Earnings Section */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Earnings</h2>
          {/* Add earnings content here */}
        </div>
      </div>
    </div>
  );
}