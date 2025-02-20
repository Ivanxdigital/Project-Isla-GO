import { supabase } from './supabase.ts';

// Function to send SMS notifications to drivers
export const sendDriverNotifications = async (bookingId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get the base URL for the API
    const baseUrl = 'https://islago.vercel.app/api';
    
    console.log('Sending driver notifications:', {
      bookingId,
      baseUrl,
      hasSession: !!session
    });

    // Call the Vercel function
    const response = await fetch(`${baseUrl}/send-driver-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ bookingId })
    });

    console.log('Driver notification response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Driver notification error:', errorData);
      throw new Error(errorData.message || 'Failed to send notifications');
    }

    const data = await response.json();
    console.log('Driver notification success:', data);

    return data.success;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}; 