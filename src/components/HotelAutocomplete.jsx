import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Simple manual hotel input component (no Google Maps dependency)
export default function HotelAutocomplete({ onSelect, defaultValue }) {
  const { t } = useTranslation();
  const [hotelName, setHotelName] = useState(defaultValue || '');
  const [hotelAddress, setHotelAddress] = useState('');
  const [isAddressVisible, setIsAddressVisible] = useState(false);
  
  // Update the hotel information when the name changes
  const handleHotelNameChange = (e) => {
    const name = e.target.value;
    setHotelName(name);
    
    // If we have both name and address, update the parent component
    if (name && hotelAddress) {
      onSelect({
        name: name,
        address: hotelAddress,
        // Since we don't have coordinates, we'll set location to null
        location: null
      });
    }
    // If we cleared the name, show a message
    else if (!name && hotelAddress) {
      setHotelAddress('');
    }
    
    // Show address field if hotel name has a value
    setIsAddressVisible(!!name);
  };
  
  // Update the hotel information when the address changes
  const handleHotelAddressChange = (e) => {
    const address = e.target.value;
    setHotelAddress(address);
    
    // If we have both name and address, update the parent component
    if (hotelName && address) {
      onSelect({
        name: hotelName,
        address: address,
        location: null
      });
    }
  };
  
  // Handle the confirmation action
  const handleConfirmHotel = () => {
    // Provide default address if none entered
    const finalAddress = hotelAddress || `${hotelName}, Palawan, Philippines`;
    
    onSelect({
      name: hotelName,
      address: finalAddress,
      location: null
    });
  };

  return (
    <div className="space-y-3">
      {/* Hotel Name Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          value={hotelName}
          onChange={handleHotelNameChange}
          placeholder={t('form.hotelPlaceholder', 'Enter hotel name')}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base transition-colors duration-200"
        />
      </div>
      
      {/* Hotel Address Input (appears when hotel name is entered) */}
      {isAddressVisible && (
        <div className="transition-all duration-300 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={hotelAddress}
              onChange={handleHotelAddressChange}
              placeholder="Hotel address (optional)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm transition-colors duration-200"
            />
          </div>
          
          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirmHotel}
            className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-2 px-4 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm font-medium"
          >
            Confirm Hotel Selection
          </button>
        </div>
      )}
      
      {/* Helper text */}
      <div className="text-xs text-gray-500">
        {!isAddressVisible ? (
          "Enter your hotel name above"
        ) : (
          "Add the hotel address or leave blank if unknown"
        )}
      </div>
    </div>
  );
} 