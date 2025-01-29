// src/pages/driver/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon, 
  IdentificationIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

export default function DriverProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    contact_number: '',
    emergency_contact: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    if (!user) return;

    try {
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

      if (applicationError) throw applicationError;

      if (!applicationData) {
        toast.error('No approved driver profile found');
        return;
      }

      // Combine application and driver data
      const profileData = {
        ...applicationData,
        name: applicationData.full_name,
        contact_number: applicationData.driver?.contact_number || applicationData.mobile_number,
        emergency_contact: applicationData.driver?.emergency_contact,
        license_expiry: applicationData.license_expiration,
        status: applicationData.driver?.status || 'Pending'
      };

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

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </main>
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
    <main className="flex-1 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto w-full">
          <div className="shadow-sm">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-20 w-20 text-white" />
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${profile.status === 'active' ? 'bg-green-100 text-green-800' : 
                      profile.status === 'suspended' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    <ShieldCheckIcon className="mr-1.5 h-4 w-4" />
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </main>
  );
}