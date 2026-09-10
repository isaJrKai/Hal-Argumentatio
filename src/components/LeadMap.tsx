import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Map as GoogleMap, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useAdvancedMarkerRef, 
  useMap, 
  useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  Star, 
  Shield, 
  Zap, 
  Globe, 
  AlertTriangle, 
  Search, 
  Compass, 
  RotateCcw, 
  Layers, 
  Wifi, 
  WifiOff, 
  Maximize2, 
  ChevronRight, 
  Info, 
  CheckCircle2,
  Crosshair,
  MapPin,
  X,
  Loader2,
  Flame
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  coords: {
    lat: number;
    lng: number;
  };
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

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const isValidGoogleMapsKey = (key: string): boolean => {
  if (!key) return false;
  return /^AIzaSy[A-Za-z0-9_\-]{33}$/.test(key);
};

const hasValidKey = isValidGoogleMapsKey(API_KEY);

// ==========================================
// 1. Error Boundary for Google Maps
// ==========================================
interface MapErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  declare props: MapErrorBoundaryProps;
  public state: MapErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[LeadMap] Google Maps runtime error caught, safely switching to OpenStreetMap Real Tile Engine:', error);
  }

  render() {
    if (this.state.hasError) {
      return (this.props as MapErrorBoundaryProps).fallback;
    }
    return (this.props as MapErrorBoundaryProps).children;
  }
}

// ==========================================
// 2. Google Maps Subcomponents
// ==========================================

function MapCameraHandler({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.setCenter(center);
    }
  }, [map, center]);
  return null;
}

function MapSearchControl({ onPlaceSelected }: { onPlaceSelected: (lat: number, lng: number, name: string) => void }) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib || !map || !inputRef.current) return;

    try {
      const autocomplete = new placesLib.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
      });

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.formatted_address || place.name || 'Searched Location';
          
          map.setCenter({ lat, lng });
          map.setZoom(13);
          onPlaceSelected(lat, lng, name);
        }
      });

      return () => {
        if (listener && typeof google !== 'undefined' && google.maps && google.maps.event) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (e) {
      console.warn('Autocomplete init skipped:', e);
    }
  }, [placesLib, map, onPlaceSelected]);

  return (
    <div className="relative max-w-xs flex-1 min-w-[140px] sm:min-w-[180px]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search address or city..."
        className="w-full bg-bg-dark border border-border-dark hover:border-text-secondary/30 rounded-sm p-1.5 pl-8.5 text-[11px] font-mono text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand transition-colors"
      />
    </div>
  );
}

function MapCustomControls({ 
  mapTypeId, 
  setMapTypeId 
}: { 
  mapTypeId: string; 
  setMapTypeId: (val: 'roadmap' | 'satellite') => void;
}) {
  const map = useMap();

  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || 11;
      map.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 11;
      map.setZoom(currentZoom - 1);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center bg-bg-dark border border-border-dark rounded-sm p-0.5">
        <button
          onClick={() => setMapTypeId('roadmap')}
          className={`px-2 py-1 text-[9px] font-mono rounded-sm transition-colors cursor-pointer ${
            mapTypeId === 'roadmap' 
              ? 'bg-brand text-text-primary font-bold' 
              : 'text-text-dim hover:text-text-primary'
          }`}
        >
          ROADMAP
        </button>
        <button
          onClick={() => setMapTypeId('satellite')}
          className={`px-2 py-1 text-[9px] font-mono rounded-sm transition-colors cursor-pointer ${
            mapTypeId === 'satellite' 
              ? 'bg-brand text-text-primary font-bold' 
              : 'text-text-dim hover:text-text-primary'
          }`}
        >
          SATELLITE
        </button>
      </div>

      <div className="flex items-center bg-bg-dark border border-border-dark rounded-sm p-0.5">
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-6 h-6 flex items-center justify-center text-[12px] font-mono font-bold text-text-dim hover:text-text-primary border-r border-border-dark hover:bg-bg-subtle transition-colors cursor-pointer"
        >
          -
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-6 h-6 flex items-center justify-center text-[12px] font-mono font-bold text-text-dim hover:text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}

