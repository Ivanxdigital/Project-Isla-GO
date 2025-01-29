import React from 'react';

export default function LTFRBDetailsStep({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">LTFRB Accreditation Details</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please provide your LTFRB accreditation details if available. These are optional but may expedite your application process.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="tnvsNumber" className="block text-sm font-medium text-gray-700">
              TNVS Registration Number
            </label>
            <input
              type="text"
              name="tnvsNumber"
              id="tnvsNumber"
              value={formData.tnvsNumber}
              onChange={onChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="TNVS-2023-XXXXX"
            />
            <p className="mt-1 text-sm text-gray-500">
              If you have an existing TNVS registration, enter the number here.
            </p>
          </div>

          <div>
            <label htmlFor="cpcNumber" className="block text-sm font-medium text-gray-700">
              CPC/PA Number
            </label>
            <input
              type="text"
              name="cpcNumber"
              id="cpcNumber"
              value={formData.cpcNumber}
              onChange={onChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="CPC-2023-XXXXX"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter your Certificate of Public Convenience or Provisional Authority number if available.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About LTFRB Requirements</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>TNVS Registration is recommended but not required for initial application</li>
                  <li>If approved, you may need to obtain LTFRB accreditation within a specified period</li>
                  <li>We can assist you with the LTFRB application process</li>
                  <li>Having existing LTFRB credentials may expedite your application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  If you don't have LTFRB accreditation yet, you can still proceed with your application.
                  Our team will guide you through the LTFRB registration process if your initial application
                  is approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 