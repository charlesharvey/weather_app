export default {
  api_key: api_key,
  woolwich: { name: "woolwich", lat: 51.4909082, lng: 0.0588261 },
  rio: { name: "rio", lat: -22.9137907, lng: -43.7756334 },
  svalbard: { name: "svalbard", lat: 78.6196353, lng: 16.8016345 },
  bangkok: { name: "bangkok", lat: 13.7539475, lng: 100.5431602 },
  malltraeth: { name: "malltraeth", lat: 53.1919, lng: -4.3941 },
  ANIMATED_ICONS: false,
  CACHE_LENGTH: 20 * 60 * 1000, // 20 minutes
  USE_CACHE: true,
  MAX_TEMP: 40,
  MIN_TEMP: -10,
  available_locations: ["woolwich", "malltraeth", "svalbard", "bangkok", "rio"],
  map: (number, inMin, inMax, outMin, outMax) => {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
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
