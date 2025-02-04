import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  // Add more status colors as needed
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [sortField, sortDirection, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            mobile_number,
            messenger_type,
            messenger_contact
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return '-';
    const dateObj = new Date(date + ' ' + (time || '00:00'));
    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getCustomerFullName = (customer) => {
    if (!customer) return '-';
    return `${customer.first_name} ${customer.last_name}`;
  };

  const getCustomerContact = (customer) => {
    if (!customer) return '-';
    return (
      <div>
        <div>{customer.mobile_number}</div>
        {customer.messenger_contact && (
          <div className="text-xs">
            {customer.messenger_type}: {customer.messenger_contact}
          </div>
        )}
      </div>
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchString = searchTerm.toLowerCase();
    const customerName = getCustomerFullName(booking.customers).toLowerCase();
    return (
      customerName.includes(searchString) ||
      booking.customers?.mobile_number?.toLowerCase().includes(searchString) ||
      booking.from_location?.toLowerCase().includes(searchString) ||
      booking.to_location?.toLowerCase().includes(searchString) ||
      booking.payment_session_id?.toLowerCase().includes(searchString)
    );
  });

  const SortIcon = ({ field }) => {
    if (field !== sortField) return <ChevronDownIcon className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 text-blue-600" />
    );
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success(`Booking ${newStatus} successfully`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Booking deleted successfully');
      setIsDeleteModalOpen(false);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBooking = async (bookingId, updatedData) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('bookings')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Booking updated successfully');
      setIsEditModalOpen(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const BookingActions = ({ booking }) => (
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setIsEditModalOpen(true);
                  }}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Booking
                </button>
              )}
            </Menu.Item>

            {booking.status !== 'completed' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex w-full items-center px-4 py-2 text-sm text-green-700`}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </button>
                )}
              </Menu.Item>
            )}

            {booking.status !== 'cancelled' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex w-full items-center px-4 py-2 text-sm text-red-700`}
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </button>
                )}
              </Menu.Item>
            )}

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setIsDeleteModalOpen(true);
                  }}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-red-700`}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Booking
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  const EditBookingModal = () => (
    <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Edit Booking
          </Dialog.Title>
          {/* Add your edit form here */}
          {/* Include fields for updating booking details */}
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const DeleteConfirmationModal = () => (
    <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
          <div className="flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          <Dialog.Title className="text-lg font-medium text-center leading-6 text-gray-900 mb-4">
            Delete Booking
          </Dialog.Title>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Are you sure you want to delete this booking? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteBooking(selectedBooking.id)}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bookings Management</h1>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 text-sm leading-6"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm leading-6"
              placeholder="Search bookings..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center">Loading bookings...</div>
          ) : (
            <div className="min-w-full">
              <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Booking Date</span>
                        <SortIcon field="created_at" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getCustomerFullName(booking.customers)}</div>
                        <div className="text-sm text-gray-500">{getCustomerContact(booking.customers)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>From: {booking.from_location}</div>
                          <div>To: {booking.to_location}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <div>Departure: {formatDateTime(booking.departure_date, booking.departure_time)}</div>
                          {booking.return_date && (
                            <div>Return: {formatDateTime(booking.return_date, booking.return_time)}</div>
                          )}
                          {booking.pickup_option === 'hotel' && booking.hotel_details && (
                            <div className="mt-1 text-xs">
                              <div>Hotel: {booking.hotel_details.name}</div>
                              <div className="text-gray-400">{booking.hotel_details.address}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.service_type}</div>
                        <div className="text-sm text-gray-500">Group Size: {booking.group_size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(booking.total_amount)}</div>
                        <div className="text-sm text-gray-500">
                          {booking.payment_method}
                          {booking.payment_session_id && (
                            <div className="text-xs">Ref: {booking.payment_session_id}</div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{booking.payment_status}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <BookingActions booking={booking} />
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="md:hidden">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900">{getCustomerFullName(booking.customers)}</div>
                      <div className="text-sm text-gray-500">{getCustomerContact(booking.customers)}</div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-900">
                        <div className="mb-1">From: {booking.from_location}</div>
                        <div>To: {booking.to_location}</div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <div>Departure: {formatDateTime(booking.departure_date, booking.departure_time)}</div>
                        {booking.return_date && (
                          <div>Return: {formatDateTime(booking.return_date, booking.return_time)}</div>
                        )}
                        {booking.pickup_option === 'hotel' && booking.hotel_details && (
                          <div className="mt-1 text-xs">
                            <div>Hotel: {booking.hotel_details.name}</div>
                            <div className="text-gray-400">{booking.hotel_details.address}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-900">{booking.service_type}</div>
                      <div className="text-sm text-gray-500">Group Size: {booking.group_size}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(booking.total_amount)}</div>
                      <div className="text-sm text-gray-500">
                        {booking.payment_method}
                        {booking.payment_session_id && (
                          <div className="text-xs">Ref: {booking.payment_session_id}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{booking.payment_status}</div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <BookingActions booking={booking} />
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No bookings found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <EditBookingModal />
      <DeleteConfirmationModal />
    </div>
  );
}