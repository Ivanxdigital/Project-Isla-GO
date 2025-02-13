import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { waitForGoogleMaps } from '../utils/googleMaps';

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

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pac-container {
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-top: 4px;
        background-color: white;
        font-family: inherit;
        max-height: 400px !important; /* Desktop height */
        overflow-y: auto !important;
        z-index: 1000;
        width: auto !important; /* Reset width for desktop */
        min-width: 300px;
      }
      .pac-container::-webkit-scrollbar {
        width: 8px;
      }
      .pac-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      .pac-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      .pac-container::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
      }
      .pac-item {
        padding: 0.75rem 1rem;
        cursor: pointer;
        font-size: 0.875rem;
        line-height: 1.25rem;
        border-top: 1px solid #f3f4f6;
        transition: background-color 0.15s ease;
        min-height: 48px;
      }
      .pac-item:first-child {
        border-top: none;
      }
      .pac-item:hover,
      .pac-item:active,
      .pac-item:focus {
        background-color: #f3f4f6;
      }
      .pac-item-selected {
        background-color: #f3f4f6;
      }
      .pac-icon,
      .pac-icon-marker {
        display: none !important;
      }
      .pac-item-query {
        font-size: 0.875rem;
        color: #111827;
        font-weight: 500;
        padding-left: 0;
      }
      .pac-matched {
        font-weight: 600;
        color: #2563eb;
      }
      .pac-item span:not(.pac-item-query) {
        font-size: 0.75rem;
        color: #6b7280;
        margin-left: 0.5rem;
      }

      /* Desktop specific styles */
      @media (min-width: 641px) {
        .pac-container {
          position: absolute !important;
          max-width: 600px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .pac-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
        }
        .pac-item-query {
          display: inline;
          margin-bottom: 0;
        }
        .pac-item span:not(.pac-item-query) {
          display: inline;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          margin-left: 0;
        }
      }
    `;
    document.head.appendChild(style);

    const initializeAutocomplete = async () => {
      try {
        await waitForGoogleMaps();
        if (!window.google?.maps) {
          console.warn('Google Maps API not loaded. Please check if any content blockers are enabled.');
          return;
        }
        setIsLoading(false);
        
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
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            });
          }
        });
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      document.head.removeChild(style);
    };
  }, [onSelect]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        disabled={isLoading}
        placeholder={isLoading ? 'Loading...' : t('form.hotelPlaceholder', 'Enter hotel name')}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base transition-colors duration-200"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 