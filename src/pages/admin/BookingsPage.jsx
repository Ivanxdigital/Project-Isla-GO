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
  ExclamationTriangleIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  XCircleIcon,
  ClockIcon
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
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    from_location: '',
    to_location: '',
    departure_date: '',
    departure_time: '',
    return_date: '',
    return_time: '',
    service_type: 'one_way',
    group_size: 1,
    payment_method: 'cash',
    total_amount: 0,
    payment_status: 'pending',
    status: 'pending',
    pickup_option: 'airport'
  });

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

  const handleBookingSelect = (bookingId) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
    }
  };

  const handleMultiDelete = async () => {
    try {
      setIsProcessing(true);
      const deletePromises = Array.from(selectedBookings).map(id =>
        supabase
          .from('bookings')
          .delete()
          .eq('id', id)
      );

      await Promise.all(deletePromises);
      
      toast.success(`${selectedBookings.size} bookings deleted successfully`);
      setIsMultiDeleteModalOpen(false);
      setSelectedBookings(new Set());
      fetchBookings();
    } catch (error) {
      console.error('Error deleting bookings:', error);
      toast.error('Failed to delete bookings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddBooking = async () => {
    try {
      setIsProcessing(true);
      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Booking added successfully');
      setIsAddModalOpen(false);
      setNewBooking({
        from_location: '',
        to_location: '',
        departure_date: '',
        departure_time: '',
        return_date: '',
        return_time: '',
        service_type: 'one_way',
        group_size: 1,
        payment_method: 'cash',
        total_amount: 0,
        payment_status: 'pending',
        status: 'pending',
        pickup_option: 'airport'
      });
      fetchBookings();
    } catch (error) {
      console.error('Error adding booking:', error);
      toast.error('Failed to add booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      setIsProcessing(true);
      const updatePromises = Array.from(selectedBookings).map(id =>
        supabase
          .from('bookings')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );

      await Promise.all(updatePromises);
      toast.success(`Updated ${selectedBookings.size} bookings to ${newStatus}`);
      setSelectedBookings(new Set());
      fetchBookings();
    } catch (error) {
      console.error('Error updating bookings:', error);
      toast.error('Failed to update bookings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportSelected = () => {
    const selectedBookingsData = bookings.filter(booking => 
      selectedBookings.has(booking.id)
    );

    // Create CSV content
    const csvContent = [
      // CSV Headers
      ['Booking ID', 'Customer', 'From', 'To', 'Date', 'Status', 'Amount'].join(','),
      // CSV Data
      ...selectedBookingsData.map(booking => [
        booking.id,
        getCustomerFullName(booking.customers),
        booking.from_location,
        booking.to_location,
        formatDateTime(booking.departure_date, booking.departure_time),
        booking.status,
        booking.total_amount
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const AddBookingModal = () => (
    <Dialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Add New Booking
          </Dialog.Title>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">From Location</label>
                <input
                  type="text"
                  value={newBooking.from_location}
                  onChange={(e) => setNewBooking({...newBooking, from_location: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {/* Add more form fields for other booking details */}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBooking}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {isProcessing ? 'Adding...' : 'Add Booking'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const MultiDeleteModal = () => (
    <Dialog open={isMultiDeleteModalOpen} onClose={() => setIsMultiDeleteModalOpen(false)}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
            Delete Selected Bookings
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete {selectedBookings.size} selected bookings? This action cannot be undone.
            </p>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsMultiDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleMultiDelete}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {isProcessing ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const SelectionIndicator = () => (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-4 z-50">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={selectedBookings.size === filteredBookings.length}
          onChange={handleSelectAll}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>{selectedBookings.size} selected</span>
      </div>
      <div className="h-4 w-px bg-gray-700" />
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleBulkStatusUpdate('completed')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
          disabled={isProcessing}
        >
          <DocumentCheckIcon className="h-4 w-4 text-green-400" />
          <span>Complete</span>
        </button>
        <button
          onClick={() => handleBulkStatusUpdate('cancelled')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
          disabled={isProcessing}
        >
          <XCircleIcon className="h-4 w-4 text-red-400" />
          <span>Cancel</span>
        </button>
        <button
          onClick={() => handleBulkStatusUpdate('pending')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
          disabled={isProcessing}
        >
          <ClockIcon className="h-4 w-4 text-yellow-400" />
          <span>Pending</span>
        </button>
        <button
          onClick={handleExportSelected}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
        >
          <DocumentArrowDownIcon className="h-4 w-4 text-blue-400" />
          <span>Export</span>
        </button>
        <button
          onClick={() => setIsMultiDeleteModalOpen(true)}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
          disabled={isProcessing}
        >
          <TrashIcon className="h-4 w-4 text-red-400" />
          <span>Delete</span>
        </button>
      </div>
      <div className="h-4 w-px bg-gray-700" />
      <button
        onClick={() => setSelectedBookings(new Set())}
        className="text-gray-400 hover:text-white"
      >
        Clear
      </button>
    </div>
  );

  return (
    <div className="px-0 py-6">
      <div className="px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Manage Bookings</h1>
          <div className="flex space-x-2">
            {selectedBookings.size > 0 && (
              <button
                onClick={() => setIsMultiDeleteModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Selected ({selectedBookings.size})
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Booking
            </button>
          </div>
        </div>

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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={selectedBookings.size === filteredBookings.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
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
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBookings.has(booking.id)}
                            onChange={() => handleBookingSelect(booking.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
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

        {selectedBookings.size > 0 && <SelectionIndicator />}

        <EditBookingModal />
        <DeleteConfirmationModal />
        <AddBookingModal />
        <MultiDeleteModal />
      </div>
    </div>
  );
}