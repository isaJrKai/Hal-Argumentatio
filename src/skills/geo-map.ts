import { Skill } from './types';
import { and, eq, ilike } from 'drizzle-orm';
import { db as pgDb } from '../db/index.ts';
import { leads as leadsTable } from '../db/schema.ts';

export const geoMapSkill: Skill = {
  id: 'geo_map',
  name: 'Territory Map Visualizer',
  description: 'Maps tenant-owned prospects at verified city-centroid precision. It does not invent individual business coordinates or infer a street address from a city name.',
  category: 'geo',
  icon: 'Map',
  inputs: [
    { name: 'city', label: 'Target City', type: 'string', required: true, defaultValue: '' }
  ],
  execute: async (inputs, contractorId) => {
    const city = String(inputs.city || '').trim();
    if (!city) throw new Error('Target City is required for territory mapping.');

    const filters = [
      eq(leadsTable.contractorId, contractorId),
      ilike(leadsTable.city, city)
    ];
    const filteredLeads = await pgDb.select({
      id: leadsTable.id,
      businessName: leadsTable.businessName,
      ownerName: leadsTable.ownerName,
      city: leadsTable.city,
      serviceType: leadsTable.niche,
      googleRating: leadsTable.googleRating,
      reviewCount: leadsTable.reviewCount,
      seoScore: leadsTable.seoScore,
      performanceScore: leadsTable.performanceScore,
      sslStatus: leadsTable.sslStatus,
      urgencyScore: leadsTable.urgencyScore,
      predictedLtvUsd: leadsTable.predictedLtv,
      status: leadsTable.status
    }).from(leadsTable).where(and(...filters));

    const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geocodeUrl.searchParams.set('name', city);
    geocodeUrl.searchParams.set('count', '1');
    geocodeUrl.searchParams.set('language', 'en');
    geocodeUrl.searchParams.set('format', 'json');

    const response = await fetch(geocodeUrl.toString(), { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`City geocoding provider returned HTTP ${response.status}.`);
    const geocode = await response.json();
    const match = Array.isArray(geocode.results) ? geocode.results[0] : null;
    if (!match || !Number.isFinite(match.latitude) || !Number.isFinite(match.longitude)) {
      throw new Error(`No verified city-centroid coordinates were returned for "${city}". No fallback location was used.`);
    }

    const center = {
      lat: Number(match.latitude),
      lng: Number(match.longitude),
      city: String(match.name || city),
      country: String(match.country || '')
    };

    // The only available location is the lead's saved city. Do not distribute
    // leads around a fabricated radius or imply their exact business addresses.
    const mappedLeads = filteredLeads.map(lead => ({
      id: lead.id,
      businessName: lead.businessName,
      ownerName: lead.ownerName,
      city: lead.city,
      serviceType: lead.serviceType,
      googleRating: lead.googleRating,
      reviewCount: lead.reviewCount,
      seoScore: lead.seoScore,
      performanceScore: lead.performanceScore,
      sslStatus: lead.sslStatus,
      urgencyScore: lead.urgencyScore,
      predictedLtvUsd: lead.predictedLtvUsd,
      status: lead.status,
      coords: { lat: center.lat, lng: center.lng },
      locationPrecision: 'city_centroid'
    }));

    return {
      success: true,
      city: center.city,
      country: center.country,
      center,
      leads: mappedLeads,
      locationPrecision: 'city_centroid',
      businessAddressesGeocoded: false,
      message: `Mapped ${mappedLeads.length} tenant-owned leads to the verified city centroid. Individual business coordinates and addresses were not available.`
    };
  }
};
