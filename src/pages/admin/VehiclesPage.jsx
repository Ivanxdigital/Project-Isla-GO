import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase.ts';
import { toast } from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import AddVehicleModal from '../../components/vehicles/AddVehicleModal.jsx';
import EditVehicleModal from '../../components/vehicles/EditVehicleModal.jsx';
import { Dialog } from '@headlessui/react';

// Status badge configuration
const STATUS_BADGES = {
  active: { class: 'bg-green-50 text-green-700 ring-green-600/20', icon: CheckCircleIcon },
  maintenance: { class: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20', icon: WrenchScrewdriverIcon },
  out_of_service: { class: 'bg-red-50 text-red-700 ring-red-600/20', icon: XCircleIcon },
  reserved: { class: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: ClockIcon },
  // Handle the 'inactive' status from the existing enum by mapping it to out_of_service styling
  inactive: { class: 'bg-red-50 text-red-700 ring-red-600/20', icon: XCircleIcon },
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleStats, setVehicleStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    outOfService: 0
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map any vehicles with capacity to seating_capacity for consistency
      const mappedData = data?.map(vehicle => ({
        ...vehicle,
        // If seating_capacity is null but capacity exists, use capacity
        seating_capacity: vehicle.seating_capacity || vehicle.capacity || 0
      })) || [];
      
      setVehicles(mappedData);
      
      // Calculate stats - handle both 'out_of_service' and 'inactive' statuses
      const stats = {
        total: mappedData.length || 0,
        active: mappedData.filter(v => v.status === 'active').length || 0,
        maintenance: mappedData.filter(v => v.status === 'maintenance').length || 0,
        outOfService: mappedData.filter(v => v.status === 'out_of_service' || v.status === 'inactive').length || 0
      };
      
      setVehicleStats(stats);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchString = `${vehicle.make || ''} ${vehicle.model} ${vehicle.plate_number} ${vehicle.year || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleAddVehicle = (newVehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
    fetchVehicles(); // Refresh the list to update stats
  };

  const handleUpdateVehicle = (updatedVehicle) => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
    ));
    fetchVehicles(); // Refresh the list to update stats
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    
    setIsDeleting(true);
    
    try {
      // First check if vehicle is assigned to any driver
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('vehicle_assignments')
        .select('id')
        .eq('vehicle_id', selectedVehicle.id)
        .eq('is_current', true);
      
      if (assignmentError) throw assignmentError;
      
      if (assignmentData && assignmentData.length > 0) {
        toast.error('Cannot delete vehicle that is currently assigned to a driver');
        return;
      }
      
      // Delete vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', selectedVehicle.id);
      
      if (error) throw error;
      
      toast.success('Vehicle deleted successfully');
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== selectedVehicle.id));
      setIsDeleteModalOpen(false);
      fetchVehicles(); // Refresh the list to update stats
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          status,
          vehicle_id,
          profiles:user_id (
            first_name,
            last_name,
            email,
            mobile_number
          )
        `)
        .eq('status', 'active')
        .is('vehicle_id', null);
      
      if (error) throw error;
      
      setAvailableDrivers(data || []);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      toast.error('Failed to load available drivers');
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedVehicle || !selectedDriver) return;
    
    try {
      // Update driver with vehicle_id
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ vehicle_id: selectedVehicle.id })
        .eq('id', selectedDriver);
      
      if (driverError) throw driverError;
      
      // Create vehicle assignment record
      const { error: assignmentError } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: selectedVehicle.id,
          driver_id: selectedDriver,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_current: true
        });
      
      if (assignmentError) throw assignmentError;
      
      toast.success('Driver assigned successfully');
      setIsAssignDriverModalOpen(false);
      fetchVehicles(); // Refresh the list
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  return (
    <div className="px-0 py-6">
      <div className="px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold">Vehicles Management</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Vehicle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-blue-50 p-3">
                <span className="text-blue-700 text-xl">🚐</span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Vehicles</h3>
                <p className="text-2xl font-semibold text-gray-900">{vehicleStats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-50 p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active</h3>
                <p className="text-2xl font-semibold text-gray-900">{vehicleStats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-yellow-50 p-3">
                <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">In Maintenance</h3>
                <p className="text-2xl font-semibold text-gray-900">{vehicleStats.maintenance}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-red-50 p-3">
                <XCircleIcon className="h-6 w-6 text-red-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Out of Service</h3>
                <p className="text-2xl font-semibold text-gray-900">{vehicleStats.outOfService}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vehicles..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mt-4 md:mt-0 flex items-center">
                <span className="mr-2 text-sm text-gray-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="inactive">Inactive</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No vehicles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plate Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Maintenance
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => {
                    // Handle both status types (text and enum)
                    const status = vehicle.status || 'active';
                    const StatusIcon = STATUS_BADGES[status]?.icon;
                    return (
                      <tr key={vehicle.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.make || 'Unknown'} {vehicle.model}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehicle.year || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.plate_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.seating_capacity || vehicle.capacity || 'N/A'} seats</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${STATUS_BADGES[status]?.class}`}>
                            {StatusIcon && <StatusIcon className="mr-1 h-4 w-4" />}
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              fetchAvailableDrivers();
                              setIsAssignDriverModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVehicleAdded={handleAddVehicle}
      />

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        vehicle={selectedVehicle}
        onVehicleUpdated={handleUpdateVehicle}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                    Delete Vehicle
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this vehicle? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  onClick={handleDeleteVehicle}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      {/* Assign Driver Modal */}
      <Dialog
        open={isAssignDriverModalOpen}
        onClose={() => setIsAssignDriverModalOpen(false)}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                    Assign Driver to Vehicle
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Select a driver to assign to this vehicle.
                    </p>
                    
                    <div>
                      <label htmlFor="driver" className="block text-sm font-medium text-gray-700">
                        Driver
                      </label>
                      <select
                        id="driver"
                        name="driver"
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select Driver</option>
                        {availableDrivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.profiles?.first_name} {driver.profiles?.last_name} - {driver.profiles?.mobile_number}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                  onClick={handleAssignDriver}
                  disabled={!selectedDriver}
                >
                  Assign
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setIsAssignDriverModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}