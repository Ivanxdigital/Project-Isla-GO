import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';

const STATUS_BADGES = {
  active: { class: 'bg-green-100 text-green-800', icon: CheckBadgeIcon },
  inactive: { class: 'bg-gray-100 text-gray-800', icon: ClockIcon },
  suspended: { class: 'bg-red-100 text-red-800', icon: XCircleIcon },
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data: applications, error: applicationsError } = await supabase
        .from('driver_applications')
        .select(`
          *,
          driver:driver_id (
            id,
            status,
            documents_verified,
            license_expiry,
            notes
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      console.log('Fetched applications:', applications);

      // Get user profiles in a separate query
      if (applications?.length) {
        const userIds = applications.map(app => app.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        console.log('Fetched profiles:', profiles);

        // Merge the profile data with applications
        const driversWithProfiles = applications.map(app => ({
          ...app,
          user: profiles.find(p => p.id === app.user_id)
        }));

        console.log('Merged data:', driversWithProfiles);
        setDrivers(driversWithProfiles);
      } else {
        setDrivers([]);
      }

    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const updateDriverStatus = async (driverId, newStatus) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;
      
      toast.success(`Driver status updated to ${newStatus}`);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.driver?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const DriverActions = ({ driver }) => (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-2 hover:bg-gray-100 rounded-full">
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {driver.driver?.status !== 'active' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => updateDriverStatus(driver.driver.id, 'active')}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex w-full items-center px-4 py-2 text-sm text-green-700`}
                  >
                    <CheckBadgeIcon className="h-4 w-4 mr-2" />
                    Activate Driver
                  </button>
                )}
              </Menu.Item>
            )}
            {driver.driver?.status !== 'suspended' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => updateDriverStatus(driver.driver.id, 'suspended')}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex w-full items-center px-4 py-2 text-sm text-red-700`}
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Suspend Driver
                  </button>
                )}
              </Menu.Item>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
          >
            Export Drivers
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="relative w-full sm:w-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="Search drivers..."
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading drivers...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Driver
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        License Info
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contact
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredDrivers.map((driver) => {
                      const StatusIcon = STATUS_BADGES[driver.driver?.status]?.icon;
                      return (
                        <tr key={driver.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">{driver.user?.full_name}</div>
                            <div className="text-gray-500">Joined {new Date(driver.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>{driver.license_number}</div>
                            <div>Expires: {new Date(driver.license_expiration).toLocaleDateString()}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div>{driver.user?.mobile_number}</div>
                            {driver.user?.messenger_contact && (
                              <div className="text-xs">
                                {driver.user.messenger_type}: {driver.user.messenger_contact}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[driver.driver?.status]?.class}`}>
                              {StatusIcon && <StatusIcon className="mr-1 h-4 w-4" />}
                              {driver.driver?.status || 'pending'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <DriverActions driver={driver} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {!loading && filteredDrivers.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-500">No drivers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}