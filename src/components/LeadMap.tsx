import React, { useEffect, useRef, useState } from 'react';
import { ServiceZone } from '../lib/indexedDbCache';

export interface LeadCoord {
  id: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  city: string;
  serviceType: string;
  googleRating?: number;
  reviewCount?: number;
  seoScore?: number;
  performanceScore?: number;
  sslStatus?: string;
  urgencyScore: number;
  predictedLtvUsd: number;
  status: string;
  // Coordinates must come from a business record or a verified geocoding result.
  // City-centroid offsets are deliberately not accepted as business locations.
  coords?: { lat: number; lng: number } | null;
}

export interface LeadMapProps {
  leads: LeadCoord[];
  center: { lat: number; lng: number };
  city: string;
  selectedLeadId?: string | null;
  onSelectLead?: (leadId: string | null) => void;
  activeOverlay?: string;
  onChangeOverlay?: (overlay: string) => void;
  serviceZones?: ServiceZone[];
  isDrawingZone?: boolean;
  onAddZonePoint?: (point: { lat: number; lng: number }) => void;
  drawingPoints?: Array<{ lat: number; lng: number }>;
}

declare global {
  interface Window { maplibregl?: any; }
}

const MAPLIBRE_VERSION = '5.6.1';
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

let mapLibreLoader: Promise<any> | null = null;
function loadMapLibre(): Promise<any> {
  if (typeof window !== 'undefined' && window.maplibregl) return Promise.resolve(window.maplibregl);
  if (mapLibreLoader) return mapLibreLoader;
  mapLibreLoader = new Promise((resolve, reject) => {
    const cssHref = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
    if (!document.querySelector('link[data-hal-maplibre]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      link.dataset.halMaplibre = 'true';
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-hal-maplibre]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.maplibregl), { once: true });
      existing.addEventListener('error', () => reject(new Error('Map library failed to load.')), { once: true });
      if (window.maplibregl) resolve(window.maplibregl);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
    script.async = true;
    script.dataset.halMaplibre = 'true';
    script.onload = () => window.maplibregl ? resolve(window.maplibregl) : reject(new Error('Map library did not initialize.'));
    script.onerror = () => reject(new Error('Map library failed to load.'));
    document.head.appendChild(script);
  }).catch(error => {
    mapLibreLoader = null;
    throw error;
  });
  return mapLibreLoader;
}

const validCoords = (coords?: { lat: number; lng: number } | null) =>
  !!coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) &&
  Math.abs(coords.lat) <= 90 && Math.abs(coords.lng) <= 180;

const safeText = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char] || char));

