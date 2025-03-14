let isGoogleMapsLoaded = false;

/**
 * Checks if Google Maps and the Places library are fully loaded
 * @returns {boolean} True if Google Maps and Places library are loaded
 */
export const isGoogleMapsAvailable = () => {
  return !!(
    window.google &&
    window.google.maps &&
    window.google.maps.places &&
    window.google.maps.places.Autocomplete
  );
};

/**
 * Waits for Google Maps and Places library to be loaded
 * @returns {Promise} Resolves when Google Maps is loaded
 */
export const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    // If Google Maps is already loaded, resolve immediately
    if (isGoogleMapsAvailable()) {
      console.log("Google Maps already available");
      isGoogleMapsLoaded = true;
      resolve(window.google.maps);
      return;
    }

    // If the googleMapsLoaded flag is set, check if the API is really loaded
    if (window.googleMapsLoaded === true) {
      console.log("Google Maps loaded flag detected, checking API");
      
      // Double-check that the Places library is actually available
      if (isGoogleMapsAvailable()) {
        console.log("Confirmed Google Maps Places is loaded");
        isGoogleMapsLoaded = true;
        resolve(window.google.maps);
        return;
      } else {
        console.warn("Flag was set but Google Maps Places not found, continuing to wait");
      }
    }

    console.log("Setting up Google Maps load detection...");
    
    // Try multiple detection methods for reliability

    // 1. Set up a listener for our custom event
    const customEventListener = () => {
      console.log("Google Maps loaded event detected");
      window.removeEventListener('google-maps-loaded', customEventListener);
      
      // Verify the API is actually ready
      if (isGoogleMapsAvailable()) {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        isGoogleMapsLoaded = true;
        resolve(window.google.maps);
      } else {
        console.warn("Event fired but Places API not ready yet, continuing to wait");
      }
    };
    window.addEventListener('google-maps-loaded', customEventListener);
    
    // 2. Set up a listener for the initMap callback
    const originalInitMap = window.initMap;
    window.initMap = () => {
      console.log("initMap callback triggered");
      
      // Call the original initMap if it exists
      if (originalInitMap) originalInitMap();
      
      // Wait a brief moment for the Places library to initialize
      setTimeout(() => {
        if (isGoogleMapsAvailable()) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          isGoogleMapsLoaded = true;
          resolve(window.google.maps);
        } else {
          console.warn("initMap called but Places API not ready yet");
        }
      }, 100);
    };

    // 3. Set a timeout in case Google Maps fails to load
    const timeoutId = setTimeout(() => {
      console.error("Google Maps failed to load after timeout");
      window.removeEventListener('google-maps-loaded', customEventListener);
      clearInterval(checkInterval);
      
      // Try to load Google Maps directly as a last resort
      const script = document.createElement('script');
      const apiKey = import.meta.env ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      
      script.onload = () => {
        console.log("Loaded Google Maps as fallback");
        
        // Wait a moment for the API to initialize
        setTimeout(() => {
          if (isGoogleMapsAvailable()) {
            isGoogleMapsLoaded = true;
            resolve(window.google.maps);
          } else {
            reject(new Error('Google Maps Places library not available after manual load'));
          }
        }, 500);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps even with direct script injection'));
      };
      
      document.head.appendChild(script);
    }, 15000); // Extended timeout

    // 4. Check periodically if Google Maps has loaded
    const checkInterval = setInterval(() => {
      if (isGoogleMapsAvailable()) {
        console.log("Google Maps detected during interval check");
        window.removeEventListener('google-maps-loaded', customEventListener);
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        isGoogleMapsLoaded = true;
        resolve(window.google.maps);
      }
    }, 500);
  });
};

export const isGoogleLoaded = () => isGoogleMapsLoaded; 