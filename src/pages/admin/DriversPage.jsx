import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase.js';
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
  KeyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  IdentificationIcon,
  TruckIcon,
  ShieldCheckIcon,
  BanknotesIcon
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
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [driverFormData, setDriverFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    license_number: '',
    license_expiration: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    plate_number: '',
    insurance_provider: '',
    policy_number: '',
    policy_expiration: '',
    bank_name: '',
    account_number: '',
    account_holder: ''
  });

  useEffect(() => {
    fetchDrivers();
    fetchDriverStats();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      // First, get all drivers with their basic information
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          *,
          driver_applications:driver_applications!left(
            full_name,
            email,
            mobile_number,
            license_number,
            license_expiration,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            plate_number,
            insurance_provider,
            policy_number,
            policy_expiration,
            bank_name,
            account_number,
            account_holder
          )
        `)
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      console.log('Fetched drivers:', driversData);
      setDrivers(driversData || []);
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
      // Get total drivers count
      const { data: totalData, error: totalError } = await supabase
        .from('drivers')
        .select('id', { count: 'exact' });
      
      if (totalError) throw totalError;

      // Get active drivers count
      const { data: activeData, error: activeError } = await supabase
        .from('drivers')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Get suspended drivers count
      const { data: suspendedData, error: suspendedError } = await supabase
        .from('drivers')
        .select('id', { count: 'exact' })
        .eq('status', 'suspended');

      if (suspendedError) throw suspendedError;

      // Get available drivers count
      const { data: availableData, error: availableError } = await supabase
        .from('drivers')
        .select('id', { count: 'exact' })
        .eq('is_available', true)
        .eq('status', 'active');

      if (availableError) throw availableError;

      setDriverStats({
        total: totalData.length || 0,
        active: activeData.length || 0,
        suspended: suspendedData.length || 0,
        availableNow: availableData.length || 0
      });
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      toast.error('Failed to load driver statistics');
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
      // Fetch driver details directly without trips
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driver.id)
        .single();

      if (error) throw error;
      
      // Get the driver application data from the current driver object
      const driverApp = driver.driver_applications?.[0];
      
      // Set the detailed driver data combining both sources
      setDetailedDriver({
        id: data.id,
        full_name: driverApp?.full_name || data.name || 'N/A',
        email: driverApp?.email || data.email || 'N/A',
        mobile_number: driverApp?.mobile_number || data.mobile_number || 'N/A',
        status: data.status,
        license_number: driverApp?.license_number || data.license_number || 'N/A',
        license_expiration: driverApp?.license_expiration || data.license_expiry || 'N/A',
        documents_verified: data.documents_verified,
        service_types: data.service_types || [],
        current_location: data.current_location,
        is_available: data.is_available,
        vehicle_make: driverApp?.vehicle_make || 'N/A',
        vehicle_model: driverApp?.vehicle_model || 'N/A',
        vehicle_year: driverApp?.vehicle_year || 'N/A',
        plate_number: driverApp?.plate_number || 'N/A'
      });
      
      // Open modal with detailed info
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

  const handleAddDriver = async () => {
    try {
      // First check if user already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', driverFormData.email)
        .single();

      let userId;

      if (existingUser) {
        // User exists, check if they're already a driver
        const { data: existingDriver, error: driverCheckError } = await supabase
          .from('driver_applications')
          .select('id, status')
          .eq('user_id', existingUser.id)
          .single();

        if (driverCheckError && driverCheckError.code !== 'PGRST116') {
          throw driverCheckError;
        }

        if (existingDriver) {
          if (existingDriver.status === 'approved') {
            toast.error('This user is already registered as a driver');
            return;
          } else if (existingDriver.status === 'rejected') {
            toast.error('This user\'s previous driver application was rejected');
            return;
          }
        }

        userId = existingUser.id;

        // Update existing profile
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            first_name: driverFormData.first_name,
            last_name: driverFormData.last_name,
            mobile_number: driverFormData.mobile_number,
          })
          .eq('id', userId);

        if (profileUpdateError) throw profileUpdateError;

      } else {
        // Create new user if they don't exist
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: driverFormData.email,
          password: Math.random().toString(36).slice(-8), // Generate random password
        });

        if (userError) throw userError;

        userId = userData.user.id;

        // Create profile for new user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: driverFormData.first_name,
            last_name: driverFormData.last_name,
            email: driverFormData.email,
            mobile_number: driverFormData.mobile_number,
          });

        if (profileError) throw profileError;
      }

      // Create driver application (auto-approved since it's admin creating)
      const { data: applicationData, error: applicationError } = await supabase
        .from('driver_applications')
        .insert({
          user_id: userId,
          full_name: `${driverFormData.first_name} ${driverFormData.last_name}`,
          email: driverFormData.email,
          mobile_number: driverFormData.mobile_number,
          license_number: driverFormData.license_number,
          license_expiration: driverFormData.license_expiration,
          vehicle_make: driverFormData.vehicle_make,
          vehicle_model: driverFormData.vehicle_model,
          vehicle_year: parseInt(driverFormData.vehicle_year),
          plate_number: driverFormData.plate_number,
          insurance_provider: driverFormData.insurance_provider,
          policy_number: driverFormData.policy_number,
          policy_expiration: driverFormData.policy_expiration,
          bank_name: driverFormData.bank_name,
          account_number: driverFormData.account_number,
          account_holder: driverFormData.account_holder,
          status: 'approved'
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Create driver record
      const { error: driverError } = await supabase
        .from('drivers')
        .insert({
          user_id: userId,
          status: 'active',
          documents_verified: true
        });

      if (driverError) throw driverError;

      toast.success('Driver added successfully');
      setIsDriverModalOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error adding driver:', error);
      toast.error('Failed to add driver');
    }
  };

  const handleEditDriver = async () => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: driverFormData.first_name,
          last_name: driverFormData.last_name,
          mobile_number: driverFormData.mobile_number,
        })
        .eq('id', detailedDriver.user_id);

      if (profileError) throw profileError;

      // Update driver application
      const { error: applicationError } = await supabase
        .from('driver_applications')
        .update({
          full_name: `${driverFormData.first_name} ${driverFormData.last_name}`,
          mobile_number: driverFormData.mobile_number,
          license_number: driverFormData.license_number,
          license_expiration: driverFormData.license_expiration,
          vehicle_make: driverFormData.vehicle_make,
          vehicle_model: driverFormData.vehicle_model,
          vehicle_year: parseInt(driverFormData.vehicle_year),
          plate_number: driverFormData.plate_number,
          insurance_provider: driverFormData.insurance_provider,
          policy_number: driverFormData.policy_number,
          policy_expiration: driverFormData.policy_expiration,
          bank_name: driverFormData.bank_name,
          account_number: driverFormData.account_number,
          account_holder: driverFormData.account_holder,
        })
        .eq('id', detailedDriver.id);

      if (applicationError) throw applicationError;

      toast.success('Driver updated successfully');
      setIsDriverModalOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to remove this driver? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      toast.success('Driver removed successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Failed to remove driver');
    }
  };

  const openDriverModal = (driver = null) => {
    if (driver) {
      setIsEditMode(true);
      setDriverFormData({
        first_name: driver.user?.first_name || '',
        last_name: driver.user?.last_name || '',
        email: driver.email || '',
        mobile_number: driver.mobile_number || '',
        license_number: driver.license_number || '',
        license_expiration: driver.license_expiration || '',
        vehicle_make: driver.vehicle_make || '',
        vehicle_model: driver.vehicle_model || '',
        vehicle_year: driver.vehicle_year?.toString() || '',
        plate_number: driver.plate_number || '',
        insurance_provider: driver.insurance_provider || '',
        policy_number: driver.policy_number || '',
        policy_expiration: driver.policy_expiration || '',
        bank_name: driver.bank_name || '',
        account_number: driver.account_number || '',
        account_holder: driver.account_holder || ''
      });
    } else {
      setIsEditMode(false);
      setDriverFormData({
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        license_number: '',
        license_expiration: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        plate_number: '',
        insurance_provider: '',
        policy_number: '',
        policy_expiration: '',
        bank_name: '',
        account_number: '',
        account_holder: ''
      });
    }
    setIsDriverModalOpen(true);
  };

  const filteredDrivers = drivers.filter(driver => {
    const driverApp = driver.driver_applications?.[0];
    const driverName = driverApp?.full_name || '';
    const driverEmail = driverApp?.email || '';
    const driverPhone = driverApp?.mobile_number || driver.mobile_number || '';
    const driverId = driver.id?.toString() || '';
    const userId = driver.user_id?.toString() || '';
    
    const searchFields = [driverName, driverEmail, driverPhone, driverId, userId].map(field => 
      field.toLowerCase()
    );
    
    const matchesSearch = searchTerm === '' || 
      searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const DriverActions = ({ driver }) => (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
          <span className="sr-only">Open options</span>
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

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
            {driver.status !== 'active' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => updateDriverStatus(driver.id, 'active')}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } flex w-full px-4 py-2 text-sm`}
                  >
                    <CheckBadgeIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Activate Driver
                  </button>
                )}
              </Menu.Item>
            )}

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleDeleteDriver(driver.id)}
                  className={`${
                    active ? 'bg-red-50 text-red-900' : 'text-red-700'
                  } flex w-full px-4 py-2 text-sm`}
                >
                  <TrashIcon className="mr-3 h-5 w-5 text-red-400" aria-hidden="true" />
                  Remove Driver
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleViewDetails(driver)}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } flex w-full px-4 py-2 text-sm`}
                >
                  <EyeIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  View Details
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
              onClick={() => handleRejectDocuments(selectedDriverDocs.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Reject Documents
            </button>
            <button
              onClick={() => handleVerifyDocuments(selectedDriverDocs.id)}
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
    <div className="relative">
      <div className="min-h-screen bg-gray-100">
        <div className="px-6 pt-20">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Drivers</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage your drivers and their status.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                onClick={() => openDriverModal()}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Driver
              </button>
            </div>
          </div>

          <StatsDashboard />

          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search by name, email, phone, or ID"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                <select
                  id="status-filter"
                  name="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              <div className="w-full md:w-auto flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
                
                <button
                  type="button"
                  onClick={fetchDrivers}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh
                </button>
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
                      <div>
                        {/* Desktop view */}
                        <table className="min-w-full divide-y divide-gray-300 hidden md:table">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                Driver Name
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Contact Info
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Vehicle Details
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Status
                              </th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Created At
                              </th>
                              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredDrivers.map((driver) => {
                              const StatusIcon = STATUS_BADGES[driver.status]?.icon;
                              const driverApp = driver.driver_applications?.[0];
                              return (
                                <tr key={driver.id}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="font-medium text-gray-900">
                                      {driverApp?.full_name || `Driver ${driver.id.substring(0, 8)}`}
                                    </div>
                                    <div className="text-gray-500">ID: {driver.id}</div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <div>{driverApp?.email || 'N/A'}</div>
                                    <div>{driverApp?.mobile_number || driver.mobile_number || 'N/A'}</div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <div>{driverApp?.vehicle_make || 'N/A'} {driverApp?.vehicle_model || ''}</div>
                                      <div className="text-xs text-gray-400">
                                        Year: {driverApp?.vehicle_year || 'N/A'} • Plate: {driverApp?.plate_number || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[driver.status]?.class}`}>
                                        {StatusIcon && <StatusIcon className="mr-1 h-4 w-4" />}
                                        {driver.status || 'pending'}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {new Date(driver.created_at).toLocaleDateString()}
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
                          {filteredDrivers.map((driver) => {
                            const driverApp = driver.driver_applications?.[0];
                            return (
                              <div key={driver.id} className="bg-white p-4 border-b border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {driverApp?.full_name || `Driver ${driver.id.substring(0, 8)}`}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {driverApp?.email || 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {driverApp?.mobile_number || driver.mobile_number || 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-2">
                                      Vehicle: {driverApp?.vehicle_make || 'N/A'} {driverApp?.vehicle_model || ''}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Year: {driverApp?.vehicle_year || 'N/A'} • Plate: {driverApp?.plate_number || 'N/A'}
                                    </div>
                                  </div>
                                  <DriverActions driver={driver} />
                                </div>
                                
                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    STATUS_BADGES[driver.status]?.class
                                  }`}>
                                    {driver.status || 'pending'}
                                  </span>
                                  <div className="text-sm text-gray-500">
                                    Created: {new Date(driver.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {filteredDrivers.length === 0 && (
                          <div className="text-center py-10">
                            <p className="text-sm text-gray-500">No drivers found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {selectedDrivers.size > 0 && <BulkActionIndicator />}
        </div>
      </div>

      {/* Modals */}
      <DocumentVerificationModal />
      
      {/* Message Modal */}
      <Dialog 
        open={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full rounded-xl bg-white p-6">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Send Message to Driver
            </Dialog.Title>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Type your message here..."
              />
              <p className="mt-2 text-sm text-gray-500">
                This message will be sent as a notification to the driver.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSendMessage(detailedDriver);
                  setIsMessageModalOpen(false);
                }}
                disabled={!messageText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Driver Details Modal */}
      <Dialog 
        open={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Driver Details
              </Dialog.Title>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {detailedDriver && (
              <div className="space-y-8">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-base text-gray-900">{detailedDriver.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base text-gray-900">{detailedDriver.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mobile Number</p>
                      <p className="text-base text-gray-900">{detailedDriver.mobile_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className={`text-base ${
                        detailedDriver.status === 'active' ? 'text-green-600' : 
                        detailedDriver.status === 'suspended' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {detailedDriver.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setMessageText('');
                        setIsMessageModalOpen(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                      Send Message
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        openDriverModal(detailedDriver);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Details
                    </button>
                    
                    {detailedDriver.status === 'active' ? (
                      <button
                        onClick={() => {
                          updateDriverStatus(detailedDriver.id, 'suspended');
                          setIsDetailModalOpen(false);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                      >
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Suspend Driver
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updateDriverStatus(detailedDriver.id, 'active');
                          setIsDetailModalOpen(false);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckBadgeIcon className="h-4 w-4 mr-2" />
                        Activate Driver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add/Edit Driver Modal */}
      <Dialog
        open={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center sm:p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

          <div className="relative bg-white w-full sm:rounded-xl shadow-2xl sm:max-w-3xl sm:mx-4 h-full sm:h-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900">
                    {isEditMode ? 'Edit Driver' : 'Add New Driver'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEditMode ? 'Update driver information' : 'Enter driver details to create a new account'}
                  </p>
                </div>
                <button
                  onClick={() => setIsDriverModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-16rem)]">
              <div className="space-y-6 sm:space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={driverFormData.first_name}
                        onChange={(e) => setDriverFormData({...driverFormData, first_name: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="John"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={driverFormData.last_name}
                        onChange={(e) => setDriverFormData({...driverFormData, last_name: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Doe"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={driverFormData.email}
                        onChange={(e) => setDriverFormData({...driverFormData, email: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={driverFormData.mobile_number}
                        onChange={(e) => setDriverFormData({...driverFormData, mobile_number: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* License Information Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <IdentificationIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    License Information
                  </h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input
                        type="text"
                        value={driverFormData.license_number}
                        onChange={(e) => setDriverFormData({...driverFormData, license_number: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="DL12345678"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Expiration</label>
                      <input
                        type="date"
                        value={driverFormData.license_expiration}
                        onChange={(e) => setDriverFormData({...driverFormData, license_expiration: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make</label>
                      <input
                        type="text"
                        value={driverFormData.vehicle_make}
                        onChange={(e) => setDriverFormData({...driverFormData, vehicle_make: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Toyota"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                      <input
                        type="text"
                        value={driverFormData.vehicle_model}
                        onChange={(e) => setDriverFormData({...driverFormData, vehicle_model: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Camry"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Year</label>
                      <input
                        type="number"
                        value={driverFormData.vehicle_year}
                        onChange={(e) => setDriverFormData({...driverFormData, vehicle_year: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="2023"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                      <input
                        type="text"
                        value={driverFormData.plate_number}
                        onChange={(e) => setDriverFormData({...driverFormData, plate_number: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="ABC123"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Information Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        value={driverFormData.insurance_provider}
                        onChange={(e) => setDriverFormData({...driverFormData, insurance_provider: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Insurance Company"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                      <input
                        type="text"
                        value={driverFormData.policy_number}
                        onChange={(e) => setDriverFormData({...driverFormData, policy_number: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="POL123456789"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policy Expiration</label>
                      <input
                        type="date"
                        value={driverFormData.policy_expiration}
                        onChange={(e) => setDriverFormData({...driverFormData, policy_expiration: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Banking Information Section */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <BanknotesIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Banking Information
                  </h3>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={driverFormData.bank_name}
                        onChange={(e) => setDriverFormData({...driverFormData, bank_name: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Bank Name"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={driverFormData.account_number}
                        onChange={(e) => setDriverFormData({...driverFormData, account_number: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="000123456789"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={driverFormData.account_holder}
                        onChange={(e) => setDriverFormData({...driverFormData, account_holder: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 z-10 bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-100">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={isEditMode ? handleEditDriver : handleAddDriver}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isEditMode ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}