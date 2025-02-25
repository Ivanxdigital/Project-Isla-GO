import React from 'react';

export default function AgreementStep({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Terms and Conditions
        </h3>

        <div className="prose prose-sm max-w-none text-gray-500">
          {/* Terms content */}
          <p>
            By accepting these terms, you agree to comply with IslaGO's policies and procedures...
          </p>
          
          <div className="mt-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted || false}
                  onChange={onChange}
                  className="h-4 w-4 text-ai-600 focus:ring-ai-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                  I accept the terms and conditions
                </label>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-medium leading-6 text-gray-900 mt-8 mb-4">
          Privacy Policy
        </h3>

        <div className="prose prose-sm max-w-none text-gray-500">
          {/* Privacy content */}
          <p>
            IslaGO is committed to protecting your privacy...
          </p>

          <div className="mt-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="privacyAccepted"
                  name="privacyAccepted"
                  type="checkbox"
                  checked={formData.privacyAccepted || false}
                  onChange={onChange}
                  className="h-4 w-4 text-ai-600 focus:ring-ai-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="privacyAccepted" className="font-medium text-gray-700">
                  I accept the privacy policy
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 