// src/pages/driver/Trips.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { useDriverAuth } from '../../contexts/DriverAuthContext';

export default function DriverTrips() {
  const { user } = useAuth();
  const { loading: driverAuthLoading } = useDriverAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    if (driverAuthLoading) return;
    if (!user) return;

    fetchTrips();
  }, [user, filter, driverAuthLoading]);

  async function fetchTrips() {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('trip_assignments')
        .select(`
          *,
          bookings (
            id,
            from_location,
            to_location,
            departure_date,
            departure_time,
            return_date,
            return_time,
            service_type,
            group_size,
            status,
            total_amount
          ),
          vehicles (
            id,
            make,
            model,
            plate_number
          )
        `)
        .eq('driver_id', user.id);

      if (filter !== 'all') {
        query = query.eq('bookings.status', filter.toUpperCase());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || driverAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Trips</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {trips.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
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
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {trip.bookings.from_location} → {trip.bookings.to_location}
                        </p>
                        <p className="text-gray-500">
                          {trip.bookings.service_type} • {trip.bookings.group_size} passengers
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {new Date(trip.bookings.departure_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">
                          {trip.bookings.departure_time}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {trip.vehicles.make} {trip.vehicles.model}
                        </p>
                        <p className="text-gray-500">
                          {trip.vehicles.plate_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${trip.bookings.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          trip.bookings.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {trip.bookings.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No trips found.</p>
        </div>
      )}
    </div>
  );
}