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

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pac-container {
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        margin-top: 8px;
        background-color: white;
        font-family: inherit;
        max-height: 300px !important;
        overflow-y: auto !important;
        z-index: 1000;
        width: auto !important;
        min-width: 300px;
      }
      
      .pac-container::-webkit-scrollbar {
        width: 6px;
      }
      
      .pac-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
      }
      
      .pac-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 6px;
      }
      
      .pac-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      .pac-item {
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-size: 0.875rem;
        line-height: 1.25rem;
        border-top: 1px solid #f3f4f6;
        transition: all 0.2s ease;
        min-height: 48px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .pac-item:first-child {
        border-top: none;
      }
      
      .pac-item:hover,
      .pac-item:active,
      .pac-item:focus {
        background-color: #f8fafc;
      }
      
      .pac-item-selected {
        background-color: #f0f9ff;
      }
      
      .pac-icon,
      .pac-icon-marker {
        display: none !important;
      }
      
      .pac-item-query {
        font-size: 0.9rem;
        color: #1e293b;
        font-weight: 500;
        padding-left: 0;
        margin-bottom: 2px;
      }
      
      .pac-matched {
        font-weight: 600;
        color: #3b82f6;
      }
      
      .pac-item span:not(.pac-item-query) {
        font-size: 0.75rem;
        color: #64748b;
        margin-left: 0;
      }

      /* Desktop specific styles */
      @media (min-width: 641px) {
        .pac-container {
          position: absolute !important;
          max-width: 600px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .pac-item {
          padding: 0.75rem 1rem;
        }
      }

      /* Mobile specific styles */
      @media (max-width: 640px) {
        .pac-container {
          position: fixed !important;
          top: auto !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-height: 60vh !important;
          border-bottom: none;
          border-radius: 1rem 1rem 0 0;
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .pac-item {
          padding: 1rem 1.25rem;
        }
        
        .pac-item-query {
          font-size: 1rem;
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .pac-item span:not(.pac-item-query) {
          font-size: 0.875rem;
          display: block;
          white-space: normal;
          line-height: 1.25;
        }
      }
    `;
    document.head.appendChild(style);

    // Manual check for Google Maps
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps and Places API detected");
        return true;
      }
      return false;
    };

    const initializeAutocomplete = async () => {
      try {
        console.log("Starting Google Maps initialization");

        // First check if Google Maps is already loaded
        if (checkGoogleMapsLoaded()) {
          setIsLoading(false);
          setupAutocomplete();
          return;
        }

        // If not already loaded, wait for it
        await waitForGoogleMaps();
        
        // Double-check after waiting
        if (checkGoogleMapsLoaded()) {
          console.log("Google Maps loaded successfully");
          setIsLoading(false);
          setupAutocomplete();
        } else {
          console.error("Google Maps API failed to load properly");
          setError("Google Maps could not be loaded. Please refresh the page.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setError("Could not initialize hotel search. Please try again later.");
        setIsLoading(false);
      }
    };

    const setupAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      
      try {
        console.log("Setting up autocomplete");
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['lodging'],
          componentRestrictions: { country: 'PH' },
          fields: ['name', 'formatted_address', 'geometry'],
          bounds: new window.google.maps.LatLngBounds(
            // Southwest corner
            { lat: PALAWAN_BOUNDS.south, lng: PALAWAN_BOUNDS.west },
            // Northeast corner
            { lat: PALAWAN_BOUNDS.north, lng: PALAWAN_BOUNDS.east }
          ),
          strictBounds: true // This forces results to be within Palawan
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.name) {
            onSelect({
              name: place.name,
              address: place.formatted_address,
              location: place.geometry ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              } : null
            });
          }
        });
        
        console.log("Autocomplete setup complete");
      } catch (error) {
        console.error('Error setting up autocomplete:', error);
        setError("Failed to set up hotel search. Please try again.");
      }
    };

    // Trigger manual load check on input focus
    const handleInputFocus = () => {
      if (!autocompleteRef.current && window.google?.maps?.places) {
        console.log("Input focused - initializing autocomplete");
        setupAutocomplete();
      }
    };

    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleInputFocus);
    }

    // Start initialization
    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      document.head.removeChild(style);
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleInputFocus);
      }
    };
  }, [onSelect]);

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
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
      {!error && (
        <p className="mt-1.5 text-xs text-gray-500">
          Start typing to search hotels in Palawan
        </p>
      )}
    </div>
  );
} 