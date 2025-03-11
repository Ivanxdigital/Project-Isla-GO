import React, { useState } from 'react';
import { sendTestEmail } from '../utils/brevo.js';
import { toast } from 'react-hot-toast';

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      toast.loading('Sending test email...', { id: 'email-test' });
      await sendTestEmail(email);
      setResult({ success: true, message: 'Test email sent successfully!' });
      toast.success('Test email sent successfully!', { id: 'email-test' });
    } catch (error) {
      console.error('Error sending test email:', error);
      setResult({ success: false, message: `Error: ${error.message}` });
      toast.error(`Failed to send test email: ${error.message}`, { id: 'email-test' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-lg font-medium text-gray-900">Email Test Tool</h1>
          <p className="mt-1 text-sm text-gray-600">
            Use this form to test the email sending functionality.
          </p>
          
          <form onSubmit={handleSubmit} className="mt-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mt-5">
              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </form>
          
          {result && (
            <div className={`mt-5 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-5 border-t border-gray-200 pt-5">
            <h3 className="text-sm font-medium text-gray-700">Troubleshooting Tips</h3>
            <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Check your spam/junk folder if you don't see the email</li>
              <li>Verify that the Brevo API key is correctly configured</li>
              <li>Make sure the sender domain is properly verified in Brevo</li>
              <li>Check the browser console for detailed error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 