let isGoogleMapsLoaded = false;

export const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const maxAttempts = 20;
    let attempts = 0;

    const checkGoogleMaps = () => {
      attempts++;
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else if (attempts >= maxAttempts) {
        reject(new Error('Google Maps failed to load'));
      } else {
        setTimeout(checkGoogleMaps, 500);
      }
    };

    checkGoogleMaps();
  });
};

export const isGoogleLoaded = () => isGoogleMapsLoaded; 