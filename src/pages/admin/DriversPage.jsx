import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase.js';
import { 
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BellIcon,
  MapPinIcon,
  UserGroupIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  PencilSquareIcon,
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
  active: { class: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircleIcon },
  inactive: { class: 'bg-gray-50 text-gray-600 ring-gray-500/20', icon: ClockIcon },
  suspended: { class: 'bg-red-50 text-red-700 ring-red-600/20', icon: XCircleIcon },
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your drivers and their status
            </p>
          </div>
          <button
            onClick={() => openDriverModal()}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Driver
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Drivers</p>
                <p className="text-2xl font-semibold text-gray-900">{driverStats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border-0 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 rounded-lg"
                  placeholder="Search drivers..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full py-2 px-3 border-0 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 rounded-lg"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={fetchDrivers}
                className="px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Drivers List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
              <p>Loading drivers...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredDrivers.map((driver) => {
                      const driverApp = driver.driver_applications?.[0];
                      const StatusIcon = STATUS_BADGES[driver.status]?.icon;
                      return (
                        <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">
                                  {driverApp?.full_name || `Driver ${driver.id.substring(0, 8)}`}
                                </div>
                                <div className="text-sm text-gray-500">ID: {driver.id.substring(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{driverApp?.email || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{driverApp?.mobile_number || driver.mobile_number || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driverApp?.vehicle_make || 'N/A'} {driverApp?.vehicle_model || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {driverApp?.vehicle_year || 'N/A'} • {driverApp?.plate_number || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${STATUS_BADGES[driver.status]?.class}`}>
                              {StatusIcon && <StatusIcon className="mr-1 h-4 w-4" />}
                              {driver.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(driver.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Menu as="div" className="relative inline-block text-left">
                              <Menu.Button className="p-2 rounded-full hover:bg-gray-50">
                                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
                              </Menu.Button>
                              <Transition
                                enter="transition duration-100 ease-out"
                                enterFrom="transform scale-95 opacity-0"
                                enterTo="transform scale-100 opacity-100"
                                leave="transition duration-75 ease-in"
                                leaveFrom="transform scale-100 opacity-100"
                                leaveTo="transform scale-95 opacity-0"
                              >
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleViewDetails(driver)}
                                          className={`${
                                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                          } flex w-full items-center px-4 py-2 text-sm`}
                                        >
                                          <EyeIcon className="mr-3 h-5 w-5 text-gray-400" />
                                          View Details
                                        </button>
                                      )}
                                    </Menu.Item>
                                    {driver.status !== 'active' && (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => updateDriverStatus(driver.id, 'active')}
                                            className={`${
                                              active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                            } flex w-full items-center px-4 py-2 text-sm`}
                                          >
                                            <CheckCircleIcon className="mr-3 h-5 w-5 text-emerald-400" />
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
                                          } flex w-full items-center px-4 py-2 text-sm`}
                                        >
                                          <TrashIcon className="mr-3 h-5 w-5 text-red-400" />
                                          Remove Driver
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredDrivers.map((driver) => {
                  const driverApp = driver.driver_applications?.[0];
                  const StatusIcon = STATUS_BADGES[driver.status]?.icon;
                  return (
                    <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              {driverApp?.full_name || `Driver ${driver.id.substring(0, 8)}`}
                            </div>
                            <div className="text-sm text-gray-500">{driverApp?.email || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{driverApp?.mobile_number || driver.mobile_number || 'N/A'}</div>
                          </div>
                        </div>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-2 rounded-full hover:bg-gray-100">
                            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400" />
                          </Menu.Button>
                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-in"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleViewDetails(driver)}
                                      className={`${
                                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                                      } flex w-full items-center px-4 py-2 text-sm`}
                                    >
                                      <EyeIcon className="mr-3 h-5 w-5 text-gray-400" />
                                      View Details
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500">Vehicle</div>
                          <div className="text-sm text-gray-900">
                            {driverApp?.vehicle_make || 'N/A'} {driverApp?.vehicle_model || ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            {driverApp?.vehicle_year || 'N/A'} • {driverApp?.plate_number || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Status</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${STATUS_BADGES[driver.status]?.class}`}>
                            {StatusIcon && <StatusIcon className="mr-1 h-4 w-4" />}
                            {driver.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDrivers.length === 0 && (
                <div className="p-8 text-center">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bulk Action Indicator */}
        {selectedDrivers.size > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-4 py-3 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <span className="text-sm font-medium text-gray-900">{selectedDrivers.size} selected</span>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('active')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('suspended')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircleIcon className="w-4 h-4 mr-1.5" />
                Suspend
              </button>
            </div>
          </div>
        )}

        {/* Keep existing modals but update their styling to match the new design */}
        {/* ... rest of the existing modal code ... */}
      </div>
    </div>
  );
}