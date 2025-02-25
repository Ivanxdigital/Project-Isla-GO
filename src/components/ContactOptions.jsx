import React from 'react';
import { createWhatsAppLink } from '../utils/whatsapp.js';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

/**
 * Component to display contact options for a booking
 * Shows buttons for WhatsApp, phone call, and email for contacting support or drivers
 */
export default function ContactOptions({ booking, driver, customer }) {
  // Make sure we have data to work with
  if (!booking) return null;
  
  // Create WhatsApp message template
  const supportMessage = `Hello IslaGO! I have a question about my booking #${booking.id} from ${booking.from_location} to ${booking.to_location} on ${booking.departure_date}.`;
  
  // Create support WhatsApp link - use your support phone number here
  const supportPhone = '9123456789'; // Replace with your actual support phone
  const supportWhatsAppLink = createWhatsAppLink(supportPhone, supportMessage);
  
  // Create driver WhatsApp link if a driver is assigned
  let driverWhatsAppLink = null;
  let driverMessage = '';
  
  if (driver && driver.mobile_number) {
    driverMessage = `Hello! I'm your customer for IslaGO booking #${booking.id} from ${booking.from_location} to ${booking.to_location}. My name is ${customer?.first_name || ''} ${customer?.last_name || ''}.`;
    driverWhatsAppLink = createWhatsAppLink(driver.mobile_number, driverMessage);
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Contact Options
        </h3>
        
        {/* Driver contact section */}
        {driver && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Contact Your Driver
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp button */}
              <a
                href={driverWhatsAppLink}
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="text-xs sm:text-sm">WhatsApp Driver</span>
              </a>
              
              {/* Call button */}
              <a
                href={`tel:+63${driver.mobile_number}`}
                className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                <span className="text-xs sm:text-sm">Call Driver</span>
              </a>
            </div>
          </div>
        )}
        
        {/* Support contact section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Contact Support
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* WhatsApp support button */}
            <a
              href={supportWhatsAppLink}
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-xs sm:text-sm">WhatsApp</span>
            </a>
            
            {/* Call support button */}
            <a
              href={`tel:+63${supportPhone}`}
              className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PhoneIcon className="h-5 w-5 mr-2" />
              <span className="text-xs sm:text-sm">Call</span>
            </a>
            
            {/* Email button */}
            <a
              href="mailto:support@islago.com"
              className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              <span className="text-xs sm:text-sm">Email</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50">
        <p className="text-xs sm:text-sm text-gray-600">
          Need help? Our customer service team is available 24/7 to assist you.
        </p>
      </div>
    </div>
  );
} 