import React, { useState } from 'react';
import { testWhatsAppIntegration } from '../utils/test-whatsapp.js';
import toast from 'react-hot-toast';

export default function WhatsAppTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      toast.loading('Sending WhatsApp test message...', { id: 'whatsapp-test' });
      const response = await testWhatsAppIntegration(phoneNumber);
      
      setResult(response);
      toast.success('WhatsApp test message sent!', { id: 'whatsapp-test' });
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      toast.error(`Failed to send WhatsApp: ${error.message}`, { id: 'whatsapp-test' });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">WhatsApp Integration Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (with country code)
          </label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 639123456789"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            For Philippines numbers, use format: 639XXXXXXXXX
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors duration-300`}
        >
          {loading ? 'Sending...' : 'Send Test Message'}
        </button>
      </form>
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                WhatsApp message sent successfully! Check your WhatsApp to confirm receipt.
              </p>
              <p className="text-sm text-green-600 mt-2">
                Note: For the first message, you may need to send "join plenty-properly" to the Twilio WhatsApp number 
                ({result.from}) to opt in to messages.
              </p>
            </div>
          )}
          
          {result.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">
                Error sending WhatsApp message. Please check the error details above.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold">Important Notes:</h3>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>For testing, the recipient must have WhatsApp installed.</li>
          <li>
            The first time you receive a message from a Twilio WhatsApp number, you may need to opt in by 
            sending "join plenty-properly" to the Twilio WhatsApp number.
          </li>
          <li>
            In production, you would need to get your WhatsApp number approved by Twilio for 
            higher volume messaging.
          </li>
        </ul>
      </div>
    </div>
  );
} 