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
  TruckIcon
} from '@heroicons/react/24/outline';

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
  const [stats, setStats] = useState({
    totalTrips: 0,
    rating: 0,
    completionRate: 0
  });
  
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
    }
  }, [profile]);

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
            notes
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
        <div className="text-center max-w-md mx-auto p-6">
          <UserCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No Driver Profile Found</h2>
          <p className="mt-2 text-gray-600">Please complete your driver application first.</p>
        </div>
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
                {profile?.driver?.photo_url ? (
                  <img 
                    src={getPhotoUrl(profile.driver.photo_url)}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg 
                      transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      console.log('Failed to load image:', e.target.src);
                      e.target.src = null; 
                      e.target.onerror = null;
                    }}
                  />
                ) : (
                  <UserCircleIcon className="h-24 w-24 text-white transition-transform 
                    duration-200 group-hover:scale-105" />
                )}
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    bg-blue-500/20 text-white">
                    <ShieldCheckIcon className="mr-1.5 h-4 w-4" />
                    {profile.status}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    bg-blue-500/20 text-white">
                    <StarIcon className="mr-1.5 h-4 w-4" />
                    {stats.rating ? `${stats.rating} Rating` : 'No ratings'}
                  </span>
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
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Total Trips</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalTrips}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
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
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Completion Rate</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{stats.completionRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="mt-6 bg-white shadow rounded-lg"
          variants={itemVariants}
        >
          <div className="px-6 py-8">
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
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 transition-all hover:shadow-md hover:bg-gray-50/80">
                    <div className="flex items-center">
                      <IdentificationIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">License Number</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{profile.license_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 transition-all hover:shadow-md hover:bg-gray-50/80">
                    <div className="flex items-center">
                      <CalendarIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">License Expiry</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {profile.license_expiry ? new Date(profile.license_expiry).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 transition-all hover:shadow-md hover:bg-gray-50/80">
                    <div className="flex items-center">
                      <PhoneIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{profile.contact_number || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 transition-all hover:shadow-md hover:bg-gray-50/80">
                    <div className="flex items-center">
                      <BellAlertIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{profile.emergency_contact || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {profile.driver && (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-lg shadow-md 
                      text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                      focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}