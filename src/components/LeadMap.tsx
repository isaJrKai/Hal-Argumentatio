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
  urgencyScore: number | null;
  predictedLtvUsd: number | null;
  status: string;
  // Coordinates must come from a business record or a verified geocoding result.
  // City-centroid offsets are deliberately not accepted as business locations.
  coords?: { lat: number; lng: number } | null;
}

export interface OsmTradeCandidate {
  osmType: string;
  osmId: number;
  name: string;
  craft: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  websiteUrl?: string;
}

export interface LeadMapProps {
  leads: LeadCoord[];
  onImportOsmPlace?: (candidate: OsmTradeCandidate) => Promise<void> | void;
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

  mapLibreLoader = (async () => {
    const unpkgBase = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist`;
    const jsdelivrBase = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist`;

    let stylesheet = document.querySelector('link[data-hal-maplibre]') as HTMLLinkElement | null;
    if (!stylesheet) {
      stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = `${unpkgBase}/maplibre-gl.css`;
      stylesheet.dataset.halMaplibre = 'true';
      stylesheet.onerror = () => {
        // A blocked CDN must not leave MapLibre's controls and attribution unstyled.
        stylesheet!.href = `${jsdelivrBase}/maplibre-gl.css`;
      };
      document.head.appendChild(stylesheet);
    }

    const existing = document.querySelector('script[data-hal-maplibre]') as HTMLScriptElement | null;
    if (existing) {
      if (window.maplibregl) return window.maplibregl;
      await new Promise<void>((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Existing MapLibre script failed.')), { once: true });
      });
      if (window.maplibregl) return window.maplibregl;
      existing.remove();
    }

    const sources = [
      `${unpkgBase}/maplibre-gl.js`,
      `${jsdelivrBase}/maplibre-gl.js`
    ];
    let lastError: unknown;
    for (const src of sources) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.halMaplibre = 'true';
      try {
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Could not load MapLibre from ${new URL(src).hostname}.`));
          document.head.appendChild(script);
        });
        if (window.maplibregl) return window.maplibregl;
        throw new Error('MapLibre loaded but did not initialize.');
      } catch (error) {
        lastError = error;
        script.remove();
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Map library failed to load from both CDNs.');
  })().catch(error => {
    mapLibreLoader = null;
    throw error;
  });
  return mapLibreLoader;
}

const validCoords = (coords?: { lat: number; lng: number } | null) =>
  !!coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) &&
  Math.abs(coords.lat) <= 90 && Math.abs(coords.lng) <= 180;

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
};
const safeText = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => HTML_ENTITIES[char] || char);

export default function LeadMap({
  leads, center, city, selectedLeadId, onSelectLead, onImportOsmPlace, serviceZones = [],
  isDrawingZone = false, onAddZonePoint, drawingPoints = []
}: LeadMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const osmMarkersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [earthquakesEnabled, setEarthquakesEnabled] = useState(false);
  const [osmTradesEnabled, setOsmTradesEnabled] = useState(false);
  const [osmTradeStatus, setOsmTradeStatus] = useState('OSM trade layer off');
  const [earthquakeStatus, setEarthquakeStatus] = useState('Earthquake layer off');
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);

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
        setMapError('');
        setMapReady(true);
      });
      // Surface style/network failures instead of leaving the map stuck on
      // "Loading OpenFreeMap…" forever when the style endpoint cannot load.
      map.on('error', (event: any) => {
        if (disposed || mapReady) return;
        const message = event?.error?.message || 'The map style or tiles could not be loaded.';
        setMapError(message);
      });
      mapRef.current = map;
    }).catch(error => {
      if (!disposed) setMapError(error?.message || 'Could not load the free map.');
    });
    return () => {
      disposed = true;
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      osmMarkersRef.current.forEach(marker => marker.remove());
      osmMarkersRef.current = [];
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
    const maplibregl = window.maplibregl;
    if (!map || !mapReady || !maplibregl) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    leads.filter(lead => validCoords(lead.coords)).forEach(lead => {
      const color = lead.status === 'converted' || lead.status === 'closed_won' ? '#15966a'
        : lead.status === 'contacted' ? '#d28a25' : '#3478d4';
      const marker = new maplibregl.Marker({ color })
        .setLngLat([lead.coords!.lng, lead.coords!.lat])
        .setPopup(new maplibregl.Popup({ offset: 22 }).setHTML(
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

  // Weather overlay intentionally disabled until HAL uses a commercially licensed provider.

  // USGS public GeoJSON feed. Events are displayed as seismic observations, not
  // interpreted as property damage or contractor demand.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = window.maplibregl;
    if (!map || !mapReady || !earthquakesEnabled || !maplibregl) {
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
            new maplibregl.Popup().setLngLat(event.lngLat).setHTML(
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


  // Overpass: retrieve only mapped trade POIs inside the visible map bounds.
  // These are OSM community-mapped places, not verified CRM prospects.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = window.maplibregl;
    if (!map || !mapReady || !osmTradesEnabled || !maplibregl) {
      osmMarkersRef.current.forEach(marker => marker.remove());
      osmMarkersRef.current = [];
      if (!osmTradesEnabled) setOsmTradeStatus('OSM trade layer off');
      return;
    }
    let cancelled = false;
    const loadMappedTrades = async () => {
      try {
        const bounds = map.getBounds();
        const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
        const query = `[out:json][timeout:15];(nwr(${bbox})["craft"~"^(plumber|electrician|carpenter|roofer|builder|painter|locksmith|glaziery|tiler|plasterer|hvac|landscaper)$"];);out center 250;`;
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(18000)
        });
        if (!response.ok) throw new Error(`Overpass returned ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        osmMarkersRef.current.forEach(marker => marker.remove());
        osmMarkersRef.current = [];
        const elements = Array.isArray(payload.elements) ? payload.elements : [];
        elements.forEach((element: any) => {
          const lat = Number(element.lat ?? element.center?.lat);
          const lng = Number(element.lon ?? element.center?.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const tags = element.tags || {};
          if (!tags.name && !tags.operator) return;
          const name = tags.name || tags.operator;
          const craft = tags.craft || 'home service';
          const candidate: OsmTradeCandidate = {
            osmType: String(element.type || 'node'),
            osmId: Number(element.id),
            name: String(name),
            craft: String(craft),
            city: String(tags['addr:city'] || city),
            latitude: lat,
            longitude: lng,
            phone: tags.phone ? String(tags.phone) : undefined,
            email: tags.email ? String(tags.email) : undefined,
            websiteUrl: tags.website ? String(tags.website) : undefined
          };
          const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
            `<div style="font:12px system-ui;color:#17202a;min-width:180px"><strong>${safeText(name)}</strong><div>${safeText(craft)}</div><small>OpenStreetMap mapped POI · not independently verified</small>${tags.phone ? `<div>${safeText(tags.phone)}</div>` : ''}${tags.website ? `<div>${safeText(tags.website)}</div>` : ''}${onImportOsmPlace ? '<button type="button" data-hal-import-osm style="margin-top:8px;padding:6px 9px;background:#166534;color:white;border:0;border-radius:4px;cursor:pointer">Add to CRM review queue</button>' : ''}</div>`
          );
          popup.on('open', () => {
            const button = popup.getElement()?.querySelector('[data-hal-import-osm]') as HTMLButtonElement | null;
            if (!button || !onImportOsmPlace) return;
            button.addEventListener('click', async () => {
              button.disabled = true;
              button.textContent = 'ADDING…';
              try {
                await onImportOsmPlace(candidate);
                button.textContent = 'ADDED TO REVIEW';
              } catch {
                button.disabled = false;
                button.textContent = 'RETRY IMPORT';
              }
            }, { once: true });
          });
          const marker = new maplibregl.Marker({ color: '#a56cbd' })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);
          osmMarkersRef.current.push(marker);
        });
        setOsmTradeStatus(`OpenStreetMap · ${osmMarkersRef.current.length} mapped trade POIs in view`);
      } catch (error: any) {
        if (!cancelled) setOsmTradeStatus(error?.message || 'OSM trade data unavailable');
      }
    };
    loadMappedTrades();
    map.on('moveend', loadMappedTrades);
    return () => {
      cancelled = true;
      map.off('moveend', loadMappedTrades);
      osmMarkersRef.current.forEach(marker => marker.remove());
      osmMarkersRef.current = [];
    };
  }, [osmTradesEnabled, mapReady, onImportOsmPlace, city]);

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
          <span className="px-3 py-2 text-[9px] font-mono border border-border-dark rounded-sm bg-panel-dark text-text-dim" title="Weather is disabled pending a commercially licensed data provider">WEATHER DISABLED · LICENSING</span>
          <button onClick={()=>setEarthquakesEnabled(value=>!value)} className={`px-3 py-2 text-[9px] font-mono border rounded-sm ${earthquakesEnabled ? 'bg-amber-700 border-amber-400 text-white' : 'bg-panel-dark border-border-dark text-text-primary'}`}>EARTHQUAKES {earthquakesEnabled ? 'ON' : 'OFF'}</button>
          <button onClick={()=>setOsmTradesEnabled(value=>!value)} className={`px-3 py-2 text-[9px] font-mono border rounded-sm ${osmTradesEnabled ? 'bg-violet-800 border-violet-400 text-white' : 'bg-panel-dark border-border-dark text-text-primary'}`}>OSM TRADES {osmTradesEnabled ? 'ON' : 'OFF'}</button>
        </div>
      </div>
      <div ref={containerRef} className="w-full flex-1 min-h-[520px]" />
      {(!mapReady || mapError) && <div className="absolute inset-0 z-20 flex items-center justify-center bg-panel-dark/90 p-6 text-center"><div className="text-xs font-mono text-text-primary">{mapError || 'Loading OpenFreeMap…'}{mapError && <div className="mt-2 text-text-dim">Check the network connection and refresh the map.</div>}</div></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-dark bg-panel-dark px-3 py-2 text-[9px] font-mono text-text-dim">
        <span>CRM PINS: {preciseLeadCount} located / {leads.length} records · no fabricated coordinates</span>
        <span>{earthquakeStatus}</span>
        
        {osmTradesEnabled && <span>{osmTradeStatus}</span>}
        {isDrawingZone && <span className="text-amber-300">DRAWING ZONE · CLICK MAP TO ADD POINTS</span>}
        <span>Map © OpenFreeMap · © OpenMapTiles · © OpenStreetMap</span>
        
      </div>
    </div>
  );
}
