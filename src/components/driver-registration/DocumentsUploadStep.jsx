import React from 'react';

export default function DocumentsUploadStep({ onChange }) {
  const documents = [
    {
      name: 'driver_license',
      label: "Driver's License",
      description: 'Clear photo of your valid driver\'s license (front and back)'
    },
    {
      name: 'or_cr',
      label: 'OR/CR',
      description: 'Official Receipt and Certificate of Registration'
    },
    {
      name: 'insurance',
      label: 'Insurance Policy',
      description: 'Comprehensive insurance policy document'
    },
    {
      name: 'vehicle_front',
      label: 'Vehicle Front Photo',
      description: 'Clear photo of your vehicle from the front'
    },
    {
      name: 'vehicle_side',
      label: 'Vehicle Side Photo',
      description: 'Clear photo of your vehicle from the side'
    },
    {
      name: 'vehicle_rear',
      label: 'Vehicle Rear Photo',
      description: 'Clear photo of your vehicle from the rear'
    },
    {
      name: 'nbi_clearance',
      label: 'NBI Clearance',
      description: 'Valid NBI Clearance'
    },
    {
      name: 'medical_certificate',
      label: 'Medical Certificate',
      description: 'Recent medical certificate'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-6">
          {documents.map((doc) => (
            <div key={doc.name}>
              <label className="block text-sm font-medium text-gray-700">
                {doc.label}
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  name={doc.name}
                  onChange={onChange}
                  accept="image/*,.pdf"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">{doc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Document Requirements</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>All documents must be clear and legible</li>
                <li>Accepted formats: JPG, PNG, PDF</li>
                <li>Maximum file size: 5MB per document</li>
                <li>Documents must be valid and not expired</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 