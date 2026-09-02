/**
 * World Model & Global Regional Knowledge Base
 * 
 * Provides real geographic intelligence, regulatory bodies, climate heuristics,
 * currency formats, and local market dynamics for multi-tenant adaptability.
 */

export interface RegionalProfile {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  currencyFormat: (amount: number) => string;
  timezone: string;
  climateZone: string;
  currentSeasonalFocus: string;
  regulatoryBodies: {
    name: string;
    code: string;
    description: string;
  }[];
  topTrades: {
    id: string;
    label: string;
    averageTicket: number;
    peakSeason: string;
    regulatoryStandard: string;
    primaryPainPoint: string;
  }[];
  territoryMetrics: {
    averageCAC: number;
    typicalCPC: number;
    recommendedMonthlyBudget: number;
    activeCompetitorDensity: 'Low' | 'Moderate' | 'High' | 'Severe';
  };
}

export const GLOBAL_REGIONS: Record<string, RegionalProfile> = {
  'dallas-tx': {
    id: 'dallas-tx',
    city: 'Dallas',
    region: 'Texas',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyFormat: (n) => `$${n.toLocaleString('en-US')}`,
    timezone: 'America/Chicago',
    climateZone: 'Subtropical / Extreme Summer Heat (105°F+)',
    currentSeasonalFocus: 'Peak Summer Cooling Overload & Capacitor Stress',
    regulatoryBodies: [
      { name: 'Texas Department of Licensing & Regulation', code: 'TDLR TACLA', description: 'Class A Environmental Air Conditioning' },
      { name: 'EPA Clean Air Act Section 608', code: 'EPA 608', description: 'Universal Refrigerant Handling Certification' },
      { name: 'Texas State Board of Plumbing Examiners', code: 'TSBPE', description: 'Master Plumber Licensure' }
    ],
    topTrades: [
      {
        id: 'hvac',
        label: 'HVAC & Refrigeration',
        averageTicket: 3400,
        peakSeason: 'May – September (Extreme Cooling)',
        regulatoryStandard: 'TDLR TACLA Class A',
        primaryPainPoint: 'Dual run capacitor failure and compressor locked rotor amps under 105°F heat load'
      },
      {
        id: 'roofing',
        label: 'Storm Restoration & Roofing',
        averageTicket: 12500,
        peakSeason: 'March – June (Hail & Wind Season)',
        regulatoryStandard: 'RCAT Licensed Commercial/Residential',
        primaryPainPoint: 'Insurance supplement bottlenecks, hail damage documentation, and public adjuster timelines'
      },
      {
        id: 'plumbing',
        label: 'Plumbing & Drain Services',
        averageTicket: 1850,
        peakSeason: 'Year-Round / Winter Freeze Snaps',
        regulatoryStandard: 'TSBPE Master Plumber',
        primaryPainPoint: 'Expansive clay soil shifting causing foundation sewer line shear and cast iron corrosion'
      }
    ],
    territoryMetrics: {
      averageCAC: 145,
      typicalCPC: 38.50,
      recommendedMonthlyBudget: 4500,
      activeCompetitorDensity: 'Severe'
    }
  },
  'columbus-oh': {
    id: 'columbus-oh',
    city: 'Columbus',
    region: 'Ohio',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyFormat: (n) => `$${n.toLocaleString('en-US')}`,
    timezone: 'America/New_York',
    climateZone: 'Humid Continental / Severe Winter Freeze (-10°F)',
    currentSeasonalFocus: 'Fall Furnace Recommissioning & Heat Exchanger Safety',
    regulatoryBodies: [
      { name: 'Ohio Construction Industry Licensing Board', code: 'OCILB #HVAC', description: 'State Licensed HVAC & Hydronics' },
      { name: 'EPA Clean Air Act Section 608', code: 'EPA 608', description: 'Universal Refrigerant Certification' }
    ],
    topTrades: [
      {
        id: 'hvac',
        label: 'HVAC & Heating Systems',
        averageTicket: 2900,
        peakSeason: 'October – March (Heating Season)',
        regulatoryStandard: 'OCILB State Certified',
        primaryPainPoint: 'Cracked heat exchanger carbon monoxide leaks, inducer motor failure, and pilot ignition lockout'
      },
      {
        id: 'roofing',
        label: 'Residential Roofing & Siding',
        averageTicket: 9800,
        peakSeason: 'April – October',
        regulatoryStandard: 'OCILB General Contractor',
        primaryPainPoint: 'Ice dam formation in gutters causing eave water intrusion and attic mold'
      }
    ],
    territoryMetrics: {
      averageCAC: 120,
      typicalCPC: 28.00,
      recommendedMonthlyBudget: 3500,
      activeCompetitorDensity: 'High'
    }
  },
  'winnipeg-mb': {
    id: 'winnipeg-mb',
    city: 'Winnipeg',
    region: 'Manitoba',
    country: 'Canada',
    countryCode: 'CA',
    flag: '🇨🇦',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    currencyFormat: (n) => `CA$${n.toLocaleString('en-CA')}`,
    timezone: 'America/Winnipeg',
    climateZone: 'Subarctic Continental / Extreme Freeze (-35°C to +35°C)',
    currentSeasonalFocus: 'Pre-Freeze High-Efficiency Boiler Prep & Sump Protection',
    regulatoryBodies: [
      { name: 'Red Seal Interprovincial Standard', code: 'Red Seal Journeyperson', description: 'National Canadian Trade Standard' },
      { name: 'Apprenticeship Manitoba & Office of the Fire Commissioner', code: 'OFC Gas & Refrigeration', description: 'MB Class A Gas & Heating Licensure' }
    ],
    topTrades: [
      {
        id: 'plumbing',
        label: 'Mechanical, Heating & Plumbing',
        averageTicket: 3200,
        peakSeason: 'November – March (Deep Freeze)',
        regulatoryStandard: 'Red Seal Journeyperson Plumber',
        primaryPainPoint: 'Sub-zero frozen supply lines, spring snowmelt basement flooding, and high-efficiency combi boiler flame failures'
      },
      {
        id: 'hvac',
        label: 'Commercial & Residential HVAC',
        averageTicket: 4100,
        peakSeason: 'Dual Peak (January Deep Freeze / July Heat)',
        regulatoryStandard: 'Manitoba OFC Gas Class A',
        primaryPainPoint: 'Extreme temperature swing thermal shock on rooftop packaged units'
      }
    ],
    territoryMetrics: {
      averageCAC: 135,
      typicalCPC: 31.00,
      recommendedMonthlyBudget: 3800,
      activeCompetitorDensity: 'Moderate'
    }
  },
  'dubai-uae': {
    id: 'dubai-uae',
    city: 'Dubai',
    region: 'Emirate of Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'AED ',
    currencyFormat: (n) => `AED ${n.toLocaleString('en-AE')}`,
    timezone: 'Asia/Dubai',
    climateZone: 'Hyper-Arid Desert / Extreme Summer (50°C / 122°F)',
    currentSeasonalFocus: 'Extreme Summer Continuous Cooling & District Chiller Diagnostics',
    regulatoryBodies: [
      { name: 'Dubai Municipality Building Department', code: 'DM Green Building', description: 'Al Sa\'fat Green Building Regulations' },
      { name: 'Dubai Economy & Tourism', code: 'DET Commercial License', description: 'Authorized MEP Contractor Licensure' },
      { name: 'Dubai Civil Defence', code: 'DCD Approved', description: 'Fire Protection & MEP Safety Compliance' }
    ],
    topTrades: [
      {
        id: 'hvac',
        label: 'District Cooling & Central MEP',
        averageTicket: 8500,
        peakSeason: 'April – October (Severe 50°C Summer)',
        regulatoryStandard: 'DM Green Building Al Sa\'fat Certified',
        primaryPainPoint: 'Severe sand infiltration in condenser coils, high humidity corrosion, and continuous 24/7 compressor wear'
      },
      {
        id: 'electrical',
        label: 'Commercial MEP & Electrical Infrastructure',
        averageTicket: 14200,
        peakSeason: 'Year-Round Commercial Development',
        regulatoryStandard: 'DEWA Approved Contractor',
        primaryPainPoint: 'DEWA sub-metering compliance, phase unbalance diagnostics, and high-ambient breaker tripping'
      }
    ],
    territoryMetrics: {
      averageCAC: 320,
      typicalCPC: 65.00,
      recommendedMonthlyBudget: 12000,
      activeCompetitorDensity: 'Severe'
    }
  },
  'kampala-ug': {
    id: 'kampala-ug',
    city: 'Kampala',
    region: 'Central Region',
    country: 'Uganda',
    countryCode: 'UG',
    flag: '🇺🇬',
    currencyCode: 'UGX',
    currencySymbol: 'USh ',
    currencyFormat: (n) => `USh ${n.toLocaleString('en-UG')}`,
    timezone: 'Africa/Kampala',
    climateZone: 'Tropical Highland / Bimodal Rainy & Dry Seasons',
    currentSeasonalFocus: 'Commercial Solar Off-Grid Storage & Voltage Surge Hardening',
    regulatoryBodies: [
      { name: 'Electricity Regulatory Authority', code: 'ERA Licensed', description: 'Class A/B Electrical Installation Permit' },
      { name: 'Uganda National Bureau of Standards', code: 'UNBS Certified', description: 'Solar & Inverter Quality Assurance Standard' }
    ],
    topTrades: [
      {
        id: 'solar',
        label: 'Solar Energy & Commercial Storage',
        averageTicket: 8500000,
        peakSeason: 'Dry Season Commercial Installs (June – August / Dec – Feb)',
        regulatoryStandard: 'ERA Class A Solar PV',
        primaryPainPoint: 'Grid instability and frequent load shedding requiring hybrid lithium battery bank failovers and MPPT charge controller calibration'
      },
      {
        id: 'electrical',
        label: 'Industrial Electrical & Power Backup',
        averageTicket: 4200000,
        peakSeason: 'Year-Round Industrial Expansion',
        regulatoryStandard: 'ERA Master Installation',
        primaryPainPoint: 'Severe lightning grid surges, ungrounded phase spikes, and diesel generator automatic transfer switch (ATS) failures'
      }
    ],
    territoryMetrics: {
      averageCAC: 180000,
      typicalCPC: 12000,
      recommendedMonthlyBudget: 2500000,
      activeCompetitorDensity: 'Moderate'
    }
  },
  'london-uk': {
    id: 'london-uk',
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    currencyFormat: (n) => `£${n.toLocaleString('en-GB')}`,
    timezone: 'Europe/London',
    climateZone: 'Temperate Maritime / Damp Winter Chills',
    currentSeasonalFocus: 'Condensing Boiler Efficiency & Heat Pump Decarbonization',
    regulatoryBodies: [
      { name: 'Gas Safe Register', code: 'Gas Safe #Registered', description: 'Mandatory UK Gas Installation Certification' },
      { name: 'NICEIC / ELECSA', code: 'NICEIC Approved Contractor', description: 'UK Electrical Safety Compliance' },
      { name: 'Microgeneration Certification Scheme', code: 'MCS Certified', description: 'Heat Pump & Solar UK Grant Standard' }
    ],
    topTrades: [
      {
        id: 'plumbing',
        label: 'Gas Heating, Boilers & Plumbing',
        averageTicket: 2600,
        peakSeason: 'September – March (Heating Season)',
        regulatoryStandard: 'Gas Safe Registered & Part L Certified',
        primaryPainPoint: 'Limescale heat exchanger clogging, frozen condensate lines, and aging radiator sludge circulation'
      },
      {
        id: 'solar',
        label: 'Air Source Heat Pumps & Solar',
        averageTicket: 9500,
        peakSeason: 'Spring – Autumn Boiler Upgrade Scheme',
        regulatoryStandard: 'MCS Certified Installer',
        primaryPainPoint: 'BUS grant submission delays, low flow-temperature radiator sizing, and acoustic decibel planning compliance'
      }
    ],
    territoryMetrics: {
      averageCAC: 165,
      typicalCPC: 34.00,
      recommendedMonthlyBudget: 4200,
      activeCompetitorDensity: 'High'
    }
  }
};

