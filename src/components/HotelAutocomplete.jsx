import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { waitForGoogleMaps } from '../utils/googleMaps.js';

// Palawan bounds
const PALAWAN_BOUNDS = {
  north: 12.5000, // Northern tip of Palawan
  south: 8.3000,  // Southern tip of Palawan
  east: 119.9000, // Eastern boundary
  west: 117.0000  // Western boundary
};

export default function HotelAutocomplete({ onSelect, defaultValue }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Initializing...');
  const [searchValue, setSearchValue] = useState(defaultValue || '');

  // Function to set up autocomplete
  const setupAutocomplete = () => {
    if (!window.google?.maps?.places || !inputRef.current) {
      setDebugInfo('Google Maps Places API not available yet');
      return false;
    }

    try {
      // Clean up any existing instance
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      // Create a more flexible search that includes many types of places
      const options = {
        // Include many types of places, not just lodging
        types: ['establishment'],
        // Restrict to Philippines
        componentRestrictions: { country: 'PH' },
        // All needed fields
        fields: ['name', 'formatted_address', 'geometry', 'place_id'],
      };

      // Create new autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Store the instance
      autocompleteRef.current = autocomplete;

      // Add listener for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('Selected place:', place);
        
        if (place && place.place_id) {
          setDebugInfo(`Selected: ${place.name}`);
          onSelect({
            name: place.name,
            address: place.formatted_address || '',
            location: place.geometry?.location ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            } : null,
            place_id: place.place_id
          });
        } else {
          setDebugInfo('No place details available');
        }
      });
      
      setDebugInfo('Autocomplete setup complete');
      return true;
    } catch (error) {
      console.error('Error setting up autocomplete:', error);
      setDebugInfo(`Setup error: ${error.message}`);
      return false;
    }
  };

  // On component mount
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        setDebugInfo('Waiting for Google Maps...');
        await waitForGoogleMaps();
        
        if (!window.google?.maps?.places) {
          console.error('Google Maps Places API not available');
          setError('Google Maps Places API could not be loaded');
          setIsLoading(false);
          return;
        }
        
        setDebugInfo('Google Maps loaded');
        const success = setupAutocomplete();
        
        if (success) {
          setDebugInfo('Ready for hotel search');
        } else {
          setDebugInfo('Could not initialize search, try clicking the reinitialize button');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setError(`Could not load Google Maps: ${error.message}`);
        setIsLoading(false);
      }
    };

    initGoogleMaps();

    // Cleanup
    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect]);

  // Handle input changes - useful for forcing updates
  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  // Manual initialization function that users can trigger
  const manuallyInitialize = () => {
    setDebugInfo('Attempting manual initialization...');
    
    // Try to load the script directly if window.google doesn't exist
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setDebugInfo('Google Maps script loaded manually');
        setTimeout(() => {
          const success = setupAutocomplete();
          if (success) {
            setDebugInfo('Manual initialization successful!');
          } else {
            setDebugInfo('Manual initialization failed');
          }
        }, 1000);
      };
      document.head.appendChild(script);
      return;
    }
    
    // If Google is already loaded, just try to set up autocomplete
    const success = setupAutocomplete();
    if (success) {
      setDebugInfo('Reinitialized successfully');
    } else {
      setDebugInfo('Reinitialization failed, Google Maps not ready');
    }
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
          disabled={isLoading}
          placeholder={isLoading ? 'Loading...' : t('form.hotelPlaceholder', 'Enter hotel name')}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base transition-colors duration-200"
        />
      </div>
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="mt-1.5 text-xs text-red-500">{error}</div>
      )}
      
      <div className="mt-1.5 text-xs text-gray-600">
        {!error && <div>Start typing to search hotels in Palawan</div>}
        <div className="mt-1 text-xs text-gray-400">{debugInfo}</div>
        <button 
          onClick={manuallyInitialize}
          type="button" 
          className="mt-1 text-xs text-blue-500 underline"
        >
          Reinitialize autocomplete
        </button>
      </div>
    </div>
  );
} 