/**
 * OSRM (Open Source Routing Machine) Real Routing Service
 * Calculates real-world route distance, travel duration, and polyline geometry
 * between origin and destination coordinates using real road and pathway networks.
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org';

// In-memory cache for recent route calculations
const routeCache = new Map();

/**
 * Great-circle distance between two coordinate pairs (Haversine formula in km)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Format minutes into readable duration string (e.g., '55 min' or '1h 20m')
 */
export function formatDuration(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m <= 0) return '0 min';
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const remainingMins = m % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Format distance with unit
 */
export function formatDistance(distanceKm, unit = 'km') {
  const km = Number(distanceKm) || 0;
  if (unit === 'mi') {
    const mi = (km * 0.621371).toFixed(1);
    return `${parseFloat(mi).toLocaleString()} mi`;
  }
  const cleanKm = Number.isInteger(km)
    ? km.toLocaleString()
    : km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${cleanKm} km`;
}

/**
 * Calculate mode-specific travel duration given distance (km) and base driving seconds from OSRM
 */
function computeModeDuration(mode, distanceKm, drivingSeconds) {
  const m = (mode || '').toLowerCase();
  const drivingMinutes = Math.max(1, Math.round((drivingSeconds || 0) / 60));

  // Walking: average ~4.8 km/h (12.5 min/km)
  if (m.includes('walk') || m.includes('foot') || m.includes('pedestrian')) {
    return Math.max(1, Math.round((distanceKm / 4.8) * 60));
  }

  // Bicycle: average ~16 km/h
  if (m.includes('bike') || m.includes('bicycle')) {
    return Math.max(1, Math.round((distanceKm / 16) * 60));
  }

  // Train / Rail: average 75-85 km/h + 10 min station dwell time
  if (m.includes('train') || m.includes('rail') || m.includes('shinkansen') || m.includes('metro')) {
    const railTime = Math.round((distanceKm / 80) * 60) + 8;
    return Math.max(5, railTime);
  }

  // Bus: road-based with stops (driving time * 1.35 + 5 min dwell)
  if (m.includes('bus')) {
    const busTime = Math.round(drivingMinutes * 1.35) + 5;
    return Math.max(5, busTime);
  }

  // Multimodal: Bus + Walking or Train + Walking
  if (m.includes('bus') && m.includes('walk')) {
    return Math.round(drivingMinutes * 1.3) + 10;
  }
  if (m.includes('train') && m.includes('walk')) {
    const railTime = Math.round((distanceKm / 75) * 60) + 15;
    return Math.max(10, railTime);
  }

  // Car / Driving default
  return Math.max(1, drivingMinutes);
}

/**
 * Estimate CO2 emission in kg for given mode and distance
 */
export function estimateCo2(mode, distanceKm) {
  const m = (mode || '').toLowerCase();
  const dist = Number(distanceKm) || 0;
  if (dist <= 0) return 0;

  // Emissions in kg CO2 per passenger-km (standard DEFRA / EEA guidelines)
  let factor = 0.089; // Bus default ~89g/km
  if (m.includes('walk') || m.includes('bike') || m.includes('foot')) {
    factor = 0;
  } else if (m.includes('train') || m.includes('rail') || m.includes('metro')) {
    factor = 0.035; // Electric rail ~35g/km
  } else if (m.includes('car')) {
    factor = 0.171; // Average petrol car ~171g/km
  } else if (m.includes('ferry') || m.includes('boat')) {
    factor = 0.115;
  }

  return parseFloat((dist * factor).toFixed(2));
}

/**
 * Calculate route between origin and destination coordinates.
 * Queries OSRM router with fallback to great-circle Haversine.
 *
 * @param {Object} params
 * @param {{ lat: number, lng: number, name?: string }} params.origin
 * @param {{ lat: number, lng: number, name?: string }} params.destination
 * @param {string} [params.mode='Car']
 * @returns {Promise<{
 *   success: boolean,
 *   distanceKm: number,
 *   distanceFormatted: string,
 *   durationMinutes: number,
 *   durationFormatted: string,
 *   geometry: Array<[number, number]>, // [[lat, lng], ...] for Leaflet
 *   mode: string,
 *   estimatedCo2Kg: number,
 *   source: 'osrm' | 'haversine_fallback'
 * }>}
 */
export async function calculateRoute({ origin, destination, mode = 'Car' }) {
  if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
    throw new Error('Valid origin and destination coordinates are required for route calculation.');
  }

  const oLat = parseFloat(origin.lat);
  const oLng = parseFloat(origin.lng);
  const dLat = parseFloat(destination.lat);
  const dLng = parseFloat(destination.lng);

  if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
    throw new Error('Invalid coordinate numbers supplied.');
  }

  // Check cache key
  const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}_${dLat.toFixed(4)},${dLng.toFixed(4)}_${mode}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  // Choose OSRM profile
  const m = mode.toLowerCase();
  let osrmProfile = 'driving';
  if (m.includes('walk') && !m.includes('bus') && !m.includes('train')) {
    osrmProfile = 'walking';
  } else if (m.includes('bike') || m.includes('bicycle')) {
    osrmProfile = 'bicycle';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500);

  try {
    // Note: OSRM uses {lon},{lat} order
    const url = `${OSRM_BASE_URL}/route/v1/${osrmProfile}/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
      const bestRoute = data.routes[0];
      const distanceMeters = bestRoute.distance || 0;
      const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
      const baseDrivingSeconds = bestRoute.duration || 0;
      const durationMinutes = computeModeDuration(mode, distanceKm, baseDrivingSeconds);

      // Map GeoJSON [lng, lat] coordinates to Leaflet [lat, lng]
      const geometry = Array.isArray(bestRoute.geometry?.coordinates)
        ? bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        : [[oLat, oLng], [dLat, dLng]];

      const result = {
        success: true,
        distanceKm,
        distanceFormatted: formatDistance(distanceKm),
        durationMinutes,
        durationFormatted: formatDuration(durationMinutes),
        geometry,
        mode,
        estimatedCo2Kg: estimateCo2(mode, distanceKm),
        source: 'osrm',
      };

      if (routeCache.size >= 40) {
        const firstKey = routeCache.keys().next().value;
        routeCache.delete(firstKey);
      }
      routeCache.set(cacheKey, result);

      return result;
    }

    throw new Error(data.message || 'OSRM could not find a traversable road route.');
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('OSRM routing request failed or timed out, using geodesic calculation:', err.message);

    // Fallback: Haversine distance with realistic road/transit tortuosity factor (1.25x)
    const directKm = calculateHaversineDistance(oLat, oLng, dLat, dLng);
    const estimatedRoadKm = parseFloat((directKm * 1.25).toFixed(1));
    const drivingSeconds = (estimatedRoadKm / 60) * 3600; // assume 60 km/h baseline
    const durationMinutes = computeModeDuration(mode, estimatedRoadKm, drivingSeconds);

    const fallbackResult = {
      success: true,
      distanceKm: estimatedRoadKm,
      distanceFormatted: formatDistance(estimatedRoadKm),
      durationMinutes,
      durationFormatted: formatDuration(durationMinutes),
      geometry: [
        [oLat, oLng],
        [dLat, dLng],
      ],
      mode,
      estimatedCo2Kg: estimateCo2(mode, estimatedRoadKm),
      source: 'haversine_fallback',
    };

    routeCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
