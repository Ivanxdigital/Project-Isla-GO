/**
 * WhatsApp utilities for the IslaGO application
 */

/**
 * Creates a WhatsApp deep link that opens a chat with the specified phone number
 * 
 * @param {string} phoneNumber - Phone number (with or without country code)
 * @param {string} message - Optional pre-filled message
 * @returns {string} WhatsApp deep link URL
 */
export const createWhatsAppLink = (phoneNumber, message = '') => {
  // Clean the phone number (remove spaces, dashes, parentheses, etc.)
  const cleanNumber = phoneNumber.toString().replace(/[\s\-\(\)\+]+/g, '');
  
  // Make sure it has the country code (63 for Philippines)
  const fullNumber = cleanNumber.startsWith('63') 
    ? cleanNumber 
    : cleanNumber.startsWith('9') 
      ? '63' + cleanNumber 
      : cleanNumber;
  
  // Create the basic WhatsApp link
  let whatsappLink = `https://wa.me/${fullNumber}`;
  
  // If there's a message, add it to the link (properly encoded for URLs)
  if (message) {
    whatsappLink += `?text=${encodeURIComponent(message)}`;
  }
  
  return whatsappLink;
};

/**
 * Creates a standard message template for customer to driver communication
 * 
 * @param {Object} booking - Booking details object
 * @param {Object} customer - Customer details object
 * @returns {string} Formatted message
 */
export const createCustomerToDriverMessage = (booking, customer) => {
  return `Hello! I'm your customer for IslaGO booking #${booking.id} from ${booking.from_location} to ${booking.to_location} on ${booking.departure_date}. My name is ${customer.first_name} ${customer.last_name}.`;
};

/**
 * Creates a standard message template for driver to customer communication
 * 
 * @param {Object} booking - Booking details object
 * @param {Object} driver - Driver details object
 * @returns {string} Formatted message
 */
export const createDriverToCustomerMessage = (booking, driver) => {
  return `Hello! I'm your driver ${driver.first_name} ${driver.last_name} for your IslaGO booking #${booking.id} from ${booking.from_location} to ${booking.to_location} on ${booking.departure_date}.`;
}; 