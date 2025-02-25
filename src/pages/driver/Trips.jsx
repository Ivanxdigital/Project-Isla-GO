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
    if (driverAuthLoading) {
      console.log('Driver auth still loading...');
      return;
    }
    if (!user) {
      console.log('No user found...');
      return;
    }

    console.log('Fetching trips for user:', user.id);
    console.log('Current filter:', filter);
    
    fetchTrips();
  }, [user, filter, driverAuthLoading]);

  useEffect(() => {
    const tripSubscription = supabase
      .channel('trips')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trip_assignments' },
        (payload) => {
          // Update trips in real-time
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      tripSubscription.unsubscribe();
    };
  }, []);

  async function fetchTrips() {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('trip_assignments')
        .select(`
          id,
          driver_id,
          booking_id,
          vehicle_id,
          departure_time,
          status,
          notes,
          created_at,
          updated_at,
          booking:bookings (
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
          vehicle:vehicles (
            id,
            model,
            plate_number,
            capacity,
            status
          )
        `)
        .eq('driver_id', user.id);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Trips query error:', error.message);
        throw error;
      }

      console.log('Fetched trips:', data);
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error.message);
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
                          {trip.booking?.from_location} → {trip.booking?.to_location}
                        </p>
                        <p className="text-gray-500">
                          {trip.booking?.service_type} • {trip.booking?.group_size} passengers
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {new Date(trip.departure_time).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">
                          {new Date(trip.departure_time).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {trip.vehicle ? (
                          <>
                            <p className="text-gray-900">
                              {trip.vehicle.model}
                            </p>
                            <p className="text-gray-500">
                              {trip.vehicle.plate_number}
                              {trip.vehicle.capacity && ` • ${trip.vehicle.capacity} seats`}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500 italic">No vehicle assigned</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${trip.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {trip.status.toUpperCase()}
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