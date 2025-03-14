import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { uploadDriverDocument } from '../utils/storage';
import { toast } from 'react-hot-toast';
import PersonalInformationStep from '../components/driver-registration/PersonalInformationStep';
import LicenseDetailsStep from '../components/driver-registration/LicenseDetailsStep';
import VehicleInformationStep from '../components/driver-registration/VehicleInformationStep';
import InsuranceDetailsStep from '../components/driver-registration/InsuranceDetailsStep';
import LTFRBDetailsStep from '../components/driver-registration/LTFRBDetailsStep';
import DocumentsUploadStep from '../components/driver-registration/DocumentsUploadStep';
import BankingInformationStep from '../components/driver-registration/BankingInformationStep';
import AgreementStep from '../components/driver-registration/AgreementStep';

export default function DriverRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    mobileNumber: '',
    address: '',
    // License Details
    licenseNumber: '',
    licenseExpiration: '',
    licenseType: '',
    // Vehicle Information
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: '',
    orCrNumber: '',
    // Insurance Details
    insuranceProvider: '',
    policyNumber: '',
    policyExpiration: '',
    // LTFRB Details
    tnvsNumber: '',
    cpcNumber: '',
    // Banking Information
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    // Agreement
    termsAgreed: false,
    privacyAgreed: false,
    // Document Files
    driverLicenseFile: null,
    orCrFile: null,
    insuranceFile: null,
    vehicleFrontPhoto: null,
    vehicleSidePhoto: null,
    vehicleRearPhoto: null,
    nbiClearance: null,
    medicalCertificate: null,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Enhanced debugging
    console.log(`Input changed: field=${name}, value="${value}", type=${type}`);
    
    // For document files
    if (type === 'file') {
      console.log(`File upload detected for field: ${name}`);
      setFormData(prev => ({
        ...prev,
        [name]: files ? files[0] : null
      }));
      return;
    }
    
    // For the LTFRB fields, add special handling
    if (name === 'tnvsNumber' || name === 'cpcNumber') {
      console.log(`LTFRB field ${name} changed to: "${value}"`);
      
      // Update state explicitly
      setFormData(prevData => {
        const newData = {
          ...prevData,
          [name]: value
        };
        console.log(`New formData.${name} = "${newData[name]}"`);
        return newData;
      });
    } else {
      // Handle other fields normally
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : files ? files[0] : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log the form data before submission for debugging
      console.log("Submitting form data:", formData);
      
      // Upload all documents and get their URLs
      const documentUploads = await Promise.all([
        formData.driverLicenseFile && uploadDriverDocument(formData.driverLicenseFile, user.id, 'driver_license'),
        formData.orCrFile && uploadDriverDocument(formData.orCrFile, user.id, 'or_cr'),
        formData.insuranceFile && uploadDriverDocument(formData.insuranceFile, user.id, 'insurance'),
        formData.vehicleFrontPhoto && uploadDriverDocument(formData.vehicleFrontPhoto, user.id, 'vehicle_front'),
        formData.vehicleSidePhoto && uploadDriverDocument(formData.vehicleSidePhoto, user.id, 'vehicle_side'),
        formData.vehicleRearPhoto && uploadDriverDocument(formData.vehicleRearPhoto, user.id, 'vehicle_rear'),
        formData.nbiClearance && uploadDriverDocument(formData.nbiClearance, user.id, 'nbi_clearance'),
        formData.medicalCertificate && uploadDriverDocument(formData.medicalCertificate, user.id, 'medical_certificate')
      ]);

      // Create application record
      const { data, error } = await supabase
        .from('driver_applications')
        .insert([
          {
            user_id: user.id,
            full_name: formData.fullName,
            email: formData.email,
            mobile_number: formData.mobileNumber,
            address: formData.address,
            license_number: formData.licenseNumber,
            license_expiration: formData.licenseExpiration,
            license_type: formData.licenseType,
            vehicle_make: formData.vehicleMake,
            vehicle_model: formData.vehicleModel,
            vehicle_year: parseInt(formData.vehicleYear),
            vehicle_color: formData.vehicleColor,
            plate_number: formData.plateNumber,
            or_cr_number: formData.orCrNumber,
            insurance_provider: formData.insuranceProvider,
            policy_number: formData.policyNumber,
            policy_expiration: formData.policyExpiration,
            tnvs_number: formData.tnvsNumber ?? '',
            cpc_number: formData.cpcNumber ?? '',
            bank_name: formData.bankName,
            account_number: formData.accountNumber,
            account_holder: formData.accountHolder,
            // Document URLs
            driver_license_url: documentUploads[0]?.url || null,
            or_cr_url: documentUploads[1]?.url || null,
            insurance_url: documentUploads[2]?.url || null,
            vehicle_front_url: documentUploads[3]?.url || null,
            vehicle_side_url: documentUploads[4]?.url || null,
            vehicle_rear_url: documentUploads[5]?.url || null,
            nbi_clearance_url: documentUploads[6]?.url || null,
            medical_certificate_url: documentUploads[7]?.url || null,
            // Store complete document information in the documents JSONB field
            documents: documentUploads.reduce((acc, doc, index) => {
              if (doc) {
                const types = [
                  'driver_license', 'or_cr', 'insurance', 
                  'vehicle_front', 'vehicle_side', 'vehicle_rear',
                  'nbi_clearance', 'medical_certificate'
                ];
                acc[types[index]] = doc;
              }
              return acc;
            }, {}),
            terms_accepted: formData.termsAgreed,
            privacy_accepted: formData.privacyAgreed,
            status: 'pending',
          }
        ])
        .select();

      if (error) throw error;

      toast.success('Application submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    console.log("Rendering step:", currentStep);
    
    switch (currentStep) {
      case 1:
        return <PersonalInformationStep formData={formData} onChange={handleInputChange} />;
      case 2:
        return <LicenseDetailsStep formData={formData} onChange={handleInputChange} />;
      case 3:
        return <VehicleInformationStep formData={formData} onChange={handleInputChange} />;
      case 4:
        return <InsuranceDetailsStep formData={formData} onChange={handleInputChange} />;
      case 5:
        // Simplified LTFRB step handling
        return <LTFRBDetailsStep 
          formData={formData} 
          onChange={handleInputChange} 
        />;
      case 6:
        console.log("Rendering DocumentsUploadStep with handleInputChange function:", typeof handleInputChange);
        return <DocumentsUploadStep 
          formData={formData} 
          onChange={handleInputChange} 
        />;
      case 7:
        return <BankingInformationStep formData={formData} onChange={handleInputChange} />;
      case 8:
        return <AgreementStep formData={formData} onChange={handleInputChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            {renderStep()}
            
            <div className="mt-6 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 4) {
                      setFormData(prev => ({
                        ...prev,
                        tnvsNumber: prev.tnvsNumber || '',
                        cpcNumber: prev.cpcNumber || ''
                      }));
                    }
                    setCurrentStep(prev => prev + 1);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}