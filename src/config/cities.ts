export interface CityConfig {
  id: string;
  name: string;
  country: 'Canada' | 'USA';
  provinceOrState: string;
  coords: { lat: number; lng: number };
  defaultZoom: number;
  timezone: string;
  nicheFocus: string[];
  defaultPolygonPoints?: Array<{ lat: number; lng: number }>;
}

export const CITIES_CONFIG: CityConfig[] = [
  // Canada - Manitoba
  {
    id: 'winnipeg',
    name: 'Winnipeg',
    country: 'Canada',
    provinceOrState: 'MB',
    coords: { lat: 49.8951, lng: -97.1384 },
    defaultZoom: 11,
    timezone: 'America/Winnipeg',
    nicheFocus: ['custom home builders', 'commercial landscaping', 'emergency restoration', 'hvac service', 'roofing contractors'],
    defaultPolygonPoints: [
      { lat: 49.9800, lng: -97.2600 },
      { lat: 49.9800, lng: -97.0200 },
      { lat: 49.8100, lng: -97.0200 },
      { lat: 49.8100, lng: -97.2600 }
    ]
  },
  {
    id: 'brandon',
    name: 'Brandon',
    country: 'Canada',
    provinceOrState: 'MB',
    coords: { lat: 49.8485, lng: -99.9501 },
    defaultZoom: 12,
    timezone: 'America/Winnipeg',
    nicheFocus: ['agricultural builds', 'heavy equipment repair', 'plumbing & heating', 'flooring installation'],
    defaultPolygonPoints: [
      { lat: 49.8800, lng: -99.9900 },
      { lat: 49.8800, lng: -99.9100 },
      { lat: 49.8100, lng: -99.9100 },
      { lat: 49.8100, lng: -99.9900 }
    ]
  },
  {
    id: 'winkler',
    name: 'Winkler',
    country: 'Canada',
    provinceOrState: 'MB',
    coords: { lat: 49.1812, lng: -97.9392 },
    defaultZoom: 13,
    timezone: 'America/Winnipeg',
    nicheFocus: ['manufacturing supply', 'commercial roofing', 'window & door fabrication']
  },
  {
    id: 'steinbach',
    name: 'Steinbach',
    country: 'Canada',
    provinceOrState: 'MB',
    coords: { lat: 49.5258, lng: -96.6839 },
    defaultZoom: 13,
    timezone: 'America/Winnipeg',
    nicheFocus: ['residential builders', 'automotive collision', 'concrete pouring']
  },
  {
    id: 'landmark',
    name: 'Landmark',
    country: 'Canada',
    provinceOrState: 'MB',
    coords: { lat: 49.6583, lng: -96.8203 },
    defaultZoom: 14,
    timezone: 'America/Winnipeg',
    nicheFocus: ['agri-business services', 'feed & seed logistics', 'excavation']
  },

  // Canada - Alberta
  {
    id: 'calgary',
    name: 'Calgary',
    country: 'Canada',
    provinceOrState: 'AB',
    coords: { lat: 51.0447, lng: -114.0719 },
    defaultZoom: 11,
    timezone: 'America/Edmonton',
    nicheFocus: ['oilfield fabrication', 'commercial HVAC', 'estate luxury builders', 'solar installation'],
    defaultPolygonPoints: [
      { lat: 51.1800, lng: -114.2200 },
      { lat: 51.1800, lng: -113.9200 },
      { lat: 50.8900, lng: -113.9200 },
      { lat: 50.8900, lng: -114.2200 }
    ]
  },
  {
    id: 'edmonton',
    name: 'Edmonton',
    country: 'Canada',
    provinceOrState: 'AB',
    coords: { lat: 53.5461, lng: -113.4938 },
    defaultZoom: 11,
    timezone: 'America/Edmonton',
    nicheFocus: ['industrial maintenance', 'heavy mechanical', 'infrastructure contractors', 'winter services'],
    defaultPolygonPoints: [
      { lat: 53.6800, lng: -113.6800 },
      { lat: 53.6800, lng: -113.3200 },
      { lat: 53.4200, lng: -113.3200 },
      { lat: 53.4200, lng: -113.6800 }
    ]
  },

  // Canada - British Columbia
  {
    id: 'vancouver',
    name: 'Vancouver',
    country: 'Canada',
    provinceOrState: 'BC',
    coords: { lat: 49.2827, lng: -123.1207 },
    defaultZoom: 11,
    timezone: 'America/Vancouver',
    nicheFocus: ['high-density residential', 'rainscreen waterproofing', 'seismic retrofitting', 'custom glazing'],
    defaultPolygonPoints: [
      { lat: 49.3300, lng: -123.2500 },
      { lat: 49.3300, lng: -123.0100 },
      { lat: 49.2000, lng: -123.0100 },
      { lat: 49.2000, lng: -123.2500 }
    ]
  },
  {
    id: 'victoria',
    name: 'Victoria',
    country: 'Canada',
    provinceOrState: 'BC',
    coords: { lat: 48.4284, lng: -123.3656 },
    defaultZoom: 12,
    timezone: 'America/Vancouver',
    nicheFocus: ['heritage building restoration', 'marine electrical', 'residential solar']
  },
  {
    id: 'kelowna',
    name: 'Kelowna',
    country: 'Canada',
    provinceOrState: 'BC',
    coords: { lat: 49.8880, lng: -119.4960 },
    defaultZoom: 12,
    timezone: 'America/Vancouver',
    nicheFocus: ['vineyard infrastructure', 'pool & landscape construction', 'luxury lakefront builds']
  },

  // Canada - Ontario
  {
    id: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    provinceOrState: 'ON',
    coords: { lat: 43.6532, lng: -79.3832 },
    defaultZoom: 11,
    timezone: 'America/Toronto',
    nicheFocus: ['commercial buildout', 'high-rise maintenance', 'luxury condominium renovation', 'smart electrical systems'],
    defaultPolygonPoints: [
      { lat: 43.8200, lng: -79.6000 },
      { lat: 43.8200, lng: -79.1800 },
      { lat: 43.5800, lng: -79.1800 },
      { lat: 43.5800, lng: -79.6000 }
    ]
  },
  {
    id: 'ottawa',
    name: 'Ottawa',
    country: 'Canada',
    provinceOrState: 'ON',
    coords: { lat: 45.4215, lng: -75.6972 },
    defaultZoom: 11,
    timezone: 'America/Toronto',
    nicheFocus: ['government security retrofit', 'commercial roofing', 'asbestos abatement', 'custom stone masonry']
  },
  {
    id: 'hamilton',
    name: 'Hamilton',
    country: 'Canada',
    provinceOrState: 'ON',
    coords: { lat: 43.2557, lng: -79.8711 },
    defaultZoom: 12,
    timezone: 'America/Toronto',
    nicheFocus: ['steel mill maintenance', 'heavy manufacturing electrical', 'waterfront environmental remediation']
  },
  {
    id: 'mississauga',
    name: 'Mississauga',
    country: 'Canada',
    provinceOrState: 'ON',
    coords: { lat: 43.5890, lng: -79.6441 },
    defaultZoom: 12,
    timezone: 'America/Toronto',
    nicheFocus: ['logistics warehouse development', 'commercial HVAC', 'fleet maintenance']
  },

  // Canada - Quebec
  {
    id: 'montreal',
    name: 'Montreal',
    country: 'Canada',
    provinceOrState: 'QC',
    coords: { lat: 45.5017, lng: -73.5673 },
    defaultZoom: 11,
    timezone: 'America/Toronto',
    nicheFocus: ['triplex masonry restoration', 'commercial refrigeration', 'soundproofing & acoustic retrofit'],
    defaultPolygonPoints: [
      { lat: 45.6800, lng: -73.8500 },
      { lat: 45.6800, lng: -73.4500 },
      { lat: 45.4000, lng: -73.4500 },
      { lat: 45.4000, lng: -73.8500 }
    ]
  },
  {
    id: 'quebec',
    name: 'Quebec City',
    country: 'Canada',
    provinceOrState: 'QC',
    coords: { lat: 46.8139, lng: -71.2080 },
    defaultZoom: 12,
    timezone: 'America/Toronto',
    nicheFocus: ['historic preservation', 'snow & ice load engineering', 'timber framing']
  },

  // Canada - Atlantic & Prairies
  {
    id: 'fredericton',
    name: 'Fredericton',
    country: 'Canada',
    provinceOrState: 'NB',
    coords: { lat: 45.9636, lng: -66.6431 },
    defaultZoom: 12,
    timezone: 'America/Halifax',
    nicheFocus: ['forestry equipment repair', 'residential heat pumps', 'riverbank erosion mitigation']
  },
  {
    id: 'halifax',
    name: 'Halifax',
    country: 'Canada',
    provinceOrState: 'NS',
    coords: { lat: 44.6488, lng: -63.5752 },
    defaultZoom: 12,
    timezone: 'America/Halifax',
    nicheFocus: ['marine construction', 'saltwater corrosion coating', 'exterior siding & cladding']
  },
  {
    id: 'regina',
    name: 'Regina',
    country: 'Canada',
    provinceOrState: 'SK',
    coords: { lat: 50.4452, lng: -104.6189 },
    defaultZoom: 12,
    timezone: 'America/Regina',
    nicheFocus: ['grain elevator construction', 'heavy farm equipment maintenance', 'geothermal HVAC']
  },
  {
    id: 'saskatoon',
    name: 'Saskatoon',
    country: 'Canada',
    provinceOrState: 'SK',
    coords: { lat: 52.1332, lng: -106.6700 },
    defaultZoom: 12,
    timezone: 'America/Regina',
    nicheFocus: ['mining support services', 'commercial electrical', 'custom metal fabrication']
  },

  // USA - Key Metro Territories
  {
    id: 'seattle',
    name: 'Seattle',
    country: 'USA',
    provinceOrState: 'WA',
    coords: { lat: 47.6062, lng: -122.3321 },
    defaultZoom: 11,
    timezone: 'America/Los_Angeles',
    nicheFocus: ['commercial tech facility maintenance', 'green building retrofits', 'drainage & moisture barrier systems'],
    defaultPolygonPoints: [
      { lat: 47.7400, lng: -122.4400 },
      { lat: 47.7400, lng: -122.2400 },
      { lat: 47.4900, lng: -122.2400 },
      { lat: 47.4900, lng: -122.4400 }
    ]
  },
  {
    id: 'portland',
    name: 'Portland',
    country: 'USA',
    provinceOrState: 'OR',
    coords: { lat: 45.5152, lng: -122.6784 },
    defaultZoom: 11,
    timezone: 'America/Los_Angeles',
    nicheFocus: ['mass timber construction', 'residential solar installation', 'landscape architecture']
  },
  {
    id: 'san_francisco',
    name: 'San Francisco',
    country: 'USA',
    provinceOrState: 'CA',
    coords: { lat: 37.7749, lng: -122.4194 },
    defaultZoom: 12,
    timezone: 'America/Los_Angeles',
    nicheFocus: ['commercial tenant improvements', 'smart EV charging systems', 'victorian foundation reinforcement'],
    defaultPolygonPoints: [
      { lat: 37.8200, lng: -122.5200 },
      { lat: 37.8200, lng: -122.3600 },
      { lat: 37.7000, lng: -122.3600 },
      { lat: 37.7000, lng: -122.5200 }
    ]
  },
  {
    id: 'los_angeles',
    name: 'Los Angeles',
    country: 'USA',
    provinceOrState: 'CA',
    coords: { lat: 34.0522, lng: -118.2437 },
    defaultZoom: 10,
    timezone: 'America/Los_Angeles',
    nicheFocus: ['luxury custom pools', 'solar battery microgrids', 'commercial soundstage construction', 'earthquake bolting'],
    defaultPolygonPoints: [
      { lat: 34.2500, lng: -118.6000 },
      { lat: 34.2500, lng: -118.1500 },
      { lat: 33.8000, lng: -118.1500 },
      { lat: 33.8000, lng: -118.6000 }
    ]
  },
  {
    id: 'san_diego',
    name: 'San Diego',
    country: 'USA',
    provinceOrState: 'CA',
    coords: { lat: 32.7157, lng: -117.1611 },
    defaultZoom: 11,
    timezone: 'America/Los_Angeles',
    nicheFocus: ['defense aerospace contractors', 'solar & water recycling', 'outdoor living spaces']
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    country: 'USA',
    provinceOrState: 'AZ',
    coords: { lat: 33.4484, lng: -112.0740 },
    defaultZoom: 11,
    timezone: 'America/Phoenix',
    nicheFocus: ['extreme thermal HVAC', 'commercial cool roof coatings', 'desert xeriscaping & irrigation']
  },
  {
    id: 'denver',
    name: 'Denver',
    country: 'USA',
    provinceOrState: 'CO',
    coords: { lat: 39.7392, lng: -104.9903 },
    defaultZoom: 11,
    timezone: 'America/Denver',
    nicheFocus: ['hail-resistant roofing', 'alpine custom homes', 'commercial snow melt systems', 'radon mitigation'],
    defaultPolygonPoints: [
      { lat: 39.8500, lng: -105.1500 },
      { lat: 39.8500, lng: -104.7500 },
      { lat: 39.6000, lng: -104.7500 },
      { lat: 39.6000, lng: -105.1500 }
    ]
  },
  {
    id: 'austin',
    name: 'Austin',
    country: 'USA',
    provinceOrState: 'TX',
    coords: { lat: 30.2672, lng: -97.7431 },
    defaultZoom: 11,
    timezone: 'America/Chicago',
    nicheFocus: ['custom hill country estates', 'commercial datacenter cooling', 'foam insulation', 'smart grid electrical'],
    defaultPolygonPoints: [
      { lat: 30.4500, lng: -97.9000 },
      { lat: 30.4500, lng: -97.6000 },
      { lat: 30.1500, lng: -97.6000 },
      { lat: 30.1500, lng: -97.9000 }
    ]
  },
  {
    id: 'dallas',
    name: 'Dallas',
    country: 'USA',
    provinceOrState: 'TX',
    coords: { lat: 32.7767, lng: -96.7970 },
    defaultZoom: 10,
    timezone: 'America/Chicago',
    nicheFocus: ['commercial logistics construction', 'foundation pier repair', 'industrial high-voltage electrical'],
    defaultPolygonPoints: [
      { lat: 33.0200, lng: -96.9900 },
      { lat: 33.0200, lng: -96.6500 },
      { lat: 32.6000, lng: -96.6500 },
      { lat: 32.6000, lng: -96.9900 }
    ]
  },
  {
    id: 'houston',
    name: 'Houston',
    country: 'USA',
    provinceOrState: 'TX',
    coords: { lat: 29.7604, lng: -95.3698 },
    defaultZoom: 10,
    timezone: 'America/Chicago',
    nicheFocus: ['hurricane storm hardening', 'petrochemical plant maintenance', 'commercial drainage & retention ponds']
  },
  {
    id: 'chicago',
    name: 'Chicago',
    country: 'USA',
    provinceOrState: 'IL',
    coords: { lat: 41.8781, lng: -87.6298 },
    defaultZoom: 11,
    timezone: 'America/Chicago',
    nicheFocus: ['high-rise commercial glazing', 'industrial boiler systems', 'masonry tuckpointing', 'lakefront stormwater engineering'],
    defaultPolygonPoints: [
      { lat: 42.0200, lng: -87.8200 },
      { lat: 42.0200, lng: -87.5200 },
      { lat: 41.6500, lng: -87.5200 },
      { lat: 41.6500, lng: -87.8200 }
    ]
  },
  {
    id: 'minneapolis',
    name: 'Minneapolis',
    country: 'USA',
    provinceOrState: 'MN',
    coords: { lat: 44.9778, lng: -93.2650 },
    defaultZoom: 11,
    timezone: 'America/Chicago',
    nicheFocus: ['cold-climate heat pumps', 'commercial snow removal fleets', 'lake home remodeling', 'insulation retrofits']
  },
  {
    id: 'detroit',
    name: 'Detroit',
    country: 'USA',
    provinceOrState: 'MI',
    coords: { lat: 42.3314, lng: -83.0458 },
    defaultZoom: 11,
    timezone: 'America/New_York',
    nicheFocus: ['automotive factory retooling', 'industrial robotics wiring', 'historic warehouse conversions']
  },
  {
    id: 'nashville',
    name: 'Nashville',
    country: 'USA',
    provinceOrState: 'TN',
    coords: { lat: 36.1627, lng: -86.7816 },
    defaultZoom: 11,
    timezone: 'America/Chicago',
    nicheFocus: ['acoustic commercial studio construction', 'hospitality venue buildouts', 'custom residential framing']
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'USA',
    provinceOrState: 'GA',
    coords: { lat: 33.7490, lng: -84.3880 },
    defaultZoom: 11,
    timezone: 'America/New_York',
    nicheFocus: ['commercial film production studios', 'subdivision grading & paving', 'high-efficiency residential cooling']
  },
  {
    id: 'miami',
    name: 'Miami',
    country: 'USA',
    provinceOrState: 'FL',
    coords: { lat: 25.7617, lng: -80.1918 },
    defaultZoom: 11,
    timezone: 'America/New_York',
    nicheFocus: ['impact hurricane glass & doors', 'waterfront seawall construction', 'luxury high-rise renovations'],
    defaultPolygonPoints: [
      { lat: 25.9200, lng: -80.3200 },
      { lat: 25.9200, lng: -80.1100 },
      { lat: 25.6800, lng: -80.1100 },
      { lat: 25.6800, lng: -80.3200 }
    ]
  },
  {
    id: 'new_york',
    name: 'New York',
    country: 'USA',
    provinceOrState: 'NY',
    coords: { lat: 40.7128, lng: -74.0060 },
    defaultZoom: 11,
    timezone: 'America/New_York',
    nicheFocus: ['luxury brownstone renovation', 'high-rise facade compliance', 'commercial elevator modernization', 'fire suppression systems'],
    defaultPolygonPoints: [
      { lat: 40.8800, lng: -74.0500 },
      { lat: 40.8800, lng: -73.7500 },
      { lat: 40.5500, lng: -73.7500 },
      { lat: 40.5500, lng: -74.0500 }
    ]
  },
  {
    id: 'boston',
    name: 'Boston',
    country: 'USA',
    provinceOrState: 'MA',
    coords: { lat: 42.3601, lng: -71.0589 },
    defaultZoom: 12,
    timezone: 'America/New_York',
    nicheFocus: ['historic brick repointing', 'biotech laboratory cleanrooms', 'underground utility tunneling']
  }
];

export const CITY_COORDS_MAP: Record<string, { lat: number; lng: number }> = CITIES_CONFIG.reduce((acc, city) => {
  acc[city.id] = city.coords;
  acc[city.name.toLowerCase()] = city.coords;
  return acc;
}, {} as Record<string, { lat: number; lng: number }>);

export function getCityCoordinates(cityName: string): { lat: number; lng: number } {
  if (!cityName) return { lat: 49.8951, lng: -97.1384 }; // Default Winnipeg
  const key = cityName.toLowerCase().trim().replace(/[\s\-_]+/g, '_');
  const direct = CITY_COORDS_MAP[key] || CITY_COORDS_MAP[cityName.toLowerCase().trim()];
  if (direct) return direct;
  
  // Fuzzy search by substring
  const found = CITIES_CONFIG.find(c => 
    c.name.toLowerCase().includes(cityName.toLowerCase()) || 
    cityName.toLowerCase().includes(c.name.toLowerCase())
  );
  
  return found ? found.coords : { lat: 49.8951, lng: -97.1384 };
}