/**
 * Resolves the best regional profile matching city and country strings.
 */
export function resolveRegionalProfile(city?: string, country?: string): RegionalProfile {
  if (!city) return GLOBAL_REGIONS['dallas-tx'];
  
  const lowerCity = city.toLowerCase();
  
  if (lowerCity.includes('dallas') || lowerCity.includes('texas') || lowerCity.includes('tx')) {
    return GLOBAL_REGIONS['dallas-tx'];
  }
  if (lowerCity.includes('columbus') || lowerCity.includes('ohio') || lowerCity.includes('oh')) {
    return GLOBAL_REGIONS['columbus-oh'];
  }
  if (lowerCity.includes('winnipeg') || lowerCity.includes('manitoba') || lowerCity.includes('mb') || lowerCity.includes('canada')) {
    return GLOBAL_REGIONS['winnipeg-mb'];
  }
  if (lowerCity.includes('dubai') || lowerCity.includes('uae') || lowerCity.includes('emirates')) {
    return GLOBAL_REGIONS['dubai-uae'];
  }
  if (lowerCity.includes('kampala') || lowerCity.includes('uganda')) {
    return GLOBAL_REGIONS['kampala-ug'];
  }
  if (lowerCity.includes('london') || lowerCity.includes('uk') || lowerCity.includes('england') || lowerCity.includes('britain')) {
    return GLOBAL_REGIONS['london-uk'];
  }

  // Fallback match by country
  if (country) {
    const lowerCountry = country.toLowerCase();
    if (lowerCountry.includes('canada')) return GLOBAL_REGIONS['winnipeg-mb'];
    if (lowerCountry.includes('emirates') || lowerCountry.includes('uae')) return GLOBAL_REGIONS['dubai-uae'];
    if (lowerCountry.includes('uganda')) return GLOBAL_REGIONS['kampala-ug'];
    if (lowerCountry.includes('uk') || lowerCountry.includes('united kingdom')) return GLOBAL_REGIONS['london-uk'];
  }

  // Custom localized fallback derived on-the-fly
  return {
    id: `custom-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    city: city,
    region: 'Regional Operating Zone',
    country: country || 'Global Territory',
    countryCode: 'GL',
    flag: '🌐',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyFormat: (n) => `$${n.toLocaleString('en-US')}`,
    timezone: 'UTC',
    climateZone: 'Local Operating Climate',
    currentSeasonalFocus: 'Active Seasonal Field Optimization',
    regulatoryBodies: [
      { name: 'Municipal Licensing Board', code: 'Trade License Active', description: 'Local Commercial Compliance' },
      { name: 'Regional Environmental Standard', code: 'Standard Certified', description: 'Safety and Trade Verification' }
    ],
    topTrades: [
      {
        id: 'trade',
        label: 'Field Services & Trade Operations',
        averageTicket: 2500,
        peakSeason: 'High Demand Operating Season',
        regulatoryStandard: 'Licensed Commercial Contractor',
        primaryPainPoint: 'Local customer acquisition cost and rapid dispatch efficiency'
      }
    ],
    territoryMetrics: {
      averageCAC: 150,
      typicalCPC: 30.00,
      recommendedMonthlyBudget: 4000,
      activeCompetitorDensity: 'Moderate'
    }
  };
}
