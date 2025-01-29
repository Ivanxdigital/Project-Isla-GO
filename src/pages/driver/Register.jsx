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
            // Remove duplicate toast - only show one success message
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            IslaGO: Onboarding Application
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please complete all required fields to register as a driver
          </p>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
            <BeforeUnload when={hasUnsavedChanges} />
            
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

            {currentStep === 1 && <PersonalInformationStep />}
            {currentStep === 2 && <LicenseDetailsStep />}
            {currentStep === 3 && <VehicleInformationStep />}
            {currentStep === 4 && <InsuranceDetailsStep />}
            {currentStep === 5 && <LTFRBDetailsStep />}
            {currentStep === 6 && (
              <DocumentsUploadStep
                documents={documents}
                onFileChange={handleFileChange}
              />
            )}
            {currentStep === 7 && <BankingInformationStep />}
            {currentStep === 8 && <AgreementStep />}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-gray-100 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
              )}
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={savingDraft || savingStatus === 'saving'}
                  className="bg-blue-100 text-blue-800 px-6 py-2 rounded-md hover:bg-blue-200 disabled:opacity-50"
                >
                  {savingDraft ? 'Saving...' : 'Save Draft'}
                </button>
                
                {currentStep < 8 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={savingStatus === 'saving'}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || savingStatus === 'saving'}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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