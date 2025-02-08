import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  DocumentArrowDownIcon,
  BellIcon,
  UserGroupIcon,
  MapPinIcon,
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';
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
  const [selectedDrivers, setSelectedDrivers] = useState(new Set());
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isAssignAreaModalOpen, setIsAssignAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [driverStats, setDriverStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    availableNow: 0
  });
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDriverDocs, setSelectedDriverDocs] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [documentStatus, setDocumentStatus] = useState({
    license: false,
    insurance: false,
    registration: false,
    profile_photo: false
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailedDriver, setDetailedDriver] = useState(null);
  const [isTripHistoryModalOpen, setIsTripHistoryModalOpen] = useState(false);
  const [driverTrips, setDriverTrips] = useState([]);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [driverMetrics, setDriverMetrics] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

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

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      const updatePromises = Array.from(selectedDrivers).map(id =>
        supabase
          .from('drivers')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );

      await Promise.all(updatePromises);
      toast.success(`Updated ${selectedDrivers.size} drivers to ${newStatus}`);
      setSelectedDrivers(new Set());
      fetchDrivers();
    } catch (error) {
      console.error('Error updating drivers:', error);
      toast.error('Failed to update drivers');
    }
  };

  const handleSendNotification = async () => {
    try {
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, user_id')
        .in('id', Array.from(selectedDrivers));

      // Create notifications for selected drivers
      const notificationPromises = drivers.map(driver =>
        supabase
          .from('notifications')
          .insert({
            user_id: driver.user_id,
            type: 'admin_message',
            message: notificationMessage,
            status: 'unread'
          })
      );

      await Promise.all(notificationPromises);
      toast.success('Notifications sent successfully');
      setIsNotifyModalOpen(false);
      setNotificationMessage('');
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error('Failed to send notifications');
    }
  };

  const handleAssignArea = async () => {
    try {
      const updatePromises = Array.from(selectedDrivers).map(id =>
        supabase
          .from('drivers')
          .update({ 
            service_area: selectedArea,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      );

      await Promise.all(updatePromises);
      toast.success('Service areas updated successfully');
      setIsAssignAreaModalOpen(false);
      setSelectedArea('');
      fetchDrivers();
    } catch (error) {
      console.error('Error updating service areas:', error);
      toast.error('Failed to update service areas');
    }
  };

  const fetchDriverStats = async () => {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_driver_statistics');
      
      if (error) throw error;
      setDriverStats(stats);
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };

  const handleVerifyDocuments = async (driverId) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          documents_verified: true,
          verification_notes: verificationNotes,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      // Create notification for the driver
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedDriverDocs.user_id,
          type: 'document_verified',
          message: 'Your documents have been verified successfully.',
          status: 'unread'
        });

      toast.success('Documents verified successfully');
      setIsDocumentModalOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error verifying documents:', error);
      toast.error('Failed to verify documents');
    }
  };

  const handleRejectDocuments = async (driverId) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          documents_verified: false,
          verification_notes: verificationNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      // Create notification for the driver
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedDriverDocs.user_id,
          type: 'document_rejected',
          message: `Your documents were rejected. Reason: ${verificationNotes}`,
          status: 'unread'
        });

      toast.success('Documents rejected');
      setIsDocumentModalOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error rejecting documents:', error);
      toast.error('Failed to reject documents');
    }
  };

  const handleViewDetails = async (driver) => {
    try {
      // Fetch comprehensive driver details
      const { data, error } = await supabase
        .from('driver_applications')
        .select(`
          *,
          driver:driver_id (
            id,
            status,
            documents_verified,
            license_expiry,
            notes,
            service_area,
            vehicle_details,
            rating
          ),
          trips (
            id,
            status,
            rating,
            created_at
          ),
          profiles (
            full_name,
            email,
            mobile_number,
            messenger_type,
            messenger_contact,
            avatar_url
          )
        `)
        .eq('id', driver.id)
        .single();

      if (error) throw error;
      
      // Open modal with detailed info
      setDetailedDriver(data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      toast.error('Failed to load driver details');
    }
  };

  const handleViewTrips = async (driver) => {
    try {
      // Fetch driver's trip history
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          bookings (
            from_location,
            to_location,
            service_type,
            total_amount,
            customer:customer_id (
              full_name
            )
          )
        `)
        .eq('driver_id', driver.driver.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDriverTrips(data);
      setIsTripHistoryModalOpen(true);
    } catch (error) {
      console.error('Error fetching trip history:', error);
      toast.error('Failed to load trip history');
    }
  };

  const handleViewPerformance = async (driver) => {
    try {
      // Fetch performance metrics
      const { data, error } = await supabase.rpc('get_driver_performance_metrics', {
        driver_id: driver.driver.id
      });

      if (error) throw error;

      // Calculate additional metrics
      const metrics = {
        ...data,
        completionRate: (data.completed_trips / data.total_trips) * 100,
        averageRating: data.total_rating / data.rated_trips,
        totalEarnings: data.total_earnings
      };

      setDriverMetrics(metrics);
      setIsPerformanceModalOpen(true);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      toast.error('Failed to load performance metrics');
    }
  };

  const handleSendMessage = async (driver) => {
    try {
      // Create notification for the driver
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: driver.user_id,
          type: 'admin_message',
          message: messageText,
          status: 'unread'
        });

      if (error) throw error;
      
      toast.success('Message sent successfully');
      setMessageText('');
      setIsMessageModalOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleResetPassword = async (driver) => {
    try {
      // Send password reset email through Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(
        driver.user.email,
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );
      
      if (error) throw error;
      
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const handleUpdateServiceArea = async (driver, area) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          service_area: area,
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.driver.id);

      if (error) throw error;
      
      toast.success('Service area updated successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error updating service area:', error);
      toast.error('Failed to update service area');
    }
  };

  const handleUpdateVehicle = async (driver, vehicleDetails) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          vehicle_details: vehicleDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.driver.id);

      if (error) throw error;
      
      toast.success('Vehicle details updated successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error updating vehicle details:', error);
      toast.error('Failed to update vehicle details');
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.driver?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const DriverActions = ({ driver }) => (
    <Menu as="div" className="relative">
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
        <Menu.Items 
          className={`
            absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 
            ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 z-[100]
            md:right-0 md:left-auto 
            sm:right-0 sm:left-auto
            ${window.innerWidth <= 640 ? 'fixed left-1/2 -translate-x-1/2 right-auto' : ''}
          `}
        >
          <div className="py-1">
            {/* View Details - Shows comprehensive profile */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleViewDetails(driver)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Full Details
                </button>
              )}
            </Menu.Item>

            {/* Trip History - Shows past trips and earnings */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleViewTrips(driver)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Trip History
                </button>
              )}
            </Menu.Item>

            {/* Performance - Shows ratings and metrics */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleViewPerformance(driver)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Performance Metrics
                </button>
              )}
            </Menu.Item>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Document Management */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => {
                    setSelectedDriverDocs(driver);
                    setIsDocumentModalOpen(true);
                  }}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-blue-700`}
                >
                  <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  Verify Documents
                </button>
              )}
            </Menu.Item>

            {/* Status Management */}
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

            {/* Communication */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    setIsMessageModalOpen(true);
                  }}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  const StatsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center">
          <UserGroupIcon className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Drivers</p>
            <p className="text-2xl font-semibold text-gray-900">{driverStats.total}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const BulkActionIndicator = () => (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-4 z-50">
      <span>{selectedDrivers.size} selected</span>
      <div className="h-4 w-px bg-gray-700" />
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleBulkStatusUpdate('active')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
        >
          <DocumentCheckIcon className="h-4 w-4 text-green-400" />
          <span>Activate</span>
        </button>
        <button
          onClick={() => handleBulkStatusUpdate('suspended')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
        >
          <XCircleIcon className="h-4 w-4 text-red-400" />
          <span>Suspend</span>
        </button>
        <button
          onClick={() => setIsNotifyModalOpen(true)}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
        >
          <BellIcon className="h-4 w-4 text-blue-400" />
          <span>Notify</span>
        </button>
        <button
          onClick={() => setIsAssignAreaModalOpen(true)}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800"
        >
          <MapPinIcon className="h-4 w-4 text-purple-400" />
          <span>Assign Area</span>
        </button>
      </div>
    </div>
  );

  const DocumentVerificationModal = () => (
    <Dialog 
      open={isDocumentModalOpen} 
      onClose={() => setIsDocumentModalOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-xl bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Document Verification - {selectedDriverDocs?.user?.full_name}
          </Dialog.Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Driver's License */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Driver's License</h3>
              {selectedDriverDocs?.license_url ? (
                <div className="space-y-2">
                  <img 
                    src={selectedDriverDocs.license_url} 
                    alt="License" 
                    className="w-full h-48 object-cover rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={documentStatus.license}
                      onChange={(e) => setDocumentStatus({
                        ...documentStatus,
                        license: e.target.checked
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Valid</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No license uploaded</div>
              )}
            </div>

            {/* Insurance Document */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Insurance</h3>
              {selectedDriverDocs?.insurance_url ? (
                <div className="space-y-2">
                  <img 
                    src={selectedDriverDocs.insurance_url} 
                    alt="Insurance" 
                    className="w-full h-48 object-cover rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={documentStatus.insurance}
                      onChange={(e) => setDocumentStatus({
                        ...documentStatus,
                        insurance: e.target.checked
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Valid</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No insurance uploaded</div>
              )}
            </div>

            {/* Verification Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add notes about the verification process..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDocumentModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRejectDocuments(selectedDriverDocs.driver.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Reject Documents
            </button>
            <button
              onClick={() => handleVerifyDocuments(selectedDriverDocs.driver.id)}
              disabled={!Object.values(documentStatus).every(Boolean)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Verify All Documents
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <div className="p-6">
      <StatsDashboard />
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

      <div className="mt-8">
        <div className="w-full">
          <div className="min-w-full align-middle">
            <div className="shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <div className="min-w-full">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading drivers...</div>
                ) : (
                  <>
                    {/* Desktop view */}
                    <table className="min-w-full divide-y divide-gray-300 hidden md:table">
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
                                <div className="flex justify-end">
                                  <DriverActions driver={driver} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile view */}
                    <div className="md:hidden">
                      {filteredDrivers.map((driver) => (
                        <div key={driver.id} className="bg-white p-4 border-b border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900">{driver.user?.full_name}</div>
                              <div className="text-sm text-gray-500">
                                Joined {new Date(driver.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <DriverActions driver={driver} />
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            <div>
                              <div className="text-sm font-medium text-gray-500">License Info</div>
                              <div className="text-sm text-gray-900">{driver.license_number}</div>
                              <div className="text-sm text-gray-900">
                                Expires: {new Date(driver.license_expiration).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-gray-500">Contact</div>
                              <div className="text-sm text-gray-900">{driver.user?.mobile_number}</div>
                              {driver.user?.messenger_contact && (
                                <div className="text-xs text-gray-500">
                                  {driver.user.messenger_type}: {driver.user.messenger_contact}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-gray-500">Status</div>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                STATUS_BADGES[driver.driver?.status]?.class
                              }`}>
                                {driver.driver?.status || 'pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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
      {selectedDrivers.size > 0 && <BulkActionIndicator />}
      <DocumentVerificationModal />
    </div>
  );
}