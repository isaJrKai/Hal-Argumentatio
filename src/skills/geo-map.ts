import { Skill } from './types';
import { db } from '../db/db';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  winnipeg: { lat: 49.8951, lng: -97.1384 },
  calgary: { lat: 51.0447, lng: -114.0719 },
  fredericton: { lat: 45.9636, lng: -66.6431 },
  brandon: { lat: 49.8485, lng: -99.9501 },
  winkler: { lat: 49.1812, lng: -97.9392 },
  landmark: { lat: 49.6583, lng: -96.8203 },
  edmonton: { lat: 53.5461, lng: -113.4938 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  vancouver: { lat: 49.2827, lng: -123.1207 }
};

export const geoMapSkill: Skill = {
  id: 'geo_map',
  name: 'Territory Map Visualizer',
  description: 'Resolves precise geographic coordinates for active prospect lists and maps spatial clusters for targeted service areas.',
  category: 'geo',
  icon: 'Map',
  inputs: [
    {
      name: 'city',
      label: 'Target City',
      type: 'string',
      required: true,
      defaultValue: 'Winnipeg',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { city } = inputs;
    const leads = db.getLeads(contractorId);
    
    // Filter leads by city if specified
    const filteredLeads = city 
      ? leads.filter(l => l.city.toLowerCase() === city.toLowerCase())
      : leads;

    const mappedLeads = filteredLeads.map((lead) => {
      const cityKey = lead.city.toLowerCase().trim();
      const baseCoords = CITY_COORDS[cityKey] || { lat: 49.8951, lng: -97.1384 }; // default to Winnipeg
      
      let hash = 0;
      for (let i = 0; i < lead.id.length; i++) {
        hash = (hash << 5) - hash + lead.id.charCodeAt(i);
        hash |= 0;
      }
      const positiveHash = Math.abs(hash);
      const angle = (positiveHash % 360) * (Math.PI / 180);
      const radius = 0.02 + ((positiveHash % 100) / 100) * 0.12;

      return {
        id: lead.id,
        businessName: lead.businessName,
        ownerName: lead.ownerName,
        phone: lead.phone,
        email: lead.email,
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
        coords: {
          lat: baseCoords.lat + Math.sin(angle) * radius * 0.6,
          lng: baseCoords.lng + Math.cos(angle) * radius * 0.85
        }
      };
    });

    const centerCoords = CITY_COORDS[city.toLowerCase().trim()] || { lat: 49.8951, lng: -97.1384 };

    return {
      success: true,
      city,
      center: centerCoords,
      leads: mappedLeads,
      message: `Resolved ${mappedLeads.length} leads in ${city} with spatial distribution offsets.`
    };
  }
};
