let isGoogleMapsLoaded = false;

export const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      isGoogleMapsLoaded = true;
      resolve(window.google);
      return;
    }

    const checkGoogle = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogle);
        isGoogleMapsLoaded = true;
        resolve(window.google);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkGoogle);
      reject(new Error('Google Maps failed to load'));
    }, 10000);
  });
};

export const isGoogleLoaded = () => isGoogleMapsLoaded; 