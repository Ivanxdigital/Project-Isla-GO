import { supabase } from './supabase.ts';

// Function to send SMS notifications to drivers
export const sendBookingEmail = async (bookingId: string): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session found');
    }

    const response = await fetch('/api/send-driver-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookingId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send notifications');
    }

    const data = await response.json();
    console.log('Driver notification response:', data);

    return data;
  } catch (error) {
    console.error('Error sending driver notifications:', error);
    throw error;
  }
}; 