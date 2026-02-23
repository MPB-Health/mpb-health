import { checkStateEligibilityFromDB, getSupportedStates } from './geoLocationService';

interface GeoLocationData {
  state?: string;
  stateName?: string;
  zipCode?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isRestricted: boolean;
  message?: string;
  detectionMethod?: 'ip' | 'browser' | 'zip' | 'manual' | 'cached';
}

// Cache for geo-location data (5 minute TTL)
const GEO_CACHE_KEY = 'mpb_geo_location';
const GEO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface GeoCache {
  data: GeoLocationData;
  timestamp: number;
}

/**
 * Get cached geo-location data if valid
 */
const getCachedGeoLocation = (): GeoLocationData | null => {
  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: GeoCache = JSON.parse(cached);
    if (Date.now() - timestamp > GEO_CACHE_TTL) {
      sessionStorage.removeItem(GEO_CACHE_KEY);
      return null;
    }

    return { ...data, detectionMethod: 'cached' };
  } catch {
    return null;
  }
};

/**
 * Cache geo-location data
 */
const cacheGeoLocation = (data: GeoLocationData): void => {
  try {
    const cache: GeoCache = { data, timestamp: Date.now() };
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Silently fail if storage is unavailable
  }
};

// State code to name mapping
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Fallback hardcoded values (used when DB is unavailable)
const FALLBACK_SUPPORTED_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const FALLBACK_RESTRICTED_STATES: string[] = [];

/**
 * Check state eligibility - tries database first, falls back to hardcoded
 */
export const checkStateEligibility = (stateCode: string): GeoLocationData => {
  const normalizedState = stateCode.toUpperCase().trim();

  // Use fallback for synchronous calls (existing code compatibility)
  if (!FALLBACK_SUPPORTED_STATES.includes(normalizedState)) {
    return {
      state: normalizedState,
      isRestricted: true,
      message: `We're sorry, but MPB Health services are currently not available in ${normalizedState}. Please contact us at (855) 816-4650 to discuss alternative options.`
    };
  }

  if (FALLBACK_RESTRICTED_STATES.includes(normalizedState)) {
    return {
      state: normalizedState,
      isRestricted: true,
      message: `Health sharing services in ${normalizedState} have specific requirements. Please contact us at (855) 816-4650 for more information.`
    };
  }

  return {
    state: normalizedState,
    isRestricted: false
  };
};

/**
 * Async version that checks database for state eligibility
 * Use this for new code that can handle async operations
 */
export const checkStateEligibilityAsync = async (stateCode: string): Promise<GeoLocationData> => {
  const normalizedState = stateCode.toUpperCase().trim();

  try {
    const result = await checkStateEligibilityFromDB(normalizedState);
    
    if (!result.is_eligible) {
      return {
        state: result.state_code,
        isRestricted: true,
        message: result.message
      };
    }

    if (result.is_restricted) {
      return {
        state: result.state_code,
        isRestricted: true,
        message: result.message
      };
    }

    return {
      state: result.state_code,
      isRestricted: false
    };
  } catch (error) {
    console.warn('Database check failed, using fallback:', error);
    return checkStateEligibility(normalizedState);
  }
};

export const getGeoLocationFromIP = async (skipCache = false): Promise<GeoLocationData> => {
  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cached = getCachedGeoLocation();
    if (cached) {
      return cached;
    }
  }

  // Try multiple geo APIs with fallback
  const geoApis = [
    {
      url: 'https://api.bigdatacloud.net/data/ip-geolocation-full?localityLanguage=en',
      parseResponse: (data: any) => ({
        stateCode: data.principalSubdivisionCode?.replace('US-', ''),
        stateName: data.principalSubdivision,
        city: data.city || data.locality,
        country: data.countryCode,
        latitude: typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude),
        longitude: typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude),
      }),
    },
  ];

  for (const api of geoApis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue; // Try next API
      }

      const data = await response.json();
      const parsed = api.parseResponse(data);

      if (parsed.stateCode && /^[A-Z]{2}$/i.test(parsed.stateCode)) {
        const eligibility = checkStateEligibility(parsed.stateCode);
        const result: GeoLocationData = {
          ...eligibility,
          state: parsed.stateCode.toUpperCase(),
          stateName: (parsed as any).stateName || STATE_NAMES[parsed.stateCode.toUpperCase()],
          city: parsed.city,
          country: parsed.country,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          detectionMethod: 'ip',
        };

        // Cache successful result
        cacheGeoLocation(result);
        return result;
      }
    } catch {
      // Silently try next API
      continue;
    }
  }

  // All APIs failed - return graceful fallback
  return {
    isRestricted: false,
    message: 'Unable to detect location automatically. Please enter your ZIP code to continue.',
    detectionMethod: 'ip',
  };
};

