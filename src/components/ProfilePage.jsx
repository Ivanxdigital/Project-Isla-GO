import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
    bio: '',
    avatar_url: ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile for user:', user?.id); // Debug log

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      console.log('Fetched profile data:', data); // Debug log
      
      // Format the date to YYYY-MM-DD for the input field
      const formattedData = {
        ...data,
        date_of_birth: data.date_of_birth ? format(new Date(data.date_of_birth), 'yyyy-MM-dd') : ''
      };

      setProfile(formattedData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      console.log('Current profile data:', profile); // Debug log

      // Prepare the update data without updated_at
      const updateData = {
        full_name: profile.full_name || null,
        mobile_number: profile.mobile_number || null,
        bio: profile.bio || null,
        // Only include date_of_birth if it has a value
        ...(profile.date_of_birth ? { date_of_birth: profile.date_of_birth } : { date_of_birth: null })
      };

      console.log('Sending update data:', updateData); // Debug log

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Detailed error:', error);
        throw error;
      }

      console.log('Update response:', data);
      toast.success('Profile updated successfully');
      await fetchProfile(); // Refresh the profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date field
    if (name === 'date_of_birth') {
      console.log('Date value:', value); // Debug log
      setProfile(prev => ({
        ...prev,
        [name]: value || null // Use null if value is empty
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar updated successfully');
      
      // Add this line to refresh the navigation menu
      if (typeof window !== 'undefined' && window.refreshNavProfile) {
        window.refreshNavProfile();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwords.new.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setUpdating(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

        {/* Avatar Section */}
        <div className="mb-8 flex flex-col items-center">
          <div 
            onClick={handleAvatarClick}
            className="relative cursor-pointer group"
          >
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm">Change Photo</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          {uploadingAvatar && (
            <p className="mt-2 text-sm text-gray-500">Uploading...</p>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              value={profile.full_name || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ai-500 focus:ring-ai-500 sm:text-sm"
              placeholder="John Doe"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <input
              type="tel"
              name="mobile_number"
              id="mobile_number"
              value={profile.mobile_number || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ai-500 focus:ring-ai-500 sm:text-sm"
              placeholder="+63 XXX XXX XXXX"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              id="date_of_birth"
              value={profile.date_of_birth || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ai-500 focus:ring-ai-500 sm:text-sm"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              name="bio"
              id="bio"
              rows={4}
              value={profile.bio || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ai-500 focus:ring-ai-500 sm:text-sm"
              placeholder="Tell us a little about yourself..."
            />
          </div>

          {/* Registration Date (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Registered On
            </label>
            <p className="mt-1 text-sm text-gray-500">
              {format(new Date(user.created_at), 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-ai-600 hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500 ${
                updating ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Password Change Section */}
        <div className="mt-10 pt-10 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ai-500 focus:ring-ai-500 sm:text-sm"
                minLength={6}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-ai-500 focus:ring-ai-500 sm:text-sm"
                minLength={6}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updating}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-ai-600 hover:bg-ai-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ai-500 ${
                  updating ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 