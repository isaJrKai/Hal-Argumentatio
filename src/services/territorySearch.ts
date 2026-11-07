import { harvestRealBusinesses } from '../lib/gemini';

export interface TerritoryBusinessResult {
  businessName: string;
  city: string;
  serviceType: string;
  address?: string;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  googleMapsUrl: string | null;
  reviews: Array<{ rating: number; text: string; authorName?: string; relativeTime?: string }>;
  reviewSource: string | null;
  sourceType: string;
  verificationStatus: string;
  notes: string;
  groundingEvidence?: Record<string, unknown>;
}

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function geocodeBusiness(address: string, businessName: string, city: string) {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return null;
  const query = address ? `${businessName}, ${address}, ${city}` : `${businessName}, ${city}`;
  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', query);
  url.searchParams.set('limit', '3');
  url.searchParams.set('format', 'json');
  url.searchParams.set('apiKey', key);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Geoapify geocoding failed (${response.status}).`);
  const payload = await response.json() as any;
  const rows = Array.isArray(payload.results) ? payload.results : [];
  const target = normalizeName(businessName);
  const match = rows.find((row: any) => {
    const label = normalizeName(String(row.name || row.address_line1 || ''));
    const confidence = Number(row.rank?.confidence ?? row.rank?.confidence_city_level ?? 0);
    return confidence >= 0.75 && (label === target || label.includes(target) || target.includes(label));
  });
  if (!match || !Number.isFinite(Number(match.lat)) || !Number.isFinite(Number(match.lon))) return null;
  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
    formattedAddress: String(match.formatted || address || ''),
    confidence: Number(match.rank?.confidence ?? 0),
    resultType: String(match.result_type || 'unknown')
  };
}

async function lookupGooglePlace(businessName: string, city: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.reviews'
    },
    body: JSON.stringify({ textQuery: `${businessName}, ${city}`, pageSize: 3 }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    // A configured but unavailable Places credential should be visible to the caller,
    // not silently replaced with model-generated review data.
    throw new Error(`Google Places lookup failed (${response.status}).`);
  }
  const payload = await response.json() as any;
  const target = normalizeName(businessName);
  const places = Array.isArray(payload.places) ? payload.places : [];
  const match = places.find((place: any) => {
    const candidate = normalizeName(String(place.displayName?.text || ''));
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
  if (!match) return null;
  return {
    googleRating: Number.isFinite(Number(match.rating)) ? Number(match.rating) : null,
    reviewCount: Number.isFinite(Number(match.userRatingCount)) ? Number(match.userRatingCount) : null,
    googleMapsUrl: typeof match.googleMapsUri === 'string' ? match.googleMapsUri : null,
    reviews: (Array.isArray(match.reviews) ? match.reviews : []).slice(0, 5).map((review: any) => ({
      rating: Number(review.rating) || 0,
      text: String(review.text?.text || ''),
      authorName: review.authorAttribution?.displayName || undefined,
      relativeTime: review.relativePublishTimeDescription || undefined
    })).filter((review: any) => review.text),
    formattedAddress: match.formattedAddress || null,
    location: match.location || null,
    placeId: match.id || null
  };
}

/**
 * Shared territory discovery service used by the map API and HAL's agent tools.
 * Search candidates are not CRM records until a user explicitly imports them.
 * Missing location or review data remains null; no synthetic pins or metrics.
 */
export async function searchTerritoryBusinesses(input: {
  city: string;
  niche: string;
  limit?: number;
  preferredAI?: string;
}): Promise<{ city: string; niche: string; count: number; providers: { discovery: string; geocoding: string; reviews: string }; results: TerritoryBusinessResult[] }> {
  const city = String(input.city || '').trim();
  const niche = String(input.niche || '').trim();
  if (!city || !niche) throw new Error('A city/territory and trade or business type are required.');
  if (city.length > 160 || niche.length > 120) throw new Error('Search terms exceed the allowed length.');
  const limit = Math.min(50, Math.max(1, Math.floor(Number(input.limit) || 20)));
  const candidates = await harvestRealBusinesses(city, niche, input.preferredAI, limit);
  const results = await Promise.all(candidates.map(async candidate => {
    let geocoded: Awaited<ReturnType<typeof geocodeBusiness>> = null;
    let place: Awaited<ReturnType<typeof lookupGooglePlace>> = null;
    const warnings: string[] = [];
    try {
      geocoded = await geocodeBusiness(candidate.address || '', candidate.businessName, city);
    } catch (error: any) {
      warnings.push(error?.message || 'Location lookup unavailable.');
    }
    try {
      place = await lookupGooglePlace(candidate.businessName, city);
    } catch (error: any) {
      warnings.push(error?.message || 'Google Places lookup unavailable.');
    }
    const location = place?.location;
    const latitude = geocoded?.latitude ?? (Number.isFinite(Number(location?.latitude)) ? Number(location.latitude) : null);
    const longitude = geocoded?.longitude ?? (Number.isFinite(Number(location?.longitude)) ? Number(location.longitude) : null);
    return {
      businessName: candidate.businessName,
      city: candidate.city || city,
      serviceType: candidate.serviceType || niche,
      address: place?.formattedAddress || geocoded?.formattedAddress || candidate.address || undefined,
      websiteUrl: candidate.websiteUrl || undefined,
      phone: candidate.phone || undefined,
      email: candidate.email || undefined,
      latitude,
      longitude,
      locationSource: geocoded ? 'Geoapify' : place?.location ? 'Google Places' : null,
      googleRating: place?.googleRating ?? null,
      reviewCount: place?.reviewCount ?? null,
      googleMapsUrl: place?.googleMapsUrl ?? null,
      reviews: place?.reviews ?? [],
      reviewSource: place ? 'Google Places' : null,
      sourceType: candidate.sourceType,
      verificationStatus: candidate.verificationStatus || 'UNVERIFIED_STAGING',
      notes: [candidate.notes, ...warnings].filter(Boolean).join(' '),
      groundingEvidence: candidate.groundingEvidence || {}
    };
  }));
  return {
    city,
    niche,
    count: results.length,
    providers: {
      discovery: 'Gemini Google Search grounding',
      geocoding: process.env.GEOAPIFY_API_KEY ? 'Geoapify' : (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY) ? 'Google Places' : 'not configured',
      reviews: (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY) ? 'Google Places' : 'not configured'
    },
    results
  };
}
