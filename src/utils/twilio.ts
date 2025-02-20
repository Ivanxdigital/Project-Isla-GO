import { supabase } from './supabase';

// Function to send SMS notifications to drivers
export const sendDriverNotifications = async (bookingId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get the base URL for the API
    const baseUrl = import.meta.env.DEV 
      ? 'http://localhost:3000/api'
      : 'https://your-vercel-app.vercel.app/api';
    
    // Call the Vercel function
    const response = await fetch(`${baseUrl}/send-driver-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ bookingId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send notifications');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}; 