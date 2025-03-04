import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { useForm, FormProvider } from 'react-hook-form';
import PersonalInformationStep from '../../components/driver-registration/PersonalInformationStep';
import LicenseDetailsStep from '../../components/driver-registration/LicenseDetailsStep';
import VehicleInformationStep from '../../components/driver-registration/VehicleInformationStep';
import InsuranceDetailsStep from '../../components/driver-registration/InsuranceDetailsStep';
import LTFRBDetailsStep from '../../components/driver-registration/LTFRBDetailsStep';
import DocumentsUploadStep from '../../components/driver-registration/DocumentsUploadStep';
import BankingInformationStep from '../../components/driver-registration/BankingInformationStep';
import AgreementStep from '../../components/driver-registration/AgreementStep';
import BeforeUnload from '../../components/BeforeUnload';

// Utility function to create a debounced function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function DriverRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loadedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingStatus, setSavingStatus] = useState(''); // For showing saving indicator
  
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      // Personal Information
      fullName: '',
      email: user?.email || '',
      mobileNumber: '',
      address: '',
      emergencyContact: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      photoUrl: '',
      
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
      seatingCapacity: '',
      
      // Service Types
      serviceTypes: [],
      
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
      termsAccepted: false,
      privacyAccepted: false
    }
  });

  const [documents, setDocuments] = useState({
    driver_license: null,
    or_cr: null,
    insurance: null,
    vehicle_front: null,
    vehicle_side: null,
    vehicle_rear: null,
    nbi_clearance: null,
    medical_certificate: null
  });

  // Create a ref for the debounced save function to persist across renders
  const debouncedSaveRef = useRef();

  // Initialize the debounced save function
  useEffect(() => {
    debouncedSaveRef.current = debounce(async (formData, step) => {
      try {
        setSavingStatus('saving');
        
        // Save to localStorage first (quick operation)
        localStorage.setItem(`driver_registration_${user.id}`, JSON.stringify({
          formData,
          currentStep: step,
          timestamp: Date.now()
        }));

        // Then save to Supabase with proper upsert configuration
        const { error } = await supabase
          .from('driver_application_drafts')
          .upsert(
            {
              user_id: user.id,
              form_data: formData,
              current_step: step,
              last_updated: new Date().toISOString()
            },
            {
              onConflict: 'user_id',
              ignoreDuplicates: false
            }
          );

        if (error) throw error;
        
        setSavingStatus('saved');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error saving draft:', error);
        setSavingStatus('error');
        toast.error('Failed to save progress. Your changes are saved locally.');
      }
    }, 500);

    return () => {
      if (debouncedSaveRef.current?.cancel) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [user.id]);

  // Load saved draft when component mounts
  useEffect(() => {
    const loadSavedDraft = async () => {
      if (loadedRef.current) return;
      loadedRef.current = true; // Set this immediately to prevent multiple loads

      try {
        // Try to load from Supabase first
        const { data: draftData, error } = await supabase
          .from('driver_application_drafts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            throw error;
          }
        }

        if (draftData) {
          methods.reset(draftData.form_data);
          setCurrentStep(draftData.current_step);
          toast.success('Draft application loaded');
          return;
        }

        // If no Supabase draft, try localStorage
        const savedProgress = localStorage.getItem(`driver_registration_${user.id}`);
        if (savedProgress) {
          const { formData, currentStep: savedStep, timestamp } = JSON.parse(savedProgress);
          
          // Only load if the saved data is less than 24 hours old
          const isRecent = (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
          if (isRecent) {
            methods.reset(formData);
            setCurrentStep(savedStep);
            toast.success('Draft application loaded from local storage');
          } else {
            localStorage.removeItem(`driver_registration_${user.id}`);
          }
        }
      } catch (error) {
        console.error('Error loading saved draft:', error);
        toast.error('Failed to load saved progress');
      }
    };

    loadSavedDraft();
  }, [user.id, methods]); // Remove loadedDraft from dependencies

  // Watch form changes and trigger debounced save
  useEffect(() => {
    if (!loadedRef.current) return;

    const subscription = methods.watch((formData) => {
      setSavingStatus('pending');
      setHasUnsavedChanges(true);
      debouncedSaveRef.current(formData, currentStep);
    });

    return () => subscription.unsubscribe();
  }, [methods, currentStep]);

  // Explicit save draft function for manual saving
  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const formData = methods.getValues();
      
      // Save to Supabase with proper upsert configuration
      const { error } = await supabase
        .from('driver_application_drafts')
        .upsert(
          {
            user_id: user.id,
            form_data: formData,
            current_step: currentStep,
            last_updated: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (error) throw error;
      
      // Update local storage
      localStorage.setItem(`driver_registration_${user.id}`, JSON.stringify({
        formData,
        currentStep,
        timestamp: Date.now()
      }));

      setHasUnsavedChanges(false);
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Handle step navigation with automatic saving
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      try {
        // Save current step data before proceeding
        await saveDraft();
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        console.error('Error saving step:', error);
        toast.error('Failed to save current step. Please try again.');
      }
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setDocuments(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const uploadDocument = async (file, driverId, docType) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}/${docType}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const validateCurrentStep = async () => {
    const currentStepFields = {
      1: ['fullName', 'email', 'mobileNumber', 'address'],
      2: ['licenseNumber', 'licenseExpiration', 'licenseType'],
      3: ['vehicleMake', 'vehicleModel', 'vehicleYear', 'vehicleColor', 'plateNumber', 'orCrNumber'],
      4: ['insuranceProvider', 'policyNumber', 'policyExpiration'],
      5: ['tnvsNumber', 'cpcNumber'],
      6: [], // Documents step
      7: ['bankName', 'accountNumber', 'accountHolder'],
      8: ['termsAccepted', 'privacyAccepted']
    };

    const result = await methods.trigger(currentStepFields[currentStep]);
    return result;
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // First upload all documents and get their URLs
      const documentUrls = {
        driver_license_url: await uploadDocument(documents.driver_license, user.id, 'driver_license'),
        or_cr_url: await uploadDocument(documents.or_cr, user.id, 'or_cr'),
        insurance_url: await uploadDocument(documents.insurance, user.id, 'insurance'),
        vehicle_front_url: await uploadDocument(documents.vehicle_front, user.id, 'vehicle_front'),
        vehicle_side_url: await uploadDocument(documents.vehicle_side, user.id, 'vehicle_side'),
        vehicle_rear_url: await uploadDocument(documents.vehicle_rear, user.id, 'vehicle_rear'),
        nbi_clearance_url: await uploadDocument(documents.nbi_clearance, user.id, 'nbi_clearance'),
        medical_certificate_url: await uploadDocument(documents.medical_certificate, user.id, 'medical_certificate')
      };

      // Create application record with correct column names
      const { error: applicationError } = await supabase
        .from('driver_applications')
        .insert([
          {
            user_id: user.id,
            full_name: data.fullName,
            email: user.email,
            mobile_number: data.mobileNumber,
            address: data.address,
            license_number: data.licenseNumber,
            license_expiration: data.licenseExpiration,
            license_type: data.licenseType,
            vehicle_make: data.vehicleMake,
            vehicle_model: data.vehicleModel,
            vehicle_year: data.vehicleYear,
            vehicle_color: data.vehicleColor,
            plate_number: data.plateNumber,
            or_cr_number: data.orCrNumber,
            insurance_provider: data.insuranceProvider,
            policy_number: data.policyNumber,
            policy_expiration: data.policyExpiration,
            tnvs_number: data.tnvsNumber,
            cpc_number: data.cpcNumber,
            bank_name: data.bankName,
            account_number: data.accountNumber,
            account_holder: data.accountHolder,
            status: 'active',
            documents_verified: true,
            ...documentUrls,
            created_at: new Date().toISOString()
          }
        ]);

      if (applicationError) throw applicationError;

      toast.success('Application submitted successfully!');
      navigate('/driver/RegistrationSuccess');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add service type options
  const serviceTypeOptions = [
    { value: 'shared', label: 'Shared Van Service' },
    { value: 'private10', label: 'Private Van (10 Seater)' },
    { value: 'private15', label: 'Private Van (15 Seater)' },
    { value: 'airport', label: 'Airport Transfer' },
    { value: 'tour', label: 'Tour Service' }
  ];

  // Add common Philippine van models
  const commonVanModels = [
    'Toyota Hiace',
    'Nissan NV350 Urvan',
    'Hyundai Grand Starex',
    'Foton View Traveller',
    'JAC Sunray',
    'Maxus V80'
  ];

  // Add Philippine banks
  const philippineBanks = [
    'BDO',
    'BPI',
    'Metrobank',
    'PNB',
    'Security Bank',
    'UnionBank',
    'RCBC',
    'China Bank',
    'LANDBANK',
    'GCash',
    'Maya'
  ];

  // Philippine license types
  const licenseTypes = [
    { value: 'professional', label: 'Professional - Any vehicle except motorcycle' },
    { value: 'sp_professional', label: 'Professional with SP - Special Permit for PUV' }
  ];

  // Function to format Philippine mobile number
  const formatPhilippineNumber = (value) => {
    if (!value) return value;
    // Remove all non-digit characters
    const number = value.replace(/[^\d]/g, '');
    
    // Limit to 11 digits
    const limitedNumber = number.slice(0, 11);
    
    // Format with spaces
    if (limitedNumber.length <= 3) return limitedNumber;
    if (limitedNumber.length <= 6) return `${limitedNumber.slice(0, 3)} ${limitedNumber.slice(3)}`;
    return `${limitedNumber.slice(0, 3)} ${limitedNumber.slice(3, 6)} ${limitedNumber.slice(6, 11)}`;
  };

  // Handle mobile number input
  const handleMobileNumberChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatPhilippineNumber(value);
    methods.setValue('mobileNumber', formattedValue);
  };

  // Handle emergency contact number input
  const handleEmergencyContactChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatPhilippineNumber(value);
    methods.setValue('emergencyContact', formattedValue);
  };

  // Handle photo upload
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('driver-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('driver-photos')
        .getPublicUrl(fileName);

      methods.setValue('photoUrl', publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    }
  };

  // Function to clear saved data
  const clearSavedData = () => {
    try {
      // Clear localStorage data
      if (typeof window !== 'undefined' && user?.id) {
        localStorage.removeItem(`driver_registration_${user.id}`);
      }
      
      // Clear Supabase draft data
      const clearSupabaseDraft = async () => {
        if (user?.id) {
          try {
            const { error } = await supabase
              .from('driver_application_drafts')
              .delete()
              .eq('user_id', user.id);
              
            if (error) {
              console.error('Error deleting draft:', error);
            }
          } catch (err) {
            console.error('Error in clearSupabaseDraft:', err);
          }
        }
      };
      
      // Execute the Supabase clear operation
      clearSupabaseDraft();
      
      // Reset form to default values
      methods.reset({
        // Personal Information
        fullName: '',
        email: user?.email || '',
        mobileNumber: '',
        address: '',
        emergencyContact: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        photoUrl: '',
        
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
        seatingCapacity: '',
        
        // Service Types
        serviceTypes: [],
        
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
        termsAccepted: false,
        privacyAccepted: false
      });
      
      // Reset to first step
      setCurrentStep(1);
      
      // Reset loadedRef to allow fresh loading
      loadedRef.current = false;
      
      // Show success message
      toast.success('All saved data has been cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data. Please try again.');
    }
  };

  // Modified steps rendering to be more mobile-friendly
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Personal Information</h3>
              <button
                type="button"
                onClick={clearSavedData}
                className="text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors duration-200 self-start"
              >
                Clear Saved Data
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('fullName', { required: 'Full name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {methods.formState.errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{methods.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile Number
                  <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(e.g., 0917 123 4567)</span>
                </label>
                <div className="flex">
                  <input
                    type="tel"
                    {...methods.register('mobileNumber', {
                      required: 'Mobile number is required',
                      validate: value => {
                        const digitsOnly = value.replace(/\D/g, '');
                        return digitsOnly.length === 11 || 'Mobile number must be 11 digits';
                      }
                    })}
                    onChange={handleMobileNumberChange}
                    placeholder="0917 123 4567"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button 
                    type="button"
                    onClick={() => methods.setValue('mobileNumber', '')}
                    className="ml-2 mt-1 inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
                {methods.formState.errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{methods.formState.errors.mobileNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Emergency Contact Number
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="tel"
                    {...methods.register('emergencyContact', {
                      required: 'Emergency contact number is required',
                      validate: value => {
                        const digitsOnly = value.replace(/\D/g, '');
                        return digitsOnly.length === 11 || 'Mobile number must be 11 digits';
                      }
                    })}
                    onChange={handleEmergencyContactChange}
                    placeholder="0917 123 4567"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button 
                    type="button"
                    onClick={() => methods.setValue('emergencyContact', '')}
                    className="ml-2 mt-1 inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
                {methods.formState.errors.emergencyContact && (
                  <p className="mt-1 text-sm text-red-600">{methods.formState.errors.emergencyContact.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relationship to Emergency Contact
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('emergencyContactRelation', {
                    required: 'Please specify your relationship to the emergency contact'
                  })}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...methods.register('address', { required: 'Address is required' })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Photo
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e.target.files[0])}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Upload Photo
                  </label>
                  {methods.watch('photoUrl') && (
                    <img
                      src={methods.watch('photoUrl')}
                      alt="Profile preview"
                      className="ml-3 h-12 w-12 rounded-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return <LicenseDetailsStep />;
      case 3:
        return <VehicleInformationStep />;
      case 4:
        return <InsuranceDetailsStep />;
      case 5:
        return <LTFRBDetailsStep />;
      case 6:
        return (
          <DocumentsUploadStep
            documents={documents}
            onFileChange={handleFileChange}
          />
        );
      case 7:
        return <BankingInformationStep />;
      case 8:
        return <AgreementStep />;
      default:
        return null;
    }
  };

  // Add a mobile-friendly progress indicator
  const renderProgressBar = () => {
    const progress = (currentStep / 8) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            IslaGO: Driver Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please complete all required fields to register as a driver
          </p>
        </div>

        {renderProgressBar()}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
            <BeforeUnload when={hasUnsavedChanges} />
            
            {/* Saving status indicator */}
            <div className="mb-4 flex items-center justify-end space-x-2">
              {savingStatus === 'pending' && (
                <span className="text-yellow-600 text-sm">Saving...</span>
              )}
              {savingStatus === 'saving' && (
                <div className="flex items-center text-blue-600 text-sm">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving changes...
                </div>
              )}
              {savingStatus === 'saved' && (
                <span className="text-green-600 text-sm">All changes saved</span>
              )}
              {savingStatus === 'error' && (
                <span className="text-red-600 text-sm">Failed to save to cloud</span>
              )}
            </div>

            {renderStep()}

            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back
                </button>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={savingDraft || savingStatus === 'saving'}
                  className="w-full sm:w-auto bg-blue-100 text-blue-800 px-6 py-3 rounded-md hover:bg-blue-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {savingDraft ? 'Saving...' : 'Save Draft'}
                </button>
                
                {currentStep < 8 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={savingStatus === 'saving'}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || savingStatus === 'saving'}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}