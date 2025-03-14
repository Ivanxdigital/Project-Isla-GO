import React, { useState, useEffect } from 'react';

export default function DocumentsUploadStep({ formData, onChange }) {
  const [previews, setPreviews] = useState({});
  
  // Initialize previews from existing formData on component mount
  useEffect(() => {
    // Create initial previews for files that might already be in formData
    const initialPreviews = {};
    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        if (value && typeof value === 'object' && (key.includes('File') || key.includes('Photo'))) {
          initialPreviews[key] = 'document'; // Just show document icon for existing files
        }
      });
    }
    if (Object.keys(initialPreviews).length > 0) {
      setPreviews(initialPreviews);
    }
  }, []);

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (files && files[0]) {
      // Store the file locally for preview regardless of onChange availability
      const file = files[0];
      
      // Update local state first
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            [name]: reader.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, show document icon
        setPreviews(prev => ({
          ...prev,
          [name]: 'document'
        }));
      }
      
      // Update parent's state if onChange is a function
      if (typeof onChange === 'function') {
        // Pass the file to parent component
        onChange(event);
        console.log(`File uploaded: ${name}`, file);
      } else {
        console.warn('onChange is not a function or not provided to DocumentsUploadStep');
        // Handle file locally if onChange not available
        // This ensures the component works even if onChange is missing
        setLocalFiles(prev => ({
          ...prev,
          [name]: file
        }));
      }
    }
  };

  // State to store files locally if onChange is not available
  const [localFiles, setLocalFiles] = useState({});

  const removeFile = (documentId) => {
    // Remove preview
    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[documentId];
      return newPreviews;
    });
    
    // Remove from local files if we're storing them
    setLocalFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentId];
      return newFiles;
    });
    
    // Update parent's state if onChange is a function
    if (typeof onChange === 'function') {
      // Create a synthetic event to clear the file
      const syntheticEvent = {
        target: {
          name: documentId,
          value: null,
          type: 'file',
          files: null
        }
      };
      onChange(syntheticEvent);
    } else {
      console.warn('onChange is not a function or not provided to DocumentsUploadStep');
    }
  };

  // Group documents in a logical way for better organization
  const documentGroups = [
    {
      title: "Personal Documents",
      documents: [
        {
          id: 'driverLicenseFile',
          label: 'Professional Driver\'s License',
          description: 'Clear photo of your valid driver\'s license',
          accept: 'image/*',
          icon: 'id-card'
        },
        {
          id: 'nbiClearance',
          label: 'NBI Clearance',
          description: 'Latest NBI Clearance (must be within 6 months)',
          accept: 'image/*,.pdf',
          icon: 'document'
        },
        {
          id: 'medicalCertificate',
          label: 'Medical Certificate',
          description: 'Valid medical certificate from an accredited clinic',
          accept: 'image/*,.pdf',
          icon: 'medical'
        }
      ]
    },
    {
      title: "Vehicle Documents",
      documents: [
        {
          id: 'orCrFile',
          label: 'Vehicle Registration (OR/CR)',
          description: 'Clear photo of your vehicle\'s OR/CR',
          accept: 'image/*',
          icon: 'document'
        },
        {
          id: 'insuranceFile',
          label: 'Insurance Policy',
          description: 'Complete insurance policy document showing coverage details',
          accept: 'image/*,.pdf',
          icon: 'shield'
        }
      ]
    },
    {
      title: "Vehicle Photos",
      documents: [
        {
          id: 'vehicleFrontPhoto',
          label: 'Vehicle Photo (Front)',
          description: 'Clear photo of your vehicle from the front',
          accept: 'image/*',
          icon: 'car'
        },
        {
          id: 'vehicleSidePhoto',
          label: 'Vehicle Photo (Side)',
          description: 'Clear photo of your vehicle from the side',
          accept: 'image/*',
          icon: 'car'
        },
        {
          id: 'vehicleRearPhoto',
          label: 'Vehicle Photo (Rear)',
          description: 'Clear photo of your vehicle from the rear',
          accept: 'image/*',
          icon: 'car'
        }
      ]
    }
  ];

  // Document uploader component for consistent styling
  const DocumentUploader = ({ document }) => {
    // Check if we have a file either in formData or localFiles
    const hasFile = previews[document.id] || 
                   (formData && formData[document.id]) || 
                   localFiles[document.id];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium text-gray-800 flex items-center">
            {document.label}
            <span className="text-red-500 ml-1">*</span>
          </h4>
          <p className="text-sm text-gray-500 mt-1">{document.description}</p>
        </div>
        
        <div className="p-5">
          {hasFile ? (
            <div className="flex flex-col items-center">
              {previews[document.id] === 'document' ? (
                <div className="bg-blue-50 rounded-lg p-4 mb-3">
                  <svg className="h-16 w-16 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-center text-sm text-blue-600 mt-2">Document uploaded</p>
                </div>
              ) : previews[document.id] ? (
                <img 
                  src={previews[document.id]} 
                  alt={`Preview of ${document.label}`} 
                  className="h-48 object-contain rounded-lg mb-3 border border-gray-200"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-4 mb-3 w-full flex justify-center items-center" style={{ height: '12rem' }}>
                  <p className="text-gray-500 text-sm">File uploaded (No preview available)</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(document.id)}
                className="mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove File
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <label
                htmlFor={document.id}
                className="w-full cursor-pointer flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors py-6 px-4"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-700 font-semibold">
                    <span>Click to upload</span>
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    PNG, JPG, or PDF (max. 5MB)
                  </p>
                </div>
              </label>
              <input
                id={document.id}
                type="file"
                name={document.id}
                accept={document.accept}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Required Documents</h3>
        <p className="text-gray-600 mb-6">
          Please upload clear, readable photos or scans of all required documents.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 000-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tips for document uploads</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Make sure the entire document is visible in the frame</li>
                  <li>Ensure text is clear and readable</li>
                  <li>Photos should be well-lit with no glare</li>
                  <li>File size limit is 5MB per document</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {documentGroups.map((group, index) => (
        <div key={index} className="mb-8">
          <h4 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
            {group.title}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.documents.map((document) => (
              <DocumentUploader key={document.id} document={document} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 