export default function LeadMap({
  leads, center, city, selectedLeadId, onSelectLead, serviceZones = [],
  isDrawingZone = false, onAddZonePoint, drawingPoints = []
}: LeadMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [earthquakesEnabled, setEarthquakesEnabled] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState('Weather layer off');
  const [earthquakeStatus, setEarthquakeStatus] = useState('Earthquake layer off');
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [cursor, setCursor] = useState<{lat:number; lng:number} | null>(null);

  useEffect(() => {
    let disposed = false;
    let map: any;
    loadMapLibre().then(maplibregl => {
      if (disposed || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: OPENFREEMAP_STYLE,
        center: [center.lng, center.lat],
        zoom: 11,
        attributionControl: true
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
      map.on('load', () => {
        if (disposed) return;
        setMapReady(true);
      });
      map.on('mousemove', (event: any) => setCursor({ lat: event.lngLat.lat, lng: event.lngLat.lng }));
      map.on('click', (event: any) => {
        if (isDrawingZone && onAddZonePoint) onAddZonePoint({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      });
      mapRef.current = map;
    }).catch(error => {
      if (!disposed) setMapError(error?.message || 'Could not load the free map.');
    });
    return () => {
      disposed = true;
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  // Map is initialized once; camera changes are handled separately.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && mapReady && validCoords({lat:center.lat,lng:center.lng})) {
      map.flyTo({ center: [center.lng, center.lat], duration: 700 });
    }
  }, [center.lat, center.lng, mapReady]);

  // Business pins only render when the record has a real coordinate.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.maplibregl) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    leads.filter(lead => validCoords(lead.coords)).forEach(lead => {
      const color = lead.status === 'converted' || lead.status === 'closed_won' ? '#15966a'
        : lead.status === 'contacted' ? '#d28a25' : '#3478d4';
      const marker = new window.maplibregl.Marker({ color })
        .setLngLat([lead.coords!.lng, lead.coords!.lat])
        .setPopup(new window.maplibregl.Popup({ offset: 22 }).setHTML(
          `<div style="font:12px system-ui;min-width:180px;color:#17202a">
            <strong>${safeText(lead.businessName)}</strong>
            <div>${safeText(lead.serviceType)} · ${safeText(lead.city)}</div>
            ${lead.phone ? `<div>${safeText(lead.phone)}</div>` : ''}
            <small>CRM status: ${safeText(lead.status)}</small>
          </div>`
        ))
        .addTo(map);
      marker.getElement().addEventListener('click', () => onSelectLead?.(lead.id));
      if (lead.id === selectedLeadId) marker.togglePopup();
      markersRef.current.push(marker);
    });
  }, [leads, mapReady, onSelectLead, selectedLeadId]);

  // Saved service zones and the current drawing preview.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const features: any[] = [];
    serviceZones.forEach(zone => {
      if (zone.points?.length >= 3) {
        const ring = zone.points.map(point => [point.lng, point.lat]);
        ring.push(ring[0]);
        features.push({ type: 'Feature', properties: { name: zone.name || 'Service zone' }, geometry: { type: 'Polygon', coordinates: [ring] } });
      }
    });
    if (drawingPoints.length >= 3) {
      const ring = drawingPoints.map(point => [point.lng, point.lat]);
      ring.push(ring[0]);
      features.push({ type: 'Feature', properties: { name: 'Draft service zone' }, geometry: { type: 'Polygon', coordinates: [ring] } });
    }
    const data = { type: 'FeatureCollection', features };
    if (map.getSource('hal-service-zones')) {
      map.getSource('hal-service-zones').setData(data);
    } else {
      map.addSource('hal-service-zones', { type: 'geojson', data });
      map.addLayer({ id: 'hal-service-zones-fill', type: 'fill', source: 'hal-service-zones', paint: { 'fill-color': '#15966a', 'fill-opacity': 0.16 } });
      map.addLayer({ id: 'hal-service-zones-outline', type: 'line', source: 'hal-service-zones', paint: { 'line-color': '#15966a', 'line-width': 2, 'line-dasharray': [2, 2] } });
    }
  }, [serviceZones, drawingPoints, mapReady]);

  // Open-Meteo: sample a small grid inside the current viewport and render forecast
  // precipitation probability as contextual weather cells, not as lead-demand evidence.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !weatherEnabled) {
      if (map?.getLayer('hal-weather-fill')) map.removeLayer('hal-weather-fill');
      if (map?.getSource('hal-weather')) map.removeSource('hal-weather');
      if (!weatherEnabled) setWeatherStatus('Weather layer off');
      return;
    }
    let cancelled = false;
    const loadWeather = async () => {
      try {
        const bounds = map.getBounds();
        const west = bounds.getWest(), east = bounds.getEast(), south = bounds.getSouth(), north = bounds.getNorth();
        const points: Array<{lat:number;lng:number;west:number;east:number;south:number;north:number}> = [];
        const rows = 4, cols = 4;
        for (let row=0; row<rows; row++) for (let col=0; col<cols; col++) {
          const cellWest = west + (east-west)*col/cols;
          const cellEast = west + (east-west)*(col+1)/cols;
          const cellSouth = south + (north-south)*row/rows;
          const cellNorth = south + (north-south)*(row+1)/rows;
          points.push({ lat:(cellSouth+cellNorth)/2, lng:(cellWest+cellEast)/2, west:cellWest, east:cellEast, south:cellSouth, north:cellNorth });
        }
        const params = new URLSearchParams({
          latitude: points.map(point=>point.lat.toFixed(4)).join(','),
          longitude: points.map(point=>point.lng.toFixed(4)).join(','),
          current: 'temperature_2m,precipitation,rain,wind_speed_10m',
          hourly: 'precipitation_probability,precipitation',
          forecast_days: '1',
          timezone: 'auto'
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
        const payload = await response.json();
        const records = Array.isArray(payload) ? payload : [payload];
        if (cancelled) return;
        const features = points.map((point, index) => {
          const record = records[index] || {};
          const probability = Math.max(0, ...(record.hourly?.precipitation_probability || []).slice(0, 6).filter(Number.isFinite));
          const rainMm = Math.max(Number(record.current?.precipitation || 0), ...(record.hourly?.precipitation || []).slice(0, 6).filter(Number.isFinite));
          return {
            type: 'Feature',
            properties: { probability, rainMm, temperature: record.current?.temperature_2m ?? null, wind: record.current?.wind_speed_10m ?? null },
            geometry: { type: 'Polygon', coordinates: [[[point.west,point.south],[point.east,point.south],[point.east,point.north],[point.west,point.north],[point.west,point.south]]] }
          };
        });
        const geojson = { type: 'FeatureCollection', features };
        if (map.getSource('hal-weather')) map.getSource('hal-weather').setData(geojson);
        else {
          map.addSource('hal-weather', { type: 'geojson', data: geojson });
          map.addLayer({ id: 'hal-weather-fill', type: 'fill', source: 'hal-weather', paint: {
            'fill-color': ['case', ['>=',['get','probability'],70], '#2878c8', ['>=',['get','probability'],40], '#53a7b6', '#d5b85a'],
            'fill-opacity': 0.24, 'fill-outline-color': 'rgba(255,255,255,0.25)'
          }});
        }
        setWeatherStatus('Open-Meteo · next 6 hours · refreshed ' + new Date().toLocaleTimeString());
      } catch (error: any) {
        if (!cancelled) setWeatherStatus(error?.message || 'Weather data unavailable');
      }
    };
    loadWeather();
    map.on('moveend', loadWeather);
    return () => { cancelled = true; map.off('moveend', loadWeather); };
  }, [weatherEnabled, mapReady]);

  // USGS public GeoJSON feed. Events are displayed as seismic observations, not
  // interpreted as property damage or contractor demand.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !earthquakesEnabled) {
      if (map?.getLayer('hal-quake-circles')) map.removeLayer('hal-quake-circles');
      if (map?.getSource('hal-earthquakes')) map.removeSource('hal-earthquakes');
      if (!earthquakesEnabled) setEarthquakeStatus('Earthquake layer off');
      return;
    }
    let cancelled = false;
    const loadEarthquakes = async () => {
      try {
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson');
        if (!response.ok) throw new Error(`USGS feed returned ${response.status}`);
        const geojson = await response.json();
        if (cancelled) return;
        if (map.getSource('hal-earthquakes')) map.getSource('hal-earthquakes').setData(geojson);
        else {
          map.addSource('hal-earthquakes', { type: 'geojson', data: geojson });
          map.addLayer({ id: 'hal-quake-circles', type: 'circle', source: 'hal-earthquakes', paint: {
            'circle-radius': ['interpolate',['linear'],['get','mag'],0,3,3,6,5,11,7,17],
            'circle-color': ['interpolate',['linear'],['get','mag'],0,'#e7c45b',3,'#e78b37',5,'#d94b43',7,'#8f283d'],
            'circle-opacity': 0.78, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1
          }});
          map.on('click', 'hal-quake-circles', (event: any) => {
            const feature = event.features?.[0];
            if (!feature) return;
            const props = feature.properties || {};
            new window.maplibregl.Popup().setLngLat(event.lngLat).setHTML(
              `<div style="font:12px system-ui;color:#17202a"><strong>M${safeText(props.mag)}</strong><div>${safeText(props.place)}</div><small>${props.time ? new Date(Number(props.time)).toLocaleString() : 'Time unavailable'}</small><div><a href="${safeText(props.url)}" target="_blank" rel="noreferrer">USGS event details</a></div></div>`
            ).addTo(map);
          });
          map.on('mouseenter', 'hal-quake-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'hal-quake-circles', () => { map.getCanvas().style.cursor = ''; });
        }
        setEarthquakeStatus(`USGS · past 7 days · ${geojson.features?.length || 0} events`);
      } catch (error: any) {
        if (!cancelled) setEarthquakeStatus(error?.message || 'Earthquake feed unavailable');
      }
    };
    loadEarthquakes();
    return () => { cancelled = true; };
  }, [earthquakesEnabled, mapReady]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchText.trim() || searching || !mapRef.current) return;
    setSearching(true);
    try {
      // Nominatim is used only for explicit, user-initiated single-place searches.
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(searchText.trim())}`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (!response.ok) throw new Error('Location search unavailable');
      const results = await response.json();
      if (!results?.length) throw new Error('No matching location found');
      mapRef.current.flyTo({ center: [Number(results[0].lon), Number(results[0].lat)], zoom: 13, duration: 900 });
    } catch (error: any) {
      setMapError(error?.message || 'Location search failed');
    } finally {
      setSearching(false);
    }
  };

  const preciseLeadCount = leads.filter(lead => validCoords(lead.coords)).length;

  return (
    <div className="relative border border-border-dark rounded-sm overflow-hidden bg-[#0b0e14] min-h-[520px] flex flex-col">
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        <div className="bg-panel-dark/95 border border-border-dark rounded-sm px-3 py-2 pointer-events-auto">
          <div className="text-[10px] font-mono font-bold text-text-primary uppercase">{city} · TERRITORY INTELLIGENCE</div>
          <div className="text-[9px] text-emerald-400 font-mono">OPENFREEMAP · OPENSTREETMAP DATA</div>
        </div>
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          <form onSubmit={handleSearch} className="flex gap-1 bg-panel-dark/95 border border-border-dark rounded-sm p-1">
            <input value={searchText} onChange={event=>setSearchText(event.target.value)} placeholder="Search a place…" className="w-36 sm:w-48 bg-transparent px-2 py-1 text-[10px] text-text-primary outline-none" />
            <button disabled={searching} className="px-2 py-1 text-[9px] font-mono bg-brand text-black rounded-sm">{searching ? '…' : 'GO'}</button>
          </form>
          <button onClick={()=>setWeatherEnabled(value=>!value)} className={`px-3 py-2 text-[9px] font-mono border rounded-sm ${weatherEnabled ? 'bg-sky-700 border-sky-400 text-white' : 'bg-panel-dark border-border-dark text-text-primary'}`}>RAIN / WEATHER {weatherEnabled ? 'ON' : 'OFF'}</button>
          <button onClick={()=>setEarthquakesEnabled(value=>!value)} className={`px-3 py-2 text-[9px] font-mono border rounded-sm ${earthquakesEnabled ? 'bg-amber-700 border-amber-400 text-white' : 'bg-panel-dark border-border-dark text-text-primary'}`}>EARTHQUAKES {earthquakesEnabled ? 'ON' : 'OFF'}</button>
        </div>
      </div>
      <div ref={containerRef} className="w-full flex-1 min-h-[520px]" />
      {(!mapReady || mapError) && <div className="absolute inset-0 z-20 flex items-center justify-center bg-panel-dark/90 p-6 text-center"><div className="text-xs font-mono text-text-primary">{mapError || 'Loading OpenFreeMap…'}{mapError && <div className="mt-2 text-text-dim">Check the network connection and refresh the map.</div>}</div></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-dark bg-panel-dark px-3 py-2 text-[9px] font-mono text-text-dim">
        <span>CRM PINS: {preciseLeadCount} located / {leads.length} records · no fabricated coordinates</span>
        <span>{weatherEnabled ? weatherStatus : earthquakeStatus}</span>
        {weatherEnabled && earthquakesEnabled && <span>{earthquakeStatus}</span>}
        {isDrawingZone && <span className="text-amber-300">DRAWING ZONE · CLICK MAP TO ADD POINTS</span>}
        {cursor && <span>{cursor.lat.toFixed(4)}, {cursor.lng.toFixed(4)}</span>}
        <span>Map © OpenFreeMap · © OpenMapTiles · © OpenStreetMap</span>
      </div>
    </div>
  );
}
