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

  useEffect(() => {
    // SIMPLIFIED APPROACH: Focus only on the core functionality
    const initializeAutocomplete = async () => {
      try {
        setDebugInfo('Waiting for Google Maps to load...');
        // Wait for Google Maps to load
        await waitForGoogleMaps();
        
        // Check if Google Maps loaded properly
        if (!window.google?.maps?.places) {
          console.error('Google Maps Places API not available');
          setDebugInfo('Error: Google Maps Places API not available');
          setError('Google Maps Places API could not be loaded');
          setIsLoading(false);
          return;
        }
        
        setDebugInfo('Google Maps loaded, setting up autocomplete...');
        console.log('Google Maps loaded, setting up autocomplete...');
        
        // Create the autocomplete instance directly
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['lodging'],
          componentRestrictions: { country: 'PH' }
        });
        
        // Simplify by not setting bounds initially
        autocompleteRef.current = autocomplete;
        
        // Add the place_changed listener
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Selected place:', place);
          setDebugInfo(`Selected: ${place.name}`);
          
          if (place && place.name) {
            onSelect({
              name: place.name,
              address: place.formatted_address || '',
              location: place.geometry ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              } : null
            });
          }
        });
        
        setDebugInfo('Autocomplete setup complete');
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
        setDebugInfo(`Error: ${error.message}`);
        setError(`Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect]);

  // Manual trigger function for debugging
  const manuallyInitialize = () => {
    if (!window.google?.maps?.places) {
      setDebugInfo('Google Maps not available yet');
      return;
    }
    
    try {
      setDebugInfo('Manually initializing autocomplete...');
      
      // Remove any existing autocomplete
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      
      // Create new autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['lodging'],
        componentRestrictions: { country: 'PH' }
      });
      
      autocompleteRef.current = autocomplete;
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        setDebugInfo(`Selected: ${place.name}`);
        
        if (place && place.name) {
          onSelect({
            name: place.name,
            address: place.formatted_address || '',
            location: place.geometry ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            } : null
          });
        }
      });
      
      setDebugInfo('Manual initialization complete');
    } catch (error) {
      console.error('Manual initialization error:', error);
      setDebugInfo(`Manual init error: ${error.message}`);
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
          defaultValue={defaultValue}
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