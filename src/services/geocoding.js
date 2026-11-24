/**
 * OpenStreetMap Nominatim Geocoding and Browser Geolocation Service
 * Provides forward geocoding, reverse geocoding, and city/place search
 * using real OpenStreetMap data.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// In-memory cache for recent searches to reduce network traffic & respect rate limits
const geocodeCache = new Map();

/**
 * Clean and format address components from OpenStreetMap Nominatim item
 */
function formatNominatimItem(item) {
  const addr = item.address || {};

  // Best primary name
  const primaryName =
    item.name ||
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.village ||
    addr.amenity ||
    addr.tourism ||
    addr.historic ||
    addr.station ||
    item.display_name.split(',')[0].trim();

  const city =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.village ||
    addr.suburb ||
    addr.county ||
    '';

  const state = addr.state || addr.region || addr.province || '';
  const country = addr.country || '';
  const countryCode = (addr.country_code || '').toUpperCase();

  // Build clean, human-readable hierarchy e.g. "Telangana, India" or "Île-de-France, France"
  const detailParts = [];
  if (city && city !== primaryName) detailParts.push(city);
  if (state && state !== primaryName) detailParts.push(state);
  if (country) detailParts.push(country);

  const subtitle = detailParts.length > 0 ? detailParts.join(', ') : item.display_name;

  return {
    id: item.place_id ? String(item.place_id) : `${item.lat},${item.lon}`,
    name: primaryName,
    displayName: item.display_name,
    subtitle: subtitle,
    city: city || primaryName,
    state: state,
    country: country,
    countryCode: countryCode,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    coords: [parseFloat(item.lat), parseFloat(item.lon)],
    type: item.type || item.class || 'location',
    importance: item.importance || 0,
  };
}

// Popular Indian Destinations for default suggestions
export const POPULAR_INDIAN_DESTINATIONS = [
  {
    id: 'in-vidisha',
    name: 'Vidisha',
    displayName: 'Vidisha, Madhya Pradesh, India',
    subtitle: 'Madhya Pradesh, India',
    city: 'Vidisha',
    state: 'Madhya Pradesh',
    country: 'India',
    countryCode: 'IN',
    lat: 23.5251,
    lng: 77.8081,
    coords: [23.5251, 77.8081],
    type: 'city',
  },
  {
    id: 'in-bhopal',
    name: 'Bhopal',
    displayName: 'Bhopal, Madhya Pradesh, India',
    subtitle: 'Madhya Pradesh, India',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    countryCode: 'IN',
    lat: 23.2599,
    lng: 77.4126,
    coords: [23.2599, 77.4126],
    type: 'city',
  },
  {
    id: 'in-indore',
    name: 'Indore',
    displayName: 'Indore, Madhya Pradesh, India',
    subtitle: 'Madhya Pradesh, India',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    countryCode: 'IN',
    lat: 22.7196,
    lng: 75.8577,
    coords: [22.7196, 75.8577],
    type: 'city',
  },
  {
    id: 'in-delhi',
    name: 'New Delhi',
    displayName: 'New Delhi, Delhi, India',
    subtitle: 'National Capital Territory of Delhi, India',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    countryCode: 'IN',
    lat: 28.6139,
    lng: 77.2090,
    coords: [28.6139, 77.2090],
    type: 'city',
  },
  {
    id: 'in-mumbai',
    name: 'Mumbai',
    displayName: 'Mumbai, Maharashtra, India',
    subtitle: 'Maharashtra, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    lat: 19.0760,
    lng: 72.8777,
    coords: [19.0760, 72.8777],
    type: 'city',
  },
  {
    id: 'in-bengaluru',
    name: 'Bengaluru',
    displayName: 'Bengaluru, Karnataka, India',
    subtitle: 'Karnataka, India',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    countryCode: 'IN',
    lat: 12.9716,
    lng: 77.5946,
    coords: [12.9716, 77.5946],
    type: 'city',
  },
  {
    id: 'in-jaipur',
    name: 'Jaipur',
    displayName: 'Jaipur, Rajasthan, India',
    subtitle: 'Rajasthan, India',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    countryCode: 'IN',
    lat: 26.9124,
    lng: 75.7873,
    coords: [26.9124, 75.7873],
    type: 'city',
  },
  {
    id: 'in-varanasi',
    name: 'Varanasi',
    displayName: 'Varanasi, Uttar Pradesh, India',
    subtitle: 'Uttar Pradesh, India',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    countryCode: 'IN',
    lat: 25.3176,
    lng: 82.9739,
    coords: [25.3176, 82.9739],
    type: 'city',
  },
];

