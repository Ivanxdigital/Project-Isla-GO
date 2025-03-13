let isGoogleMapsLoaded = false;

export const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    // If Google Maps is already loaded, resolve immediately
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("Google Maps already loaded, resolving immediately");
      isGoogleMapsLoaded = true;
      resolve(window.google.maps);
      return;
    }

    // If the googleMapsLoaded flag is set, resolve immediately
    if (window.googleMapsLoaded === true) {
      console.log("Google Maps loaded flag detected, resolving immediately");
      isGoogleMapsLoaded = true;
      resolve(window.google.maps);
      return;
    }

    console.log("Waiting for Google Maps to load...");
    
    // Set up a listener for the initMap callback
    const originalInitMap = window.initMap;
    window.initMap = () => {
      console.log("initMap callback triggered");
      // Call the original initMap if it exists
      if (originalInitMap) originalInitMap();
      
      // Set the loaded flag
      window.googleMapsLoaded = true;
      isGoogleMapsLoaded = true;
      
      // Resolve the promise
      resolve(window.google.maps);
    };

    // Set a timeout in case Google Maps fails to load
    const timeoutId = setTimeout(() => {
      console.error("Google Maps failed to load after timeout");
      reject(new Error('Google Maps failed to load'));
    }, 10000);

    // Check periodically if Google Maps has loaded
    const checkInterval = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps detected during interval check");
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        isGoogleMapsLoaded = true;
        resolve(window.google.maps);
      }
    }, 500);
  });
};

export const isGoogleLoaded = () => isGoogleMapsLoaded; 