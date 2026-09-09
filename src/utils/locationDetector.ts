import { NER_STATES_DATA, NERState } from '../data/nerLocations';

export interface DetectedLocationResult {
  formattedLocation: string;
  stateName?: string;
  cityName?: string;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  source: 'gps' | 'reverse-geocode' | 'ip' | 'fallback';
  rawAddress?: string;
}

// Known coordinates for North East India centroids & major cities for distance calculation
const NER_CITY_COORDINATES: Array<{ state: string; city: string; lat: number; lng: number }> = [
  // Assam
  { state: 'Assam', city: 'Guwahati (Kamrup Metro)', lat: 26.1445, lng: 91.7362 },
  { state: 'Assam', city: 'Silchar (Cachar)', lat: 24.8333, lng: 92.7789 },
  { state: 'Assam', city: 'Dibrugarh', lat: 27.4728, lng: 94.9120 },
  { state: 'Assam', city: 'Jorhat', lat: 26.7509, lng: 94.2037 },
  { state: 'Assam', city: 'Tezpur (Sonitpur)', lat: 26.6528, lng: 92.7926 },
  { state: 'Assam', city: 'Nagaon', lat: 26.3464, lng: 92.6840 },
  { state: 'Assam', city: 'Tinsukia', lat: 27.4922, lng: 95.3468 },
  { state: 'Assam', city: 'Bongaigaon', lat: 26.5028, lng: 90.5583 },
  { state: 'Assam', city: 'Sivasagar', lat: 26.9826, lng: 94.6425 },
  { state: 'Assam', city: 'North Lakhimpur', lat: 27.2346, lng: 94.1037 },
  { state: 'Assam', city: 'Barpeta', lat: 26.3211, lng: 91.0044 },
  { state: 'Assam', city: 'Majuli Island', lat: 26.9536, lng: 94.2185 },

  // Meghalaya
  { state: 'Meghalaya', city: 'Shillong (East Khasi Hills)', lat: 25.5788, lng: 91.8933 },
  { state: 'Meghalaya', city: 'Tura (West Garo Hills)', lat: 25.5141, lng: 90.2033 },
  { state: 'Meghalaya', city: 'Jowai (West Jaintia Hills)', lat: 25.4452, lng: 92.1983 },
  { state: 'Meghalaya', city: 'Cherrapunji / Sohra', lat: 25.2702, lng: 91.7323 },
  { state: 'Meghalaya', city: 'Nongpoh (Ri-Bhoi)', lat: 25.9034, lng: 91.8804 },

  // Manipur
  { state: 'Manipur', city: 'Imphal (Imphal West / East)', lat: 24.8170, lng: 93.9368 },
  { state: 'Manipur', city: 'Churachandpur (Lamka)', lat: 24.3333, lng: 93.6833 },
  { state: 'Manipur', city: 'Thoubal', lat: 24.6366, lng: 93.9966 },
  { state: 'Manipur', city: 'Bishnupur (Loktak Lake)', lat: 24.6324, lng: 93.7573 },
  { state: 'Manipur', city: 'Ukhrul', lat: 25.1167, lng: 94.3667 },

  // Mizoram
  { state: 'Mizoram', city: 'Aizawl', lat: 23.7271, lng: 92.7176 },
  { state: 'Mizoram', city: 'Lunglei', lat: 22.8848, lng: 92.7428 },
  { state: 'Mizoram', city: 'Champhai', lat: 23.4756, lng: 93.3275 },
  { state: 'Mizoram', city: 'Serchhip', lat: 23.3417, lng: 92.8500 },
  { state: 'Mizoram', city: 'Kolasib', lat: 24.2247, lng: 92.6784 },

  // Nagaland
  { state: 'Nagaland', city: 'Kohima', lat: 25.6751, lng: 94.1086 },
  { state: 'Nagaland', city: 'Dimapur', lat: 25.9068, lng: 93.7271 },
  { state: 'Nagaland', city: 'Mokokchung', lat: 26.3248, lng: 94.5204 },
  { state: 'Nagaland', city: 'Tuensang', lat: 26.2833, lng: 94.8333 },
  { state: 'Nagaland', city: 'Wokha', lat: 26.1000, lng: 94.2667 },

  // Tripura
  { state: 'Tripura', city: 'Agartala (West Tripura)', lat: 23.8315, lng: 91.2868 },
  { state: 'Tripura', city: 'Udaipur (Gomati)', lat: 23.5333, lng: 91.4833 },
  { state: 'Tripura', city: 'Dharmanagar (North Tripura)', lat: 24.3833, lng: 92.1667 },
  { state: 'Tripura', city: 'Kailashahar (Unakoti)', lat: 24.3333, lng: 92.0000 },
  { state: 'Tripura', city: 'Ambassa (Dhalai)', lat: 23.9167, lng: 91.8500 },

  // Arunachal Pradesh
  { state: 'Arunachal Pradesh', city: 'Itanagar (Papum Pare)', lat: 27.0844, lng: 93.6053 },
  { state: 'Arunachal Pradesh', city: 'Naharlagun', lat: 27.1064, lng: 93.6931 },
  { state: 'Arunachal Pradesh', city: 'Pasighat (East Siang)', lat: 28.0667, lng: 95.3333 },
  { state: 'Arunachal Pradesh', city: 'Tawang', lat: 27.5861, lng: 91.8594 },
  { state: 'Arunachal Pradesh', city: 'Ziro (Lower Subansiri)', lat: 27.5950, lng: 93.8385 },
  { state: 'Arunachal Pradesh', city: 'Tezu (Lohit)', lat: 27.9167, lng: 96.1667 },

  // Sikkim
  { state: 'Sikkim', city: 'Gangtok (East Sikkim)', lat: 27.3314, lng: 88.6138 },
  { state: 'Sikkim', city: 'Namchi (South Sikkim)', lat: 27.1667, lng: 88.3500 },
  { state: 'Sikkim', city: 'Geyzing / Gyalshing (West Sikkim)', lat: 27.2833, lng: 88.2500 },
  { state: 'Sikkim', city: 'Pakyong', lat: 27.2403, lng: 88.5900 }
];

