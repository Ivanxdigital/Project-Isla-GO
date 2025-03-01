// src/pages/driver/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { supabase } from '../../utils/supabase.js';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon, 
  IdentificationIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  CameraIcon,
  DocumentTextIcon,
  StarIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

// Import Shadcn UI components
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Card, CardHeader, CardContent, CardFooter } from "../../components/ui/card.jsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs.jsx";
import { cn } from "../../lib/utils.js";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://achpbaomhjddqycgzomw.supabase.co';

export default function DriverProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [stats, setStats] = useState({
    totalTrips: 0,
    rating: 0,
    completionRate: 0
  });
  const [availability, setAvailability] = useState([]);
  
  const [formData, setFormData] = useState({
    contact_number: '',
    emergency_contact: '',
    preferred_areas: [],
    vehicle_details: {
      model: '',
      year: '',
      plate_number: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile?.driver?.id) {
      fetchDriverStats();
      fetchDriverAvailability();
    }
  }, [profile]);

  async function fetchDriverAvailability() {
    try {
      const { data, error } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('driver_id', profile.driver.id);

      if (error) {
        console.error('Error fetching availability:', error.message);
        return;
      }

      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error.message);
    }
  }

  async function fetchDriverStats() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          assigned_driver_id
        `)
        .eq('assigned_driver_id', profile.driver.id);

      if (error) {
        console.error('Error fetching stats:', error.message);
        return;
      }

      const completedTrips = data.filter(booking => booking.status === 'COMPLETED');
      
      setStats({
        totalTrips: data.length,
        rating: 0, // We'll implement ratings later
        completionRate: data.length ? ((completedTrips.length / data.length) * 100).toFixed(0) : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error.message);
      toast.error('Failed to load driver statistics');
    }
  }

  async function handlePhotoUpload(event) {
    try {
      if (!profile?.driver?.id) {
        console.error('No driver profile found:', profile);
        toast.error('Driver profile not found');
        return;
      }

      setUploadingPhoto(true);
      const file = event.target.files[0];
      
      // Validate file size and type
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, or WebP');
      }

      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${profile.driver.id}-${Date.now()}.${fileExt}`;

      console.log('Attempting to upload file:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        driverId: profile.driver.id,
        bucket: 'avatars'
      });

      // Upload to the avatars bucket
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
          duplex: 'half'
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      console.log('Upload successful:', {
        data,
        photoUrl: `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`,
        fileName
      });

      // Store just the filename in the database
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ 
          photo_url: fileName,  // Don't include 'avatars/' prefix
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.driver.id);

      if (updateError) {
        // If profile update fails, try to delete the uploaded file
        await supabase.storage
          .from('avatars')
          .remove([fileName]);
        
        console.error('Profile update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      toast.success('Profile photo updated successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function fetchProfile() {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      console.log('Fetching profile for user:', user.id);
      
      // First get the driver application
      const { data: applicationData, error: applicationError } = await supabase
        .from('driver_applications')
        .select(`
          *,
          driver:driver_id (
            id,
            status,
            contact_number,
            emergency_contact,
            license_expiry,
            notes,
            service_types,
            is_available,
            current_location,
            van_model,
            seating_capacity,
            available_seats,
            documents_verified
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      console.log('Application data:', applicationData);
      console.log('Application error:', applicationError);

      if (applicationError) throw applicationError;

      if (!applicationData) {
        console.log('No approved application found');
        toast.error('No approved driver profile found');
        return;
      }

      // Get driver details including photo_url
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', applicationData.driver_id)
        .single();

      if (driverError) {
        console.error('Error fetching driver data:', driverError);
      }

      // Combine application and driver data
      const profileData = {
        ...applicationData,
        name: applicationData.full_name,
        contact_number: applicationData.driver?.contact_number || applicationData.mobile_number,
        emergency_contact: applicationData.driver?.emergency_contact,
        license_expiry: applicationData.license_expiration,
        status: applicationData.driver?.status || 'Pending',
        driver: {
          ...applicationData.driver,
          ...driverData, // This will include photo_url if it exists
        }
      };

      console.log('Profile data:', profileData);
      setProfile(profileData);
      setFormData({
        contact_number: profileData.contact_number || '',
        emergency_contact: profileData.emergency_contact || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('drivers')
        .update({
          contact_number: formData.contact_number,
          emergency_contact: formData.emergency_contact
        })
        .eq('id', profile.driver.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setEditing(false);
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  const getPhotoUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    
    // Construct the URL correctly
    const fullUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${photoUrl.replace('avatars/', '')}`;
    console.log('Constructed photo URL:', fullUrl);
    return fullUrl;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No Driver Profile Found</h2>
            <p className="mt-2 text-gray-600">Please complete your driver application first.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <motion.main 
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div 
          className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg overflow-hidden"
          variants={itemVariants}
        >
          <div className="px-6 py-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg transition-transform duration-200 group-hover:scale-105">
                  {profile?.driver?.photo_url ? (
                    <AvatarImage 
                      src={getPhotoUrl(profile.driver.photo_url)} 
                      alt={profile.name}
                      onError={(e) => {
                        console.log('Failed to load image:', e.target.src);
                        e.target.src = null; 
                        e.target.onerror = null;
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-700 text-white">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer
                  opacity-0 group-hover:opacity-100 transition-all duration-200 
                  hover:bg-gray-50 hover:scale-110">
                  <CameraIcon className="h-5 w-5 text-blue-600" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge variant="info" className="bg-blue-500/20 text-white border-transparent">
                    <ShieldCheckIcon className="mr-1.5 h-4 w-4" />
                    {profile.status}
                  </Badge>
                  <Badge variant="info" className="bg-blue-500/20 text-white border-transparent">
                    <StarIcon className="mr-1.5 h-4 w-4" />
                    {stats.rating ? `${stats.rating} Rating` : 'No ratings'}
                  </Badge>
                  {profile.driver?.is_available !== undefined && (
                    <Badge 
                      variant={profile.driver.is_available ? "success" : "destructive"} 
                      className={`${profile.driver.is_available ? 'bg-green-500/20' : 'bg-red-500/20'} text-white border-transparent`}
                    >
                      <CheckBadgeIcon className="mr-1.5 h-4 w-4" />
                      {profile.driver.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3"
          variants={itemVariants}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Total Trips</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalTrips}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Average Rating</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.rating ? `${stats.rating}/5.0` : 'No ratings yet'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Completion Rate</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.completionRate}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="mt-6"
          variants={itemVariants}
        >
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="details">Profile Details</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle Info</TabsTrigger>
              {availability.length > 0 && (
                <TabsTrigger value="availability">Availability</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details">
              <Card>
                <CardContent className="pt-6">
                  {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Contact Number
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <PhoneIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={formData.contact_number}
                              onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Emergency Contact
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <BellAlertIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={formData.emergency_contact}
                              onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="flex-1 sm:flex-none px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <IdentificationIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">License Number</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.license_number}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <CalendarIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">License Expiry</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {profile.license_expiry ? new Date(profile.license_expiry).toLocaleDateString() : '-'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <PhoneIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.contact_number || '-'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <BellAlertIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.emergency_contact || '-'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Documents Verified */}
                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Documents Status</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {profile.driver?.documents_verified ? 'Verified' : 'Pending Verification'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Payment Information */}
                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <CreditCardIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Payment Information</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {profile.bank_name ? `${profile.bank_name} (${profile.account_number?.slice(-4).padStart(profile.account_number.length, '*')})` : 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
                {!editing && profile.driver && (
                  <CardFooter>
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-lg shadow-md 
                        text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                        focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg"
                    >
                      Edit Profile
                    </button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="vehicle">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Vehicle Model */}
                    <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <TruckIcon className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Vehicle Model</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                              {profile.driver?.van_model || profile.vehicle_model || '-'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Plate Number */}
                    <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <TagIcon className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Plate Number</h3>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{profile.plate_number || '-'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Service Types */}
                    {profile.driver?.service_types && (
                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Service Types</h3>
                              <div className="mt-1">
                                {profile.driver.service_types && profile.driver.service_types.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {profile.driver.service_types.map((service, index) => (
                                      <Badge key={index} variant="info">
                                        {service}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-lg font-semibold text-gray-900">-</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Current Location */}
                    {profile.driver?.current_location && (
                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <MapPinIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Current Location</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {profile.driver.current_location || '-'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Seating Capacity */}
                    {(profile.driver?.seating_capacity !== undefined || profile.driver?.available_seats !== undefined) && (
                      <Card className="bg-gray-50/50 backdrop-blur-sm hover:shadow-md hover:bg-gray-50/80 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-center">
                            <UserCircleIcon className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                              <h3 className="text-sm font-medium text-gray-500">Seating Capacity</h3>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {profile.driver.available_seats !== undefined && profile.driver.seating_capacity !== undefined ? 
                                  `${profile.driver.available_seats}/${profile.driver.seating_capacity} seats available` : 
                                  profile.driver.seating_capacity !== undefined ? 
                                    `${profile.driver.seating_capacity} seats` : '-'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {availability.length > 0 && (
              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Availability Schedule</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availability.map((slot, index) => {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = slot.day_of_week !== undefined ? dayNames[slot.day_of_week] : 
                                       (slot.date ? new Date(slot.date).toLocaleDateString('en-US', {weekday: 'long'}) : 'Unknown');
                        
                        return (
                          <Card key={index} className="border border-gray-200">
                            <CardContent className="p-4 flex items-center">
                              <ClockIcon className="h-6 w-6 text-blue-600" />
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">{dayName}</p>
                                <p className="text-sm text-gray-500">
                                  {slot.start_time && slot.end_time ? 
                                    `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}` : 
                                    'All day'}
                                </p>
                                {slot.location && (
                                  <p className="text-sm text-gray-500">
                                    <span className="inline-flex items-center">
                                      <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                                      {slot.location}
                                    </span>
                                  </p>
                                )}
                              </div>
                              <div className="ml-auto">
                                <Badge variant={slot.status === 'active' ? "success" : "secondary"}>
                                  {slot.status || 'Active'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>
    </motion.main>
  );
}