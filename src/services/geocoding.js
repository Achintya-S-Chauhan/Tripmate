/**
 * OpenStreetMap Nominatim Geocoding and Browser Geolocation Service
 * Provides forward geocoding, reverse geocoding, and explicit GPS location lookups
 * using real OpenStreetMap coordinates.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// In-memory cache for recent searches to reduce network traffic
const geocodeCache = new Map();

/**
 * Forward Geocoding: Search OpenStreetMap Nominatim for locations matching query.
 * @param {string} query - Free text search (e.g. "Tokyo Tower", "Zurich HB", "Central Park")
 * @returns {Promise<Array<{ name: string, displayName: string, lat: number, lng: number, city?: string, country?: string }>>}
 */
export async function searchLocation(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  if (geocodeCache.has(cleanQuery)) {
    return geocodeCache.get(cleanQuery);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(
      query.trim()
    )}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim query returned HTTP ${response.status}`);
    }

    const data = await response.json();

    const formatted = data.map((item) => {
      const addr = item.address || {};
      const primaryName =
        item.name ||
        addr.amenity ||
        addr.tourism ||
        addr.historic ||
        addr.station ||
        item.display_name.split(',')[0].trim();

      const city =
        addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
      const country = addr.country || '';

      return {
        id: item.place_id ? String(item.place_id) : `${item.lat},${item.lon}`,
        name: primaryName,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        coords: [parseFloat(item.lat), parseFloat(item.lon)],
        city,
        country,
        type: item.type,
      };
    });

    // Cache up to 40 items
    if (geocodeCache.size >= 40) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }
    geocodeCache.set(cleanQuery, formatted);

    return formatted;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('Geocoding request timed out for:', query);
    } else {
      console.warn('Geocoding search failed:', err.message);
    }
    return [];
  }
}

/**
 * Reverse Geocoding: Look up address information for a coordinate pair.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ name: string, displayName: string, city: string, country: string } | null>}
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
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const item = await response.json();
    const addr = item.address || {};
    const primaryName =
      item.name ||
      addr.amenity ||
      addr.tourism ||
      addr.building ||
      addr.road ||
      item.display_name?.split(',')?.[0]?.trim() ||
      'Current Position';

    const city =
      addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
    const country = addr.country || '';

    return {
      name: primaryName,
      displayName: item.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city,
      country,
    };
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