// Haversine distance in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Find the closest NER city & state given coordinates
 */
export function findClosestNERLocation(lat: number, lng: number): { state: string; city: string; distanceKm: number } {
  let closest = NER_CITY_COORDINATES[0];
  let minDistance = Infinity;

  for (const item of NER_CITY_COORDINATES) {
    const d = getDistanceFromLatLonInKm(lat, lng, item.lat, item.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = item;
    }
  }

  return {
    state: closest.state,
    city: closest.city,
    distanceKm: Math.round(minDistance)
  };
}

/**
 * Match a detected state / city string to NER_STATES_DATA
 */
export function matchToNERStateAndCity(stateInput?: string, cityInput?: string): { stateName: string; cityName: string } {
  let matchedState: NERState | undefined;

  if (stateInput) {
    const sLower = stateInput.toLowerCase().trim();
    matchedState = NER_STATES_DATA.find(st => 
      st.name.toLowerCase().includes(sLower) || 
      sLower.includes(st.name.toLowerCase()) ||
      st.code.toLowerCase() === sLower
    );
  }

  if (!matchedState && cityInput) {
    const cLower = cityInput.toLowerCase().trim();
    matchedState = NER_STATES_DATA.find(st =>
      st.major_cities.some(c => c.toLowerCase().includes(cLower) || cLower.includes(c.toLowerCase().split(' ')[0]))
    );
  }

  // Default to Assam if no exact match found
  const finalState = matchedState || NER_STATES_DATA[0];
  
  let matchedCity = finalState.major_cities[0];
  if (cityInput) {
    const cLower = cityInput.toLowerCase().trim();
    const cityCandidate = finalState.major_cities.find(c => 
      c.toLowerCase().includes(cLower) || cLower.includes(c.toLowerCase().split(' ')[0])
    );
    if (cityCandidate) {
      matchedCity = cityCandidate;
    }
  }

  return {
    stateName: finalState.name,
    cityName: matchedCity
  };
}

