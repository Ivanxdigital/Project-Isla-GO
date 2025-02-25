import React from 'react';
import { createWhatsAppLink, createCustomerToDriverMessage } from '../utils/whatsapp.js';
import { PhoneIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/20/solid';

/**
 * Component to display driver details with contact options
 * 
 * @param {Object} props - Component props
 * @param {Object} props.driver - Driver information
 * @param {Object} props.booking - Booking information
 * @param {Object} props.customer - Customer information
 */
export default function DriverDetails({ driver, booking, customer }) {
  // Only render if we have driver data
  if (!driver) return null;

  // Create the WhatsApp message
  const whatsappMessage = createCustomerToDriverMessage(booking, customer);
  
  // Generate the WhatsApp link
  const whatsappLink = createWhatsAppLink(driver.mobile_number, whatsappMessage);
  
  // Default image if none provided
  const driverImage = driver.photo_url || 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c';
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 sm:p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Driver</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Driver image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0">
            <img 
              src={driverImage} 
              alt={`${driver.first_name} ${driver.last_name}`}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Driver info */}
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-lg font-semibold">{driver.first_name} {driver.last_name}</h4>
            
            <div className="flex items-center justify-center sm:justify-start mt-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon 
                  key={i} 
                  className={`h-4 w-4 ${i < Math.floor(driver.rating || 4.8) 
                    ? 'text-yellow-400' 
                    : 'text-gray-300'}`} 
                />
              ))}
              <span className="ml-1 text-sm text-gray-600">{driver.rating || 4.8}</span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {driver.experience || '5 years'} experience • {driver.trips || '1000+'} trips
            </p>
            
            <p className="text-sm text-gray-600">
              {driver.vehicle_type || 'Toyota HiAce'} 
              {driver.plate_number ? ` • ${driver.plate_number}` : ''}
            </p>
          </div>
        </div>
        
        {/* Contact buttons */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Call button */}
          <a
            href={`tel:+63${driver.mobile_number}`}
            className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            <span className="text-xs sm:text-sm">Call Driver</span>
          </a>
          
          {/* WhatsApp button */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
            <span className="text-xs sm:text-sm">WhatsApp</span>
          </a>
        </div>
      </div>
      
      {/* Trip details summary */}
      <div className="border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50">
        <h4 className="font-medium mb-2 text-sm sm:text-base">Trip Details</h4>
        <div className="text-xs sm:text-sm text-gray-600">
          <p className="mb-1"><span className="font-medium">From:</span> {booking.from_location}</p>
          <p className="mb-1"><span className="font-medium">To:</span> {booking.to_location}</p>
          <p className="mb-1"><span className="font-medium">Date:</span> {booking.departure_date}</p>
          <p className="mb-1"><span className="font-medium">Time:</span> {booking.departure_time}</p>
        </div>
      </div>
    </div>
  );
} 