/**
 * Forward Geocoding: Search OpenStreetMap Nominatim for cities, places, landmarks.
 * Prioritizes Indian regional queries (Vidisha, Bhopal, Indore, Delhi, Mumbai, Bengaluru, Jaipur)
 * while smoothly resolving global destinations.
 * @param {string} query - Free text search query
 * @param {number} [limit=6] - Max results
 * @returns {Promise<Array>} Array of formatted suggestion objects
 */
export async function searchLocation(query, limit = 6) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return POPULAR_INDIAN_DESTINATIONS.slice(0, limit);
  }

  const cleanQuery = query.trim().toLowerCase();

  // Instant prefix match from popular Indian destinations
  const localIndianMatches = POPULAR_INDIAN_DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(cleanQuery) ||
    d.city.toLowerCase().includes(cleanQuery) ||
    d.state.toLowerCase().includes(cleanQuery)
  );

  if (geocodeCache.has(cleanQuery)) {
    return geocodeCache.get(cleanQuery);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&limit=${limit * 2}&addressdetails=1&q=${encodeURIComponent(
      query.trim()
    )}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'TripMate-Student-App/1.0 (achintya@tripmate.local)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (localIndianMatches.length > 0) return localIndianMatches.slice(0, limit);
      throw new Error(`Nominatim query returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return localIndianMatches.slice(0, limit);
    }

    const formatted = data.map(formatNominatimItem);

    // Prioritize Indian results unless user specifically queried an international destination
    const sorted = [...formatted].sort((a, b) => {
      const aIsIndia = a.countryCode === 'IN' || a.country?.toLowerCase() === 'india';
      const bIsIndia = b.countryCode === 'IN' || b.country?.toLowerCase() === 'india';
      if (aIsIndia && !bIsIndia) return -1;
      if (!aIsIndia && bIsIndia) return 1;
      return (b.importance || 0) - (a.importance || 0);
    });

    // Merge any instant local matches at the top if relevant
    const combined = [...localIndianMatches];
    sorted.forEach((item) => {
      if (!combined.some((c) => c.displayName === item.displayName || c.id === item.id)) {
        combined.push(item);
      }
    });

    const finalResults = combined.slice(0, limit);

    // Cache up to 50 queries
    if (geocodeCache.size >= 50) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }
    geocodeCache.set(cleanQuery, finalResults);

    return finalResults;
  } catch (err) {
    clearTimeout(timeoutId);
    if (localIndianMatches.length > 0) return localIndianMatches.slice(0, limit);
    if (err.name === 'AbortError') {
      console.warn('Geocoding request timed out for:', query);
    } else {
      console.warn('Geocoding search error:', err.message);
    }
    return [];
  }
}

/**
 * Reverse Geocoding: Look up address information for a coordinate pair.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ name: string, displayName: string, city: string, state: string, country: string } | null>}
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'TripMate-Student-App/1.0 (achintya@tripmate.local)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const item = await response.json();
    const formatted = formatNominatimItem(item);
    return formatted;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Reverse geocode failed:', err.message);
    return null;
  }
}

/**
 * Explicit browser geolocation request.
 * Invoked ONLY when user clicks a location button.
 * @returns {Promise<{ lat: number, lng: number, accuracy: number, coords: [number, number] }>}
 */
export function getCurrentBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          coords: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = 'Could not retrieve your location.';
        if (err.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (err.code === 2) {
          msg = 'Position unavailable. GPS or network location service failed.';
        } else if (err.code === 3) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