/**
 * Reverse geocode latitude/longitude using Nominatim OSM API or BigDataCloud
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<{ address?: string; state?: string; city?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    // Reverse geocode via OpenStreetMap Nominatim
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const state = addr.state || addr.province || addr.region;
      const city = addr.city || addr.town || addr.municipality || addr.district || addr.county || addr.suburb;
      const displayName = data.display_name || '';

      return {
        address: displayName,
        state: state,
        city: city
      };
    }
  } catch {
    // Fail silently to fallback
  }

  return {};
}

/**
 * IP-based geolocation fallback
 */
async function fetchIpLocation(): Promise<DetectedLocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      const ipCity = data.city || '';
      const ipRegion = data.region || '';
      const country = data.country_name || '';

      if (!isNaN(lat) && !isNaN(lng)) {
        const closest = findClosestNERLocation(lat, lng);
        const isNER = closest.distanceKm < 450; // Within North East India perimeter

        if (isNER) {
          return {
            formattedLocation: `${closest.city}, ${closest.state}, North East India`,
            stateName: closest.state,
            cityName: closest.city,
            coords: { latitude: lat, longitude: lng },
            source: 'ip',
            rawAddress: `${ipCity}, ${ipRegion}, ${country}`
          };
        } else {
          // If outside NER, also resolve best match or detected Indian city
          const matched = matchToNERStateAndCity(ipRegion, ipCity);
          return {
            formattedLocation: ipCity ? `${ipCity}, ${ipRegion}` : `${matched.cityName}, ${matched.stateName}, North East India`,
            stateName: matched.stateName,
            cityName: matched.cityName,
            coords: { latitude: lat, longitude: lng },
            source: 'ip',
            rawAddress: `${ipCity}, ${ipRegion}, ${country}`
          };
        }
      }
    }
  } catch {
    // Secondary IP fallback
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
      const res2 = await fetch('https://ipwho.is/', { signal: controller2.signal });
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const d = await res2.json();
        if (d.success && d.latitude && d.longitude) {
          const closest = findClosestNERLocation(d.latitude, d.longitude);
          return {
            formattedLocation: `${closest.city}, ${closest.state}, North East India`,
            stateName: closest.state,
            cityName: closest.city,
            coords: { latitude: d.latitude, longitude: d.longitude },
            source: 'ip',
            rawAddress: `${d.city}, ${d.region}, ${d.country}`
          };
        }
      }
    } catch {
      // Ignore
    }
  }
  return null;
}

/**
 * Main Auto-Detection Function:
 * Identifies location automatically using GPS -> Reverse Geocoding -> IP Geolocation -> Nearest NER Region.
 */
export async function autoDetectLocation(): Promise<DetectedLocationResult> {
  // 1. Check if browser geolocation is supported
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 60000
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      // Try reverse geocoding to get real street/city/state name
      const revGeo = await reverseGeocodeCoords(lat, lng);
      const closest = findClosestNERLocation(lat, lng);

      let finalState = closest.state;
      let finalCity = closest.city;

      if (revGeo.state || revGeo.city) {
        const matched = matchToNERStateAndCity(revGeo.state, revGeo.city);
        if (matched.stateName) finalState = matched.stateName;
        if (matched.cityName) finalCity = matched.cityName;
      }

      return {
        formattedLocation: `${finalCity}, ${finalState}, North East India`,
        stateName: finalState,
        cityName: finalCity,
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: accuracy
        },
        source: 'gps',
        rawAddress: revGeo.address || `${finalCity}, ${finalState} (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
    } catch (gpsError) {
      console.info('GPS Geolocation unavailable or permission pending, attempting IP auto-detection...', gpsError);
    }
  }

  // 2. Fallback to IP-based detection
  const ipResult = await fetchIpLocation();
  if (ipResult) {
    return ipResult;
  }

  // 3. Final default fallback
  return {
    formattedLocation: 'Guwahati (Kamrup Metro), Assam, North East India',
    stateName: 'Assam',
    cityName: 'Guwahati (Kamrup Metro)',
    coords: {
      latitude: 26.1445,
      longitude: 91.7362
    },
    source: 'fallback'
  };
}
