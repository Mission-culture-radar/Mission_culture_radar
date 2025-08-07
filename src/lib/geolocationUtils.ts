// Define the shape of an Activity, matching MapPage.tsx
export interface Activity {
  id: number;
  address: {
    coordinates: [number, number]; // [lng, lat]
  } | null;
}

// Local cache for reverse geocoding
const locationCache: Record<number, string> = {};

// Determine the correct User-Agent based on the host
export const getUserAgent = (): string => {
  const host = window.location.hostname;
  if (host.includes('localhost')) return 'CultureRadarDev/0.1 (+http://localhost:5173)';
  if (host.includes('ias-b3-lyon-g2.site')) return 'CultureRadar/1.0 (+https://ias-b3-lyon-g2.site/)';
  return 'CultureRadar/1.0 (+https://cultureradar.fr)';
};

// Perform reverse geocoding with caching
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const cacheKey = `geocode:${lat.toFixed(6)}:${lng.toFixed(6)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: { 'User-Agent': getUserAgent() },
      }
    );
    const json = await response.json();
    const display = json.display_name || 'Adresse non trouvée';
    const parts = display.split(',').map((s: string) => s.trim());
    const isFirstPartNumeric = /^\d+/.test(parts[0]);
    const truncated = parts.slice(0, isFirstPartNumeric ? 2 : 3).join(', ');
    localStorage.setItem(cacheKey, truncated);
    return truncated;
  } catch (error) {
    console.warn('Erreur de géocodage inversé:', error);
    return 'Lieu non précisé';
  }
};

/**
 * Given an activity object and state setters, fetch the human-readable location string.
 */
export const fetchLocationText = async (
  activityOrId: Activity | number,
  coords?: { lat?: number | null; lng?: number | null }
): Promise<string> => {
  let lat: number | null | undefined;
  let lng: number | null | undefined;
  let activityId: number;

  if (typeof activityOrId === 'number') {
    activityId = activityOrId;
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
  } else {
    activityId = activityOrId.id;
    if (activityOrId.address?.coordinates?.length === 2) {
      [lng, lat] = activityOrId.address.coordinates;
    }
  }

  if (!lat || !lng) {
    console.warn('❌ Missing coordinates for activity:', activityId);
    return 'Lieu non précisé';
  }

  if (locationCache[activityId]) {
    return locationCache[activityId];
  }

  const loc = await reverseGeocode(lat, lng);
  locationCache[activityId] = loc;
  return loc;
};

