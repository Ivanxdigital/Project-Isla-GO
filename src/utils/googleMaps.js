let isGoogleMapsLoaded = false;

export const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Google Maps failed to load'));
    }, 10000);

    window.initMap = () => {
      clearTimeout(timeoutId);
      resolve(window.google.maps);
    };
  });
};

export const isGoogleLoaded = () => isGoogleMapsLoaded; 