/**
 * Get geo-location using browser's Geolocation API (requires user permission)
 * Falls back to IP-based detection if denied or unavailable
 */
export const getGeoLocationFromBrowser = async (): Promise<GeoLocationData> => {
  // Check cache first
  const cached = getCachedGeoLocation();
  if (cached) {
    return cached;
  }

  // Check if browser geolocation is available
  if (!navigator.geolocation) {
    return getGeoLocationFromIP();
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // 5 minutes
      });
    });

    const { latitude, longitude } = position.coords;

    // Reverse geocode using BigDataCloud (free, no API key required)
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (response.ok) {
        const data = await response.json();
        const stateCode = data.principalSubdivisionCode?.replace('US-', '') || '';

        if (stateCode && /^[A-Z]{2}$/.test(stateCode)) {
          const eligibility = checkStateEligibility(stateCode);
          const result: GeoLocationData = {
            ...eligibility,
            state: stateCode,
            stateName: data.principalSubdivision || STATE_NAMES[stateCode],
            city: data.city || data.locality,
            country: data.countryCode,
            latitude,
            longitude,
            detectionMethod: 'browser',
          };

          cacheGeoLocation(result);
          return result;
        }
      }
    } catch {
      // Reverse geocode failed, fall through to IP detection
    }

    // Have coordinates but couldn't reverse geocode - fall back to IP
    return getGeoLocationFromIP();
  } catch {
    // User denied permission or error - fall back to IP
    return getGeoLocationFromIP();
  }
};

/**
 * Smart geo-location detection - tries browser first (if permitted), then IP
 */
export const detectUserLocation = async (): Promise<GeoLocationData> => {
  // Check cache first
  const cached = getCachedGeoLocation();
  if (cached) {
    return cached;
  }

  // Try IP-based detection first (faster, no permission needed)
  const ipResult = await getGeoLocationFromIP();

  // If IP detection succeeded with a state, use it
  if (ipResult.state) {
    return ipResult;
  }

  // IP failed, try browser geolocation as fallback
  return getGeoLocationFromBrowser();
};

/**
 * Clear cached geo-location data
 */
export const clearGeoLocationCache = (): void => {
  try {
    sessionStorage.removeItem(GEO_CACHE_KEY);
  } catch {
    // Silently fail
  }
};

export const getStateFromZipCode = async (zipCode: string): Promise<GeoLocationData> => {
  const cleanZip = zipCode.trim();

  if (!/^\d{5}$/.test(cleanZip)) {
    return {
      zipCode: cleanZip,
      isRestricted: false,
      message: 'Please enter a valid 5-digit ZIP code.',
      detectionMethod: 'zip',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        zipCode: cleanZip,
        isRestricted: false,
        message: 'Unable to verify ZIP code. Please ensure it is correct.',
        detectionMethod: 'zip',
      };
    }

    const data = await response.json();
    const place = data.places?.[0];
    const stateCode = place?.['state abbreviation'];

    if (!stateCode) {
      return {
        zipCode: cleanZip,
        isRestricted: false,
        message: 'Unable to determine state from ZIP code.',
        detectionMethod: 'zip',
      };
    }

    const eligibility = checkStateEligibility(stateCode);
    const result: GeoLocationData = {
      ...eligibility,
      zipCode: cleanZip,
      state: stateCode,
      stateName: place?.state || STATE_NAMES[stateCode],
      city: place?.['place name'],
      country: 'US',
      latitude: place?.latitude ? parseFloat(place.latitude) : undefined,
      longitude: place?.longitude ? parseFloat(place.longitude) : undefined,
      detectionMethod: 'zip',
    };

    // Cache the result
    cacheGeoLocation(result);
    return result;
  } catch (error) {
    if (import.meta.env.PROD) {
      console.warn('ZIP code validation failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return {
      zipCode: cleanZip,
      isRestricted: false,
      message: 'Unable to validate ZIP code at this time. Please continue and we will verify during enrollment.',
      detectionMethod: 'zip',
    };
  }
};

export const SUPPORTED_STATES_LIST = FALLBACK_SUPPORTED_STATES;

/**
 * Get supported states list from database (async)
 */
export const getSupportedStatesList = async (): Promise<string[]> => {
  try {
    const states = await getSupportedStates();
    return states.map(s => s.state_code);
  } catch (_error) {
    console.warn('Failed to fetch supported states from DB, using fallback');
    return FALLBACK_SUPPORTED_STATES;
  }
};
