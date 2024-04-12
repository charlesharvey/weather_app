export default {
  api_key: api_key,
  woolwich: { name: "woolwich", lat: 51.491, lng: 0.0588 },
  london: { name: "london", lat: 51.513, lng: -0.103 },
  rio: { name: "rio", lat: -22.9137907, lng: -43.7756334 },
  svalbard: { name: "svalbard", lat: 78.6196353, lng: 16.8016345 },
  bangkok: { name: "bangkok", lat: 13.7539475, lng: 100.5431602 },
  malltraeth: { name: "malltraeth", lat: 53.1919, lng: -4.3941 },
  cork: { name: "cork", lat: 51.9, lng: -8.48 },
  ANIMATED_ICONS: false,
  CACHE_LENGTH: 20 * 60 * 1000, // 20 minutes
  USE_CACHE: true,
  MAX_TEMP: 45,
  MIN_TEMP: -10,
  available_locations: ["london", "woolwich", "malltraeth"],
  unavailable_locations: ["svalbard", "bangkok", "rio", "cork"],
  map: (number, inMin, inMax, outMin, outMax) => {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  },
  constrain: (number, min, max) => {
    return Math.min(Math.max(number, min), max);
  },
  doFetch: (action, method, data) => {
    if (data) {
      data = JSON.stringify(data);
    }
    return fetch(action, {
      method: method,
      body: data,
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw data;
        });
      }
      return response.json();
    });
  },
};