function MarkerWithInfoWindow({ 
  lead, 
  isSelected, 
  onSelect,
  key
}: { 
  lead: LeadCoord; 
  isSelected: boolean; 
  onSelect: () => void;
  key?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setOpen(true);
    }
  }, [isSelected]);

  let pinBg = '#9ca3af';
  if (lead.status === 'new') pinBg = '#3b82f6';
  if (lead.status === 'contacted') pinBg = '#f59e0b';
  if (lead.status === 'converted') pinBg = '#10b981';

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={lead.coords} 
        onClick={() => {
          setOpen(true);
          onSelect();
        }}
        title={lead.businessName}
      >
        <Pin background={pinBg} glyphColor="#fff" />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 text-black max-w-[240px] font-sans text-xs">
            <h4 className="font-bold text-sm border-b pb-1 mb-1.5">{lead.businessName}</h4>
            <div className="space-y-1">
              <p><span className="text-gray-500 font-mono">STATUS:</span> <span className="font-semibold uppercase text-[10px]">{lead.status}</span></p>
              <p><span className="text-gray-500 font-mono">NICHE:</span> {lead.serviceType}</p>
              {lead.ownerName && <p><span className="text-gray-500 font-mono">OWNER:</span> {lead.ownerName}</p>}
              {lead.phone && <p><span className="text-gray-500 font-mono">PHONE:</span> {lead.phone}</p>}
              
              <div className="flex gap-2 mt-2 border-t pt-2">
                <div className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                  <span>Speed:</span> <span className="font-bold text-amber-600">{lead.performanceScore || 'N/A'}/100</span>
                </div>
                <div className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                  <span>SEO:</span> <span className="font-bold text-gray-800">{lead.seoScore || 'N/A'}/100</span>
                </div>
              </div>

              {lead.googleRating && (
                <div className="flex items-center gap-1 mt-1 text-amber-500 text-[10px]">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{lead.googleRating} ({lead.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function GoogleHeatmapLayer({ leads, show }: { leads: LeadCoord[]; show: boolean }) {
  const map = useMap();
  const visualizationLib = useMapsLibrary('visualization');
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !show) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      return;
    }

    if (visualizationLib && window.google && window.google.maps && window.google.maps.visualization) {
      try {
        const points = leads.map(l => new google.maps.LatLng(l.coords.lat, l.coords.lng));
        const HeatmapLayerClass = (visualizationLib as any).HeatmapLayer || google.maps.visualization.HeatmapLayer;
        
        if (heatmapRef.current) {
          heatmapRef.current.setData(points);
        } else {
          const heatmap = new HeatmapLayerClass({
            data: points,
            map: map,
            radius: 35,
            opacity: 0.8,
            gradient: [
              'rgba(0, 255, 255, 0)',
              'rgba(0, 255, 255, 1)',
              'rgba(0, 191, 255, 1)',
              'rgba(0, 127, 255, 1)',
              'rgba(255, 0, 255, 1)',
              'rgba(255, 0, 0, 1)'
            ]
          });
          heatmapRef.current = heatmap;
        }
      } catch (err) {
        console.warn('[GoogleHeatmapLayer] Visualization error:', err);
      }
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, [map, visualizationLib, leads, show]);

  return null;
}

function GoogleMapContainer({ 
  leads, 
  center, 
  city, 
  selectedLeadId, 
  onSelectLead,
  activeOverlay,
  onChangeOverlay,
  onSwitchToOffline
}: LeadMapProps & { onSwitchToOffline: () => void }) {
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');
  const [searchMarkerCoords, setSearchMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchMarkerName, setSearchMarkerName] = useState<string>('');

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#0b0f19' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0f19' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f8fafc' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
      { featureType: 'poi.business', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f2922' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#34d399' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f1f5f9' }] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090d16' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] }
    ]
  };

  return (
    <div className="relative border border-border-dark rounded-sm overflow-hidden flex-1 min-h-[440px] flex flex-col">
      <GoogleMap
        defaultCenter={center}
        defaultZoom={11}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        options={mapOptions}
        mapTypeId={mapTypeId}
      >
        <MapCameraHandler center={center} />
        <GoogleHeatmapLayer leads={leads} show={activeOverlay !== 'none'} />

        {/* Overlay Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 justify-between items-center bg-panel-dark/95 backdrop-blur-sm p-2 border border-border-dark rounded-sm pointer-events-auto shadow-xl">
          <div className="flex items-center gap-2 text-text-primary px-1">
            <Globe className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase truncate max-w-[120px] sm:max-w-none">
              {city}
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" /> ONLINE MAPS
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-1 justify-end">
            <MapSearchControl onPlaceSelected={(lat, lng, name) => {
              setSearchMarkerCoords({ lat, lng });
              setSearchMarkerName(name);
            }} />
            
            <MapCustomControls 
              mapTypeId={mapTypeId} 
              setMapTypeId={setMapTypeId} 
            />

            <button
              onClick={onSwitchToOffline}
              className="bg-bg-dark border border-border-dark hover:border-brand text-text-dim hover:text-text-primary px-2 py-1.5 rounded-sm text-[9px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to Real OpenStreetMap Tile Matrix"
            >
              <WifiOff className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">OSM REAL TILES</span>
            </button>
          </div>
        </div>

        {activeOverlay !== 'none' && (
          <div className="absolute bottom-10 right-3 z-10 bg-panel-dark/95 backdrop-blur-md p-2 border border-border-dark rounded-sm shadow-2xl font-mono text-[9px] text-text-primary flex flex-col gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 font-bold">
              <Flame className={`w-3.5 h-3.5 animate-pulse ${activeOverlay === 'revenue' ? 'text-emerald-400' : activeOverlay === 'neural' ? 'text-purple-400' : 'text-cyan-400'}`} />
              <span className="uppercase">
                {activeOverlay === 'density' && 'OPPORTUNITY DENSITY SPECTRUM'}
                {activeOverlay === 'revenue' && 'REVENUE POTENTIAL HEATMAP'}
                {activeOverlay === 'neural' && 'NEURAL CONVERSION CONFIDENCE'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-text-dim">LOW</span>
              <div className={`h-2 w-32 rounded-full bg-gradient-to-r ${
                activeOverlay === 'revenue' ? 'from-emerald-900 via-emerald-500 to-emerald-300' : 
                activeOverlay === 'neural' ? 'from-indigo-900 via-purple-500 to-fuchsia-400' : 
                'from-cyan-400 via-blue-500 via-magenta-500 to-red-500'
              }`} />
              <span className="text-[8px] font-bold">HIGH</span>
            </div>
          </div>
        )}

        {searchMarkerCoords && (
          <AdvancedMarker 
            position={searchMarkerCoords} 
            title={searchMarkerName}
            onClick={() => setSearchMarkerCoords(null)}
          >
            <Pin background="#ef4444" glyphColor="#fff" borderColor="#b91c1c" />
          </AdvancedMarker>
        )}

        {leads.map(lead => (
          <MarkerWithInfoWindow 
            key={lead.id} 
            lead={lead} 
            isSelected={selectedLeadId === lead.id}
            onSelect={() => onSelectLead?.(lead.id)}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

// ==========================================
// 3. OpenStreetMap Real Tile Engine (Leaflet)
// ==========================================

function OpenStreetMapContainer({
  leads,
  center,
  city,
  selectedLeadId,
  onSelectLead,
  activeOverlay,
  onChangeOverlay,
  onSwitchToGoogle,
  serviceZones,
  isDrawingZone,
  onAddZonePoint,
  drawingPoints
}: LeadMapProps & { onSwitchToGoogle?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cursorGeo, setCursorGeo] = useState<{ lat: number; lng: number } | null>(null);

  // Render Saved Service Zones
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (zonesLayerGroupRef.current) {
      map.removeLayer(zonesLayerGroupRef.current);
      zonesLayerGroupRef.current = null;
    }

    if (!serviceZones || serviceZones.length === 0) return;

    const group = L.layerGroup().addTo(map);

    serviceZones.forEach(zone => {
      if (zone.points && zone.points.length >= 3) {
        const polyPoints: L.LatLngExpression[] = zone.points.map(p => [p.lat, p.lng]);
        const polygon = L.polygon(polyPoints, {
          color: zone.color || '#3b82f6',
          fillColor: zone.color || '#3b82f6',
          fillOpacity: 0.25,
          weight: 2
        }).addTo(group);

        polygon.bindPopup(`
          <div style="padding: 6px; font-family: monospace; font-size: 11px; color: white; background: #111827; border-radius: 4px;">
            <div style="font-weight: bold; color: ${zone.color}; text-transform: uppercase;">${zone.name}</div>
            <div style="font-size: 9px; color: #9ca3af; margin-top: 2px;">CITY: ${(zone.city || 'TERRITORY').toUpperCase()}</div>
          </div>
        `);
      }
    });

    zonesLayerGroupRef.current = group;

    return () => {
      if (zonesLayerGroupRef.current) {
        map.removeLayer(zonesLayerGroupRef.current);
        zonesLayerGroupRef.current = null;
      }
    };
  }, [serviceZones]);

  // Handle map click when drawing polygon zone
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isDrawingZone && onAddZonePoint) {
        onAddZonePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingZone, onAddZonePoint]);

  // Render temporary drawing polygon/points
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (drawingLayerGroupRef.current) {
      map.removeLayer(drawingLayerGroupRef.current);
      drawingLayerGroupRef.current = null;
    }

    if (!drawingPoints || drawingPoints.length === 0) return;

    const group = L.layerGroup().addTo(map);

    drawingPoints.forEach((pt) => {
      L.circleMarker([pt.lat, pt.lng], {
        radius: 5,
        color: '#ef4444',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      }).addTo(group);
    });

    if (drawingPoints.length >= 2) {
      const linePts: L.LatLngExpression[] = drawingPoints.map(p => [p.lat, p.lng]);
      L.polyline(linePts, { color: '#ef4444', weight: 2, dashArray: '5, 5' }).addTo(group);
    }

    drawingLayerGroupRef.current = group;

    return () => {
      if (drawingLayerGroupRef.current) {
        map.removeLayer(drawingLayerGroupRef.current);
        drawingLayerGroupRef.current = null;
      }
    };
  }, [drawingPoints]);

  // Heatmap Density Overlays for Leaflet
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatmapLayerGroupRef.current) {
      map.removeLayer(heatmapLayerGroupRef.current);
      heatmapLayerGroupRef.current = null;
    }

    if (!activeOverlay || activeOverlay === 'none') return;

    const layerGroup = L.layerGroup().addTo(map);

    leads.forEach(lead => {
      let weight = 0;
      let outerColor = '#06b6d4';
      let midColor = '#d946ef';
      let innerColor = '#ef4444';

      if (activeOverlay === 'density') {
        const urgency = lead.urgencyScore || 5;
        const ltv = lead.predictedLtvUsd || 0;
        weight = Math.min(1.0, (urgency / 10) * 0.6 + (ltv / 15000) * 0.4);
        outerColor = '#06b6d4';
        midColor = '#d946ef';
        innerColor = '#ef4444';
      } else if (activeOverlay === 'revenue') {
        const ltv = lead.predictedLtvUsd || 0;
        weight = Math.min(1.0, ltv / 20000);
        outerColor = '#10b981'; // emerald
        midColor = '#34d399';
        innerColor = '#059669';
      } else if (activeOverlay === 'neural') {
        const score = lead.urgencyScore || 5;
        weight = score / 10;
        outerColor = '#8b5cf6'; // violet
        midColor = '#a855f7'; // purple
        innerColor = '#d946ef'; // fuchsia
      }

      if (weight <= 0) return;

      // Outer radial aura
      L.circle([lead.coords.lat, lead.coords.lng], {
        radius: 2200 + (weight * 1000),
        color: 'transparent',
        fillColor: outerColor,
        fillOpacity: 0.14,
        interactive: false
      }).addTo(layerGroup);

      // Mid warm aura
      L.circle([lead.coords.lat, lead.coords.lng], {
        radius: 1200 + (weight * 600),
        color: 'transparent',
        fillColor: midColor,
        fillOpacity: 0.24,
        interactive: false
      }).addTo(layerGroup);

      // Inner core
      L.circle([lead.coords.lat, lead.coords.lng], {
        radius: 450 + (weight * 300),
        color: 'transparent',
        fillColor: innerColor,
        fillOpacity: 0.45,
        interactive: false
      }).addTo(layerGroup);
    });

    heatmapLayerGroupRef.current = layerGroup;

    return () => {
      if (heatmapLayerGroupRef.current) {
        map.removeLayer(heatmapLayerGroupRef.current);
        heatmapLayerGroupRef.current = null;
      }
    };
  }, [activeOverlay, leads]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([center.lat, center.lng], 11);

    mapRef.current = map;

    // Track cursor coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorGeo({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let options: L.TileLayerOptions = {
      maxZoom: 19,
      subdomains: 'abcd'
    };

    if (activeLayer === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = { maxZoom: 19 };
    } else if (activeLayer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      options = { maxZoom: 18 };
    }

    const tileLayer = L.tileLayer(url, options).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [activeLayer]);

  // Center update
  useEffect(() => {
    const map = mapRef.current;
    if (map && center && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.flyTo([center.lat, center.lng], map.getZoom() || 11, { duration: 0.8 });
    }
  }, [center]);

  // Lead Markers Update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    leads.forEach(lead => {
      const isSelected = selectedLeadId === lead.id;
      
      let color = '#3b82f6'; // new
      if (lead.status === 'contacted') color = '#f59e0b';
      if (lead.status === 'converted') color = '#10b981';

      const customHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          ${isSelected ? `<div style="position: absolute; top: -6px; width: 34px; height: 34px; border-radius: 50%; border: 2px solid ${color}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.8;"></div>` : ''}
          <div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #111827; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.6); transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'}; transition: transform 0.2s;">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
          <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.95); border: 1px solid #374151; padding: 2px 5px; border-radius: 3px; font-size: 9px; font-family: monospace; color: #f8fafc; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            ${lead.businessName}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'custom-osm-pin',
        iconSize: [28, 40],
        iconAnchor: [14, 20]
      });

      const marker = L.marker([lead.coords.lat, lead.coords.lng], { icon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="padding: 10px; font-family: sans-serif; font-size: 11px; color: #f3f4f6; width: 220px; background: #111827; border-radius: 4px;">
          <div style="font-size: 10px; font-family: monospace; color: #3b82f6; text-transform: uppercase; font-weight: bold;">${lead.serviceType}</div>
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 6px; color: white;">${lead.businessName}</div>
          
          <div style="font-size: 10px; color: #9ca3af; margin-bottom: 4px; line-height: 1.4;">
            <div>CITY: <b style="color:#e5e7eb;">${(lead.city || 'TERRITORY').toUpperCase()}</b></div>
            ${lead.ownerName ? `<div>OWNER: <b style="color:#e5e7eb;">${lead.ownerName}</b></div>` : ''}
            ${lead.phone ? `<div>PHONE: <b style="color:#e5e7eb;">${lead.phone}</b></div>` : ''}
          </div>

          <div style="display: flex; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #374151;">
            <div style="background: #1f2937; padding: 3px 6px; border-radius: 3px; font-size: 9px; font-family: monospace;">
              SEO: <b style="color:#10b981;">${lead.seoScore || 'N/A'}/100</b>
            </div>
            <div style="background: #1f2937; padding: 3px 6px; border-radius: 3px; font-size: 9px; font-family: monospace;">
              SPEED: <b style="color:#f59e0b;">${lead.performanceScore || 'N/A'}/100</b>
            </div>
          </div>

          ${lead.predictedLtvUsd ? `
            <div style="margin-top: 6px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px; border-radius: 3px; font-size: 10px; font-family: monospace; color: #60a5fa; text-align: center;">
              EST. LTV: <b>$${lead.predictedLtvUsd.toLocaleString()} USD</b>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true
      });

      marker.on('click', () => {
        onSelectLead?.(lead.id);
      });

      markersRef.current.set(lead.id, marker);
    });
  }, [leads, selectedLeadId]);

  // Center & Open Popup on Selected Lead
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLeadId) return;

    const targetMarker = markersRef.current.get(selectedLeadId);
    if (targetMarker) {
      const latLng = targetMarker.getLatLng();
      map.flyTo([latLng.lat, latLng.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
      targetMarker.openPopup();
    }
  }, [selectedLeadId]);

  // Search address using OpenStreetMap Nominatim API
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lon], 13, { duration: 1.2 });

          // Add search pin
          if (searchMarkerRef.current) {
            searchMarkerRef.current.remove();
          }

          const searchIcon = L.divIcon({
            html: `
              <div style="background: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(239,68,68,0.5);">
                <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
              </div>
            `,
            className: 'search-marker-pin',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          searchMarkerRef.current = L.marker([lat, lon], { icon: searchIcon })
            .addTo(mapRef.current)
            .bindPopup(`<div style="color:black; font-weight:bold; font-size:11px;">${top.display_name}</div>`)
            .openPopup();
        }
      }
    } catch (err) {
      console.warn('[OpenStreetMap] Address search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative border border-border-dark rounded-sm overflow-hidden flex-1 min-h-[440px] flex flex-col bg-[#0b0e14] select-none">
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap gap-2 justify-between items-center bg-panel-dark/95 backdrop-blur-md p-2 border border-border-dark rounded-sm shadow-2xl">
        <div className="flex items-center gap-2 px-1">
          <Globe className="w-4 h-4 text-brand animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider">
              {city}
            </span>
            <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              OPENSTREETMAP REAL TILES
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Address & City Search */}
          <form onSubmit={handleAddressSearch} className="relative max-w-xs flex-1 min-w-[140px] sm:min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search OSM address or city..."
              className="w-full bg-bg-dark border border-border-dark hover:border-text-secondary/30 rounded-sm p-1.5 pl-8.5 pr-6 text-[11px] font-mono text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand transition-colors"
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            )}
          </form>

          {/* Layer Selector */}
          <div className="flex items-center bg-bg-dark border border-border-dark rounded-sm p-0.5">
            <button
              onClick={() => setActiveLayer('dark')}
              className={`px-2 py-1 text-[9px] font-mono rounded-sm transition-colors cursor-pointer ${
                activeLayer === 'dark' ? 'bg-brand text-text-primary font-bold' : 'text-text-dim hover:text-text-primary'
              }`}
            >
              DARK
            </button>
            <button
              onClick={() => setActiveLayer('streets')}
              className={`px-2 py-1 text-[9px] font-mono rounded-sm transition-colors cursor-pointer ${
                activeLayer === 'streets' ? 'bg-brand text-text-primary font-bold' : 'text-text-dim hover:text-text-primary'
              }`}
            >
              STREETS
            </button>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`px-2 py-1 text-[9px] font-mono rounded-sm transition-colors cursor-pointer ${
                activeLayer === 'satellite' ? 'bg-brand text-text-primary font-bold' : 'text-text-dim hover:text-text-primary'
              }`}
            >
              SATELLITE
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-bg-dark border border-border-dark rounded-sm p-0.5">
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-6 h-6 flex items-center justify-center text-[12px] font-mono font-bold text-text-dim hover:text-text-primary border-r border-border-dark hover:bg-bg-subtle transition-colors cursor-pointer"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-6 h-6 flex items-center justify-center text-[12px] font-mono font-bold text-text-dim hover:text-text-primary border-r border-border-dark hover:bg-bg-subtle transition-colors cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.flyTo([center.lat, center.lng], 11)}
              className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-brand hover:bg-bg-subtle transition-colors cursor-pointer"
              title="Recenter Map"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Google Maps toggle if valid key */}
          {hasValidKey && onSwitchToGoogle && (
            <button
              onClick={onSwitchToGoogle}
              className="bg-bg-dark border border-border-dark hover:border-brand text-text-dim hover:text-text-primary px-2 py-1.5 rounded-sm text-[9px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch to Google Maps JS API"
            >
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">GOOGLE MAPS</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Map Leaflet Container */}
      <div ref={containerRef} className="w-full h-full flex-1 min-h-[380px] z-0" />

      {activeOverlay !== 'none' && (
        <div className="absolute bottom-12 right-3 z-20 bg-panel-dark/95 backdrop-blur-md p-2 border border-border-dark rounded-sm shadow-2xl font-mono text-[9px] text-text-primary flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 font-bold">
            <Flame className={`w-3.5 h-3.5 animate-pulse ${activeOverlay === 'revenue' ? 'text-emerald-400' : activeOverlay === 'neural' ? 'text-purple-400' : 'text-cyan-400'}`} />
            <span className="uppercase">
              {activeOverlay === 'density' && 'OPPORTUNITY DENSITY SPECTRUM'}
              {activeOverlay === 'revenue' && 'REVENUE POTENTIAL HEATMAP'}
              {activeOverlay === 'neural' && 'NEURAL CONVERSION CONFIDENCE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-text-dim">LOW</span>
            <div className={`h-2 w-32 rounded-full bg-gradient-to-r ${
              activeOverlay === 'revenue' ? 'from-emerald-900 via-emerald-500 to-emerald-300' : 
              activeOverlay === 'neural' ? 'from-indigo-900 via-purple-500 to-fuchsia-400' : 
              'from-cyan-400 via-blue-500 via-magenta-500 to-red-500'
            }`} />
            <span className="text-[8px] font-bold">HIGH</span>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center px-3 py-2 bg-panel-dark/95 border-t border-border-dark text-[9px] font-mono text-text-dim shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span>NEW PROSPECT ({leads.filter(l => l.status === 'new').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span>CONTACTED ({leads.filter(l => l.status === 'contacted').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>CONVERTED ({leads.filter(l => l.status === 'converted').length})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {cursorGeo && (
            <span>
              CURSOR: {cursorGeo.lat.toFixed(4)}° N, {cursorGeo.lng.toFixed(4)}° W
            </span>
          )}
          <span>REAL TILES ACTIVE (OSM/CARTO/ESRI)</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. Main Exported LeadMap Component
// ==========================================

export default function LeadMap(props: LeadMapProps) {
  const [useOsmMode, setUseOsmMode] = useState<boolean>(!hasValidKey);
  const [isAuthFailed, setIsAuthFailed] = useState<boolean>(false);
  const [isLoadingGoogleScript, setIsLoadingGoogleScript] = useState<boolean>(hasValidKey);

  // Catch global Google Maps auth failures (e.g. InvalidKeyMapError)
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[LeadMap] Google Maps authentication failed (InvalidKeyMapError). Safely switching to OpenStreetMap Real Tile Engine.');
      setIsAuthFailed(true);
      setIsLoadingGoogleScript(false);
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
    };
  }, []);

  // Simulate or track Google Maps lazy load initialization timeout
  useEffect(() => {
    if (!hasValidKey) {
      setIsLoadingGoogleScript(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoadingGoogleScript(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // If key is missing or auth failed or user toggled OSM mode
  if (!hasValidKey || isAuthFailed || useOsmMode) {
    return (
      <OpenStreetMapContainer 
        {...props} 
        onSwitchToGoogle={hasValidKey && !isAuthFailed ? () => setUseOsmMode(false) : undefined}
      />
    );
  }

  // Render Google Maps wrapped inside ErrorBoundary and Loading Overlay
  return (
    <div className="relative w-full h-full min-h-[440px] flex flex-col">
      {isLoadingGoogleScript && (
        <div className="absolute inset-0 z-50 bg-panel-dark/95 backdrop-blur-md flex flex-col items-center justify-center space-y-3 font-mono text-xs">
          <Compass className="w-8 h-8 text-brand animate-spin" />
          <div className="text-text-primary font-bold">INITIALIZING GOOGLE MAPS PLATFORM...</div>
          <div className="text-[10px] text-text-dim">Fetching territory vector tiles & geolocation libraries...</div>
        </div>
      )}
      <MapErrorBoundary fallback={<OpenStreetMapContainer {...props} />}>
        <GoogleMapContainer 
          {...props} 
          onSwitchToOffline={() => setUseOsmMode(true)}
        />
      </MapErrorBoundary>
    </div>
  );
}
