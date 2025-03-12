// src/pages/driver/Trips.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { supabase } from '../../utils/supabase.ts';
import { useDriverAuth } from '../../contexts/DriverAuthContext.jsx';
import { format, parseISO } from 'date-fns';
import { UserGroupIcon, CalendarIcon, ClockIcon, MapPinIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function DriverTrips() {
  const { user } = useAuth();
  const { loading: driverAuthLoading } = useDriverAuth();
  const [trips, setTrips] = useState([]);
  const [groupedTrips, setGroupedTrips] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [vehicleDetails, setVehicleDetails] = useState(null);

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
    fetchDriverVehicle();
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

  // Fetch the driver's vehicle details
  async function fetchDriverVehicle() {
    if (!user) return;

    try {
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('vehicle_id')
        .eq('id', user.id)
        .single();

      if (driverError) {
        console.error('Error fetching driver data:', driverError);
        return;
      }

      if (driverData && driverData.vehicle_id) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', driverData.vehicle_id)
          .single();

        if (vehicleError) {
          console.error('Error fetching vehicle data:', vehicleError);
          return;
        }

        console.log('Driver vehicle:', vehicleData);
        // Ensure we have the correct field for seating capacity
        if (vehicleData && vehicleData.capacity && !vehicleData.seating_capacity) {
          vehicleData.seating_capacity = vehicleData.capacity;
        }
        setVehicleDetails(vehicleData);
      }
    } catch (error) {
      console.error('Error in fetchDriverVehicle:', error);
    }
  }

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
            total_amount,
            is_shared
          ),
          vehicle:vehicles (
            id,
            model,
            plate_number,
            seating_capacity,
            status
          )
        `)
        .eq('driver_id', user.id);

      // Apply filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('departure_time', { ascending: true });

      if (error) {
        console.error('Trips query error:', error.message);
        throw error;
      }

      console.log('Fetched trips:', data);
      
      // Group trips by date, time, and route for shared rides
      const grouped = groupTripsByDateTime(data || []);
      setGroupedTrips(grouped);
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Function to group trips by date, time, and route
  const groupTripsByDateTime = (trips) => {
    const grouped = {};
    
    trips.forEach(trip => {
      if (!trip.booking) return;
      
      // Only group shared rides
      if (trip.booking.service_type !== 'shared') {
        // For non-shared rides, use the trip ID as the key
        grouped[trip.id] = {
          date: trip.booking.departure_date,
          time: trip.booking.departure_time,
          from: trip.booking.from_location,
          to: trip.booking.to_location,
          isShared: false,
          trips: [trip],
          totalPassengers: trip.booking.group_size || 0,
          vehicle: trip.vehicle
        };
        return;
      }
      
      // For shared rides, create a key based on date, time, and route
      const key = `${trip.booking.departure_date}_${trip.booking.departure_time}_${trip.booking.from_location}_${trip.booking.to_location}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          date: trip.booking.departure_date,
          time: trip.booking.departure_time,
          from: trip.booking.from_location,
          to: trip.booking.to_location,
          isShared: true,
          trips: [],
          totalPassengers: 0,
          vehicle: trip.vehicle
        };
      }
      
      grouped[key].trips.push(trip);
      grouped[key].totalPassengers += (trip.booking.group_size || 0);
    });
    
    return grouped;
  };

  // Calculate remaining seats for a trip group
  const calculateRemainingSeats = (tripGroup) => {
    if (!tripGroup.vehicle || !tripGroup.vehicle.seating_capacity) {
      return vehicleDetails?.seating_capacity 
        ? vehicleDetails.seating_capacity - tripGroup.totalPassengers 
        : 'Unknown';
    }
    
    return Math.max(0, tripGroup.vehicle.seating_capacity - tripGroup.totalPassengers);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    try {
      // If it's a full ISO string, parse it
      if (timeString.includes('T')) {
        return format(parseISO(timeString), 'h:mm a');
      }
      
      // If it's just a time string like "14:30:00"
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

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

      {Object.keys(groupedTrips).length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(groupedTrips).map(([key, group]) => (
            <div key={key} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
                      {group.from} → {group.to}
                    </h2>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(group.date)}
                      <span className="mx-2">•</span>
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatTime(group.time)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {group.isShared && (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Shared Ride
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-end text-sm">
                      <UserGroupIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-700 font-medium">{group.totalPassengers} passengers</span>
                    </div>
                    {group.isShared && (
                      <div className="mt-1 flex items-center justify-end text-sm">
                        <TruckIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span className={`font-medium ${calculateRemainingSeats(group) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {calculateRemainingSeats(group)} seats remaining
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {group.trips.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {group.trips.length} {group.trips.length === 1 ? 'Booking' : 'Bookings'}
                    </h3>
                    <div className="space-y-3">
                      {group.trips.map((trip) => (
                        <div key={trip.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Booking #{trip.booking.id.substring(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {trip.booking.group_size} {trip.booking.group_size === 1 ? 'passenger' : 'passengers'}
                            </p>
                          </div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${trip.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {trip.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {group.vehicle && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <TruckIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{group.vehicle.model}</span>
                      <span className="mx-2">•</span>
                      <span>{group.vehicle.plate_number}</span>
                      <span className="mx-2">•</span>
                      <span>{group.vehicle.seating_capacity} seats total</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No trips found.</p>
        </div>
      )}
    </div>
  );
}