export default {
  api_key: api_key,
  locations: {
    woolwich: { name: "woolwich", lat: 51.491, lng: 0.0588 },
    london: { name: "london", lat: 51.513, lng: -0.103 },
    rio: { name: "rio", lat: -22.9137, lng: -43.7756 },
    svalbard: { name: "svalbard", lat: 78.6196, lng: 16.8016 },
    bangkok: { name: "bangkok", lat: 13.7539, lng: 100.5431 },
    malltraeth: { name: "malltraeth", lat: 53.1919, lng: -4.3941 },
    hayonwye: { name: "hayonwye", lat: 52.0738, lng: -3.1399 },
    portmeirion: { name: "portmeirion", lat: 52.9136, lng: -4.1167 },
    cork: { name: "cork", lat: 51.9, lng: -8.48 },
    izmir: { name: "izmir", lat: 38.47, lng: 27.114 },
    tisbury: { name: "tisbury", lat: 51.0627, lng: -2.118 },
    glasgow: { name: "glasgow", lat: 55.8642, lng: -4.2518 },
  },
  available_locations: ["woolwich", "malltraeth", "tisbury", "glasgow"],
  ANIMATED_ICONS: false,
  CACHE_LENGTH: 20 * 60 * 1000, // 20 minutes
  USE_CACHE: true,
  MAX_TEMP: 45,
  MIN_TEMP: -10,
  TIME_TO_UNFOCUS_HOUR: 5000,
  click_file: "audio/tick.mp3",
  roundTemp: (a) => {
    return Math.round(a);
  },
  windSpeedAndDirection: (speed, deg) => {
    let scale = speed / 10;
    scale = Math.min(Math.max(scale, 0.5), 1.2);
    return ` rotate(${deg}deg) scale(${scale})`;
  },
  windToMPH: (sp) => {
    // m/s to mph
    return Math.round(sp * 2.236936);
  },
  roundSpeed: (a) => {
    return Math.round(a);
  },
  timeToHour: (t) => {
    if (t > 0) {
      const date = new Date(t * 1000);
      const options = { hour: "2-digit", hourCycle: "h24" };
      let i = new Intl.DateTimeFormat("en-US", options).format(date);
      i = i == 24 ? (i = `00`) : i;
      return i;
    }
    return "";
  },
  timeToDayOfWeek: (t) => {
    const date = new Date(t * 1000);
    const options = { weekday: "short" };
    const i = new Intl.DateTimeFormat("en-US", options).format(date);
    return i;
  },

  timeToDate: (t) => {
    const date = new Date(t * 1000);
    const options = { day: "2-digit" };
    const i = new Intl.DateTimeFormat("en-US", options).format(date);
    return i;
  },

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
