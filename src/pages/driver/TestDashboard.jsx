import React from 'react';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

export default function TestDashboard() {
  const testNotification = async () => {
    try {
      // 1. Create test booking
      const response = await fetch('/api/test-driver-notification');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to create test notification');
      }

      toast.success('Test notification created!');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed');
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={testNotification}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Create Test Notification
      </button>
    </div>
  );
} 