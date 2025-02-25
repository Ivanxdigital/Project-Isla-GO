import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

export default function DocumentsUploadStep() {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const [previews, setPreviews] = useState({});

  const requiredDocuments = [
    {
      id: 'driverLicenseFront',
      label: 'Professional Driver\'s License (Front)',
      description: 'Clear photo of your valid Professional Driver\'s License (front side)',
      accept: 'image/*'
    },
    {
      id: 'driverLicenseBack',
      label: 'Professional Driver\'s License (Back)',
      description: 'Clear photo of your valid Professional Driver\'s License (back side)',
      accept: 'image/*'
    },
    {
      id: 'nbiClearance',
      label: 'NBI Clearance',
      description: 'Latest NBI Clearance (must be within 6 months)',
      accept: 'image/*,.pdf'
    },
    {
      id: 'vehicleRegistration',
      label: 'Vehicle Registration (OR/CR)',
      description: 'Clear photo of your vehicle\'s OR/CR',
      accept: 'image/*'
    },
    {
      id: 'insurancePolicy',
      label: 'Insurance Policy',
      description: 'Complete insurance policy document showing coverage details',
      accept: 'image/*,.pdf'
    },
    {
      id: 'vehicleFront',
      label: 'Vehicle Photo (Front)',
      description: 'Clear photo of your vehicle from the front',
      accept: 'image/*'
    },
    {
      id: 'vehicleSide',
      label: 'Vehicle Photo (Side)',
      description: 'Clear photo of your vehicle from the side',
      accept: 'image/*'
    },
    {
      id: 'vehicleInterior',
      label: 'Vehicle Interior',
      description: 'Clear photo of your vehicle\'s interior showing all seats',
      accept: 'image/*'
    }
  ];

  const handleFileChange = (event, documentId) => {
    const file = event.target.files[0];
    if (file) {
      setValue(documentId, file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            [documentId]: reader.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => ({
          ...prev,
          [documentId]: 'document'
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Required Documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please upload clear, readable photos or scans of all required documents.
              Make sure all text is visible and the entire document is in frame.
            </p>
            <div className="mt-4 rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>All documents must be valid and not expired</li>
                      <li>Photos must be clear and well-lit</li>
                      <li>File size should not exceed 5MB per document</li>
                      <li>Accepted formats: JPG, PNG, PDF</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="grid grid-cols-1 gap-6">
              {requiredDocuments.map((doc) => (
                <div key={doc.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {doc.label}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept={doc.accept}
                        className="hidden"
                        id={doc.id}
                        {...register(doc.id, {
                          required: `${doc.label} is required`,
                          validate: {
                            fileSize: (value) => {
                              if (value && value[0]) {
                                return value[0].size <= 5 * 1024 * 1024 || 'File size must be less than 5MB';
                              }
                              return true;
                            }
                          }
                        })}
                        onChange={(e) => handleFileChange(e, doc.id)}
                      />
                      <label
                        htmlFor={doc.id}
                        className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 hover:border-gray-400"
                      >
                        <div className="space-y-1 text-center">
                          {previews[doc.id] ? (
                            previews[doc.id] === 'document' ? (
                              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <img src={previews[doc.id]} alt="Preview" className="mx-auto h-32 w-auto object-cover" />
                            )
                          ) : (
                            <>
                              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <span>Upload {doc.label.toLowerCase()}</span>
                              </div>
                            </>
                          )}
                          <p className="text-xs text-gray-500">{doc.description}</p>
                        </div>
                      </label>
                    </div>
                    {previews[doc.id] && (
                      <button
                        type="button"
                        onClick={() => {
                          setValue(doc.id, null);
                          setPreviews(prev => {
                            const newPreviews = { ...prev };
                            delete newPreviews[doc.id];
                            return newPreviews;
                          });
                        }}
                        className="rounded-md bg-red-100 px-2.5 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {errors[doc.id] && (
                    <p className="mt-1 text-sm text-red-600">{errors[doc.id].message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 