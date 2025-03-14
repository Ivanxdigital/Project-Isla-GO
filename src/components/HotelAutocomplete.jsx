import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// This is a completely new implementation with direct integration
export default function HotelAutocomplete({ onSelect, defaultValue }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [searchValue, setSearchValue] = useState(defaultValue || '');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Starting...');
  const [apiKey, setApiKey] = useState('');
  
  // Effect to check the API key
  useEffect(() => {
    // Try to get the API key from environment
    const envKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey) {
      setApiKey(envKey);
      setStatus(`API key found: ${envKey.substring(0, 5)}...`);
    } else {
      setStatus('No API key found in environment variables');
    }
  }, []);
  
  // Manual initialization directly in the UI
  const initializeMaps = () => {
    // First, check if we already have Google Maps
    if (window.google?.maps?.places) {
      setStatus('Google Maps already loaded, initializing...');
      initializeAutocomplete();
      return;
    }
    
    setStatus('Loading Google Maps script...');
    
    // Directly inject the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      setStatus('Script loaded successfully!');
      // Wait a bit for the API to initialize
      setTimeout(() => {
        initializeAutocomplete();
      }, 500);
    };
    
    script.onerror = (error) => {
      setStatus(`Script loading failed: ${error}`);
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
  };
  
  // Direct autocomplete initialization function
  const initializeAutocomplete = () => {
    if (!window.google?.maps?.places) {
      setStatus('Google Maps Places not available yet');
      setIsLoading(false);
      return;
    }
    
    try {
      setStatus('Setting up autocomplete...');
      
      // Create a new autocomplete instance directly
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'lodging'],
        componentRestrictions: { country: 'PH' }
      });
      
      // Add the place selection listener
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        setStatus(`Selected: ${place.name || 'Unknown'}`);
        
        if (place) {
          onSelect({
            name: place.name || '',
            address: place.formatted_address || '',
            location: place.geometry?.location ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            } : null
          });
        }
      });
      
      setStatus('Autocomplete ready - type to search');
      setIsLoading(false);
    } catch (error) {
      setStatus(`Error setting up autocomplete: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  // For direct testing with any input value
  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          placeholder={t('form.hotelPlaceholder', 'Enter hotel name')}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base transition-colors duration-200"
        />
      </div>
      
      <div className="mt-1.5 space-y-2">
        <div className="text-xs text-gray-600">Start typing to search hotels in Palawan</div>
        
        <div className="flex flex-col bg-gray-50 p-2 rounded-md border border-gray-200">
          <div className="text-xs font-medium">Status: <span className="text-gray-700">{status}</span></div>
          
          <div className="mt-2 flex space-x-2">
            <button 
              onClick={initializeMaps}
              type="button" 
              disabled={isLoading}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
            >
              {isLoading ? 'Loading...' : 'Initialize Maps'}
            </button>
            
            <button 
              onClick={initializeAutocomplete}
              type="button" 
              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
            >
              Reinitialize Autocomplete
            </button>
          </div>
        </div>
      </div>
      
      {/* For testing dropdown positioning */}
      <div id="dropdown-debug" className="hidden">
        <div className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 p-2 w-full">
          <div className="p-2 hover:bg-gray-100 cursor-pointer">Test Hotel 1</div>
          <div className="p-2 hover:bg-gray-100 cursor-pointer">Test Hotel 2</div>
        </div>
      </div>
    </div>
  );
} 