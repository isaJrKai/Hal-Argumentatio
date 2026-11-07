import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Lead } from '../types';
import LeadMap, { type TerritorySearchCandidate } from './LeadMap';
import { 
  saveLeadsToIndexedDB, 
  getLeadsFromIndexedDB, 
  clearIndexedDBCache,
  saveServiceZone,
  getServiceZones,
  deleteServiceZone,
  ServiceZone,
} from '../lib/indexedDbCache';
import { isPointInPolygon } from '../lib/geoUtils';
import { CITIES_CONFIG, CITY_COORDS_MAP, getCityCoordinates } from '../config/cities';
import { 
  Globe, 
  MapPin, 
  Filter, 
  Sparkles, 
  Search, 
  Compass, 
  Star,
  Activity, 
  TrendingUp, 
  ChevronRight,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  HardDrive,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Flame,
  Layers,
  Crosshair,
  Trash2,
  Plus,
  Square,
  Maximize2
} from 'lucide-react';

interface MapPanelProps {
  leads: Lead[];
  token: string | null;
  onOpenWorkQueue?: () => void;
}

function getPersistedLeadCoords(lead: Lead): { lat: number; lng: number } | null {
  const evidence = lead.groundingEvidence as Record<string, any> | undefined;
  const lat = Number(lead.latitude ?? evidence?.latitude ?? evidence?.geocoding?.latitude);
  const lng = Number(lead.longitude ?? evidence?.longitude ?? evidence?.geocoding?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export default function MapPanel({ leads, token, onOpenWorkQueue }: MapPanelProps) {
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isQueueingSelected, setIsQueueingSelected] = useState(false);
  const [queueFeedback, setQueueFeedback] = useState<string | null>(null);
  const [isInitializingMap, setIsInitializingMap] = useState<boolean>(true);
  const [activeOverlay, setActiveOverlay] = useState<string>('none');
  const [territoryResults, setTerritoryResults] = useState<TerritorySearchCandidate[]>([]);
  const [territorySearchStatus, setTerritorySearchStatus] = useState<string | null>(null);
  const [isSearchingTerritory, setIsSearchingTerritory] = useState(false);


  // IndexedDB Caching & Offline Fallback state
  const [displayLeads, setDisplayLeads] = useState<Lead[]>(leads);
  const [isUsingOfflineCache, setIsUsingOfflineCache] = useState<boolean>(false);
  const [lastCachedTime, setLastCachedTime] = useState<string | null>(null);
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Offline Tile Packages

  // Service Zones state
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string>('all');
  const [isDrawingZone, setIsDrawingZone] = useState<boolean>(false);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [newZoneName, setNewZoneName] = useState<string>('');
  const [newZoneColor, setNewZoneColor] = useState<string>('#3b82f6');
  const [showZoneManager, setShowZoneManager] = useState<boolean>(false);

  // Geocoding Service state
  const [geocodedCoordsMap, setGeocodedCoordsMap] = useState<Record<string, { lat: number; lng: number }>>({});
  const [isGeocodingActive, setIsGeocodingActive] = useState<boolean>(false);
  const [geocodingProgress, setGeocodingProgress] = useState<string | null>(null);
  const [geocodingSummary, setGeocodingSummary] = useState<string | null>(null);

  const handleGeocodeAllLeads = async () => {
    if (!token) {
      setGeocodingSummary('Sign in to geocode CRM businesses.');
      return;
    }
    // Geocode the tenant's full CRM dataset, not just currently visible/filtered
    // map rows. Leads without coordinates are excluded from polygon filters.
    const missingIds = displayLeads
      .filter(lead => !geocodedCoordsMap[lead.id] && !getPersistedLeadCoords(lead))
      .map(lead => lead.id);
    if (!missingIds.length) {
      setGeocodingSummary('All filtered leads already have sourced coordinates.');
      return;
    }

    setIsGeocodingActive(true);
    setGeocodingSummary(null);
    const nextCoords = { ...geocodedCoordsMap };
    let matchedCount = 0;
    let unmatchedCount = 0;
    const batches = Array.from({ length: Math.ceil(missingIds.length / 50) }, (_, index) =>
      missingIds.slice(index * 50, (index + 1) * 50)
    );

    try {
      for (let index = 0; index < batches.length; index++) {
        setGeocodingProgress(`Geoapify batch ${index + 1}/${batches.length} · ${batches[index].length} businesses`);
        const response = await fetch('/api/leads/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ leadIds: batches[index] })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Business geocoding failed.');
        }
        for (const result of data.results || []) {
          if (result.status === 'geocoded' && Number.isFinite(result.lat) && Number.isFinite(result.lng)) {
            nextCoords[result.leadId] = { lat: result.lat, lng: result.lng };
            matchedCount++;
          } else if (result.status === 'no_confident_business_match') {
            unmatchedCount++;
          }
        }
        setGeocodedCoordsMap({ ...nextCoords });
        if (data.providerRateLimited) {
          throw new Error('Geoapify request limit reached. Completed locations were saved; retry the remaining leads later.');
        }
      }
      setGeocodedCoordsMap(nextCoords);
      setGeocodingSummary(`Matched ${matchedCount} businesses · ${unmatchedCount} remain unpinned because no confident business location was found.`);
      logEvent('GEOAPIFY_GEOCODE_COMPLETE', `Persisted ${matchedCount} high-confidence business locations; ${unmatchedCount} remain unpinned.`);
    } catch (error: any) {
      const message = error?.message || 'Geocoding failed.';
      setGeocodingSummary(`${message} ${matchedCount} locations were already saved in this run.`);
      logEvent('GEOAPIFY_GEOCODE_FAILED', message);
    } finally {
      setIsGeocodingActive(false);
      setGeocodingProgress(null);
    }
  };

  // Monitor browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync incoming leads with IndexedDB local cache or fallback to cached items
  useEffect(() => {
    let isMounted = true;

    async function syncCache() {
      if (leads && leads.length > 0) {
        // Live incoming leads present -> Update view & cache to IndexedDB
        setDisplayLeads(leads);
        setIsUsingOfflineCache(false);
        await saveLeadsToIndexedDB(leads);
        
        const cacheInfo = await getLeadsFromIndexedDB();
        if (isMounted) {
          setLastCachedTime(cacheInfo.lastCachedAt);
          setCachedCount(cacheInfo.count);
        }
      } else {
        // No live leads provided (or offline mode) -> Load cached items from IndexedDB
        const cacheInfo = await getLeadsFromIndexedDB();
        if (isMounted && cacheInfo.leads.length > 0) {
          setDisplayLeads(cacheInfo.leads);
          setIsUsingOfflineCache(true);
          setLastCachedTime(cacheInfo.lastCachedAt);
          setCachedCount(cacheInfo.count);
        }
      }
    }

    syncCache();

    return () => {
      isMounted = false;
    };
  }, [leads]);

  // System audit log integration
  const logEvent = async (action: string, details: string) => {
    if (!token) return;
    try {
      await fetch('/api/system/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, details }),
      });
    } catch (err) {
      console.error('[MapPanel] Failed to write audit log:', err);
    }
  };

  // Log initial map view mounting and map provider resolution
  useEffect(() => {
    const provider = 'OpenFreeMap / MapLibre GL JS';
    logEvent('MAP_DASHBOARD_MOUNTED', `Lead intelligence map opened via ${provider}. Available entries: ${displayLeads.length}`);

    const timer = setTimeout(() => {
      setIsInitializingMap(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleTerritorySearch = useCallback(async (query: string) => {
    if (!token) {
      setTerritorySearchStatus('Sign in to search and save territory prospects.');
      return;
    }
    const match = query.match(/^(.+?)\s+(?:near|in|around)\s+(.+)$/i);
    const niche = match?.[1]?.trim() || (cityFilter !== 'all' ? query.trim() : '');
    const city = match?.[2]?.trim() || (cityFilter !== 'all' ? cityFilter : '');
    if (!niche || !city) {
      setTerritorySearchStatus('Use a search like “plumbers near Fredericton” or choose a city first.');
      return;
    }
    setCityFilter(city.toLowerCase());
    setActiveZoneId('all');
    setIsSearchingTerritory(true);
    setTerritorySearchStatus(`Searching for ${niche} in ${city}…`);
    setTerritoryResults([]);
    try {
      const response = await fetch('/api/maps/territory-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ city, niche, limit: 30, activeAi: localStorage.getItem('hal_active_ai') || 'gemini' })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Territory search failed.');
      const results = Array.isArray(data.results) ? data.results : [];
      setTerritoryResults(results);
      setTerritorySearchStatus(`${results.length} candidates · ${results.filter((item: TerritorySearchCandidate) => item.latitude != null && item.longitude != null).length} located · Reviews ${data.providers?.reviews || 'unavailable'}`);
      if (!results.length) setTerritorySearchStatus(`No candidates found for ${niche} in ${city}. Try a broader trade or nearby city.`);
      logEvent('MAP_TERRITORY_SEARCH', `Searched ${niche} in ${city}; received ${results.length} candidates.`);
    } catch (error: any) {
      setTerritorySearchStatus(error?.message || 'Territory search failed.');
    } finally {
      setIsSearchingTerritory(false);
    }
  }, [token, cityFilter]);

  const handleImportTerritoryResult = useCallback(async (candidate: TerritorySearchCandidate) => {
    if (!token) throw new Error('Sign in before importing prospects.');
    const response = await fetch('/api/leads/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        leads: [{
          businessName: candidate.businessName,
          city: candidate.city,
          serviceType: candidate.serviceType,
          address: candidate.address,
          websiteUrl: candidate.websiteUrl,
          phone: candidate.phone,
          email: candidate.email,
          sourceType: candidate.sourceType,
          verificationStatus: candidate.verificationStatus || 'UNVERIFIED_STAGING',
          isSynthetic: false,
          notes: candidate.notes || 'Discovered through HAL territory search. Verify details before outreach.',
          groundingEvidence: {
            ...(candidate.groundingEvidence || {}),
            source: 'hal_territory_search',
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            locationSource: candidate.locationSource,
            googleMapsUrl: candidate.googleMapsUrl,
            reviewSource: candidate.reviewSource
          }
        }]
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Could not add this business to CRM.');
    const added = Array.isArray(data.leads) ? data.leads : [];
    if (added.length) {
      const row = added[0];
      const mapped: Lead = {
        id: row.id,
        contractorId: row.contractorId,
        businessName: row.businessName,
        ownerName: row.ownerName || undefined,
        city: row.city,
        serviceType: row.niche || candidate.serviceType,
        source: row.source || 'harvested_intelligence',
        status: row.status || 'new',
        urgencyScore: null,
        predictedLtvUsd: null,
        websiteUrl: candidate.websiteUrl,
        verificationStatus: (row.verificationStatus || 'UNVERIFIED_STAGING') as Lead['verificationStatus'],
        sourceType: (row.sourceType || candidate.sourceType) as Lead['sourceType'],
        groundingEvidence: row.groundingEvidence || {},
        createdAt: new Date(row.createdAt || Date.now()).toISOString(),
        updatedAt: new Date(row.updatedAt || Date.now()).toISOString()
      };
      setDisplayLeads(current => current.some(item => item.id === mapped.id) ? current : [mapped, ...current]);
      setTerritoryResults(current => current.filter(item => item.businessName !== candidate.businessName));
      setTerritorySearchStatus(`${candidate.businessName} added to CRM · human review task created`);
    } else {
      setTerritorySearchStatus(`${candidate.businessName} already exists in CRM or was skipped as a duplicate.`);
    }
    logEvent('MAP_TERRITORY_PROSPECT_IMPORTED', `Imported ${candidate.businessName} from territory search.`);
  }, [token]);

  // Add a point while drawing polygon
  const handleAddZonePoint = (point: { lat: number; lng: number }) => {
    setDrawingPoints(prev => [...prev, point]);
  };

  // Save the drawn polygon as a Service Zone
  const handleSaveDrawnZone = async () => {
    if (drawingPoints.length < 3) {
      alert('Please click at least 3 points on the map to define a closed service zone polygon.');
      return;
    }
    const name = newZoneName.trim() || `Service Zone ${serviceZones.length + 1}`;
    const targetCity = cityFilter === 'all' ? (displayLeads[0]?.city || 'Winnipeg') : cityFilter;

    const newZone: ServiceZone = {
      id: 'zone_' + Date.now(),
      name,
      color: newZoneColor,
      city: targetCity,
      points: drawingPoints,
      createdAt: new Date().toISOString()
    };

    await saveServiceZone(newZone);
    const updatedZones = await getServiceZones();
    setServiceZones(updatedZones);
    setActiveZoneId(newZone.id);
    setIsDrawingZone(false);
    setDrawingPoints([]);
    setNewZoneName('');
    logEvent('SERVICE_ZONE_CREATED', `Created custom service zone "${name}" in ${targetCity} with ${drawingPoints.length} vertices.`);
  };

  const handleDeleteZone = async (zoneId: string) => {
    await deleteServiceZone(zoneId);
    const updatedZones = await getServiceZones();
    setServiceZones(updatedZones);
    if (activeZoneId === zoneId) {
      setActiveZoneId('all');
    }
    logEvent('SERVICE_ZONE_DELETED', `Deleted service zone ${zoneId}.`);
  };

  // Filter leads by search, city, status, and active Service Zone Polygon
  const filteredLeads = useMemo(() => {
    const activeZone = serviceZones.find(z => z.id === activeZoneId);

    return displayLeads.filter((l, idx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        l.businessName.toLowerCase().includes(q) ||
        (l.ownerName && l.ownerName.toLowerCase().includes(q)) ||
        l.serviceType.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q);

      const matchesCity = cityFilter === 'all' || l.city.toLowerCase() === cityFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

      if (!matchesSearch || !matchesCity || !matchesStatus) return false;

      // Filter by Active Polygon Service Zone
      if (activeZone && activeZone.points && activeZone.points.length >= 3) {
        const leadCoord = geocodedCoordsMap[l.id] || getPersistedLeadCoords(l);
        return leadCoord ? isPointInPolygon(leadCoord, activeZone.points) : false;
      }

      return true;
    });
  }, [displayLeads, searchQuery, cityFilter, statusFilter, activeZoneId, serviceZones, geocodedCoordsMap]);

  // Coordinate mapper: only persisted or provider-confirmed business locations are plotted
  const mappedLeadsForMap = useMemo(() => {
    return filteredLeads.map((lead) => {
      const coords = geocodedCoordsMap[lead.id] || getPersistedLeadCoords(lead);

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
        coords
      };
    });
  }, [filteredLeads, geocodedCoordsMap]);

  // Center coordinate
  const mapCenter = useMemo(() => {
    if (cityFilter !== 'all') {
      return getCityCoordinates(cityFilter);
    }

    if (filteredLeads.length > 0) {
      return getCityCoordinates(filteredLeads[0].city);
    }

    return { lat: 49.8951, lng: -97.1384 };
  }, [cityFilter, filteredLeads]);

  // Dynamic unique list of cities with counts
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    displayLeads.forEach(l => {
      const c = l.city.trim();
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [displayLeads]);

  // KPIs
  const totalCount = filteredLeads.length;
  const convertedCount = filteredLeads.filter(l => l.status === 'converted').length;
  const conversionRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;
  const totalValue = filteredLeads.reduce((sum, l) => sum + (l.predictedLtvUsd || 0), 0);

  const toggleLeadForQueue = (leadId: string) => {
    setSelectedLeadIds(current => current.includes(leadId) ? current.filter(id => id !== leadId) : [...current, leadId]);
    setQueueFeedback(null);
  };

  const handleQueueSelectedLeads = async () => {
    if (!token || selectedLeadIds.length === 0) return;
    setIsQueueingSelected(true);
    setQueueFeedback(null);
    let created = 0;
    let alreadyActive = 0;
    try {
      for (const leadId of selectedLeadIds) {
        const lead = displayLeads.find(item => item.id === leadId);
        if (!lead) continue;
        const response = await fetch('/api/work-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            taskType: 'lead_follow_up',
            title: `Review and follow up: ${lead.businessName}`,
            description: 'Continue work on this prospect from Map Intelligence. Confirm evidence, choose the appropriate next step, and record the outcome in the lead workspace.',
            assignedWorker: 'human', priority: 'normal', entityType: 'lead', entityId: lead.id, requiresApproval: false
          })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Could not queue ${lead.businessName}.`);
        if (body.duplicate) alreadyActive++;
        else created++;
      }
      setSelectedLeadIds([]);
      setQueueFeedback(`Queued ${created} new task${created === 1 ? '' : 's'}; ${alreadyActive} already active.`);
    } catch (err: any) {
      setQueueFeedback(`Queued ${created} new tasks; ${alreadyActive} were already active. ${err?.message || 'Some tasks could not be queued.'}`);
    } finally { setIsQueueingSelected(false); }
  };

  const handleSelectLead = (id: string | null) => {
    setSelectedLeadId(id);
    if (id) {
      const found = displayLeads.find(l => l.id === id);
      if (found) {
        logEvent('MAP_LEAD_LOCATED', `Located prospect: ${found.businessName} (ID: ${found.id}) in ${found.city}`);
      }
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* HEADER BAR WITH INDEXEDDB CACHE STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-raised border border-border-dim p-4.5 rounded-sm">
        <div>
          <h2 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand animate-pulse" /> Maps
          </h2>
          <p className="text-[11px] text-text-secondary font-sans mt-1">
            Find nearby businesses, review their details and add prospects to your list.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isOnline && (
            <div role="status" className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
              <WifiOff className="w-4 h-4" />
              Offline · showing saved prospect data
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-text-secondary">
        {totalCount} {totalCount === 1 ? 'prospect' : 'prospects'} shown
        {activeZoneId !== 'all' && serviceZones.find(z => z.id === activeZoneId)?.name ? ` · ${serviceZones.find(z => z.id === activeZoneId)?.name}` : ''}
      </div>

      {/* SPATIAL ZONE DRAWING BAR */}
      <div className="bg-bg-raised border border-border-dim p-4 rounded-sm space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-text-primary uppercase">Service areas</span>
            <span className="text-[10px] text-text-secondary">({serviceZones.length} defined)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Zone Filter Dropdown */}
            <select
              value={activeZoneId}
              onChange={(e) => setActiveZoneId(e.target.value)}
              className="bg-bg-subtle border border-border-dim rounded-sm px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
            >
              <option value="all">All areas</option>
              {serviceZones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.city})
                </option>
              ))}
            </select>

            {/* Google Maps Geocode Button */}
            <button
              onClick={handleGeocodeAllLeads}
              disabled={isGeocodingActive}
              className="flex items-center gap-1.5 px-3 py-1 bg-brand/20 text-brand border border-brand/40 text-xs font-bold rounded-sm hover:bg-brand/30 transition-colors cursor-pointer disabled:opacity-50"
              title="Find and save high-confidence named business locations. Unmatched leads remain unpinned."
            >
              {isGeocodingActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
              <span>{isGeocodingActive ? (geocodingProgress || 'GEOCODING...') : 'Locate prospects'}</span>
            </button>
            <div className="basis-full text-[9px] font-mono text-text-dim">
              {geocodingSummary || 'Geoapify · named business matches only · no city-centre pins'}
              {' · '}
              <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer" className="underline">Powered by Geoapify</a>
            </div>

            {/* Draw Polygon Button */}
            {!isDrawingZone ? (
              <button
                onClick={() => {
                  setIsDrawingZone(true);
                  setDrawingPoints([]);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-brand text-white text-xs font-bold rounded-sm hover:bg-brand-hover transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Draw area
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-400 font-bold animate-pulse">
                  Click the map to draw an area ({drawingPoints.length} points)
                </span>
                <input
                  type="text"
                  placeholder="Area name"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="bg-bg-subtle border border-border-dim rounded-sm px-2 py-1 text-xs text-text-primary placeholder:text-text-dim w-36"
                />
                <select
                  value={newZoneColor}
                  onChange={(e) => setNewZoneColor(e.target.value)}
                  className="bg-bg-subtle border border-border-dim rounded-sm px-2 py-1 text-xs text-text-primary"
                >
                  <option value="#3b82f6">BLUE</option>
                  <option value="#10b981">EMERALD</option>
                  <option value="#f59e0b">AMBER</option>
                  <option value="#8b5cf6">PURPLE</option>
                  <option value="#ef4444">ROSE</option>
                </select>
                <button
                  onClick={handleSaveDrawnZone}
                  className="px-2.5 py-1 bg-positive text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  SAVE ZONE
                </button>
                <button
                  onClick={() => {
                    setIsDrawingZone(false);
                    setDrawingPoints([]);
                  }}
                  className="px-2.5 py-1 bg-bg-subtle border border-border-dim text-text-secondary text-xs rounded-sm hover:text-text-primary cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saved Zones Tag Pills */}
        {serviceZones.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-dim/40">
            <span className="text-[10px] text-text-dim">SAVED ZONES:</span>
            {serviceZones.map(z => (
              <div
                key={z.id}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                  activeZoneId === z.id
                    ? 'bg-brand/20 border-brand text-brand font-bold'
                    : 'bg-bg-subtle border-border-dim text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
                <span onClick={() => setActiveZoneId(activeZoneId === z.id ? 'all' : z.id)}>{z.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteZone(z.id);
                  }}
                  className="text-text-dim hover:text-red-400 ml-1"
                  title="Delete Zone"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTER PANEL */}
      <div className="bg-bg-raised border border-border-dim p-4.5 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-dim/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-brand" />
            <span className="text-[11px] font-mono font-bold text-text-primary uppercase">Territory Scope & Visualization Settings</span>
          </div>
          {activeOverlay !== 'none' && (
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse font-bold">
              <Flame className="w-3 h-3 text-amber-400" /> OVERLAY ACTIVE
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* City Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase">SELECT TARGET CITY</label>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setSelectedLeadId(null);
                logEvent('MAP_FILTER_CITY', `Scope filtered to City: ${(e.target.value || 'ALL').toUpperCase()}`);
              }}
              className="w-full bg-bg-subtle border border-border-dim hover:border-text-secondary/30 rounded-sm p-2 text-xs text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="all">ALL TERRITORIES</option>
              {Object.keys(cityCounts).map(city => (
                <option key={city} value={city.toLowerCase()}>
                  {(city || 'TERRITORY').toUpperCase()} ({cityCounts[city]} leads)
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase">PIPELINE STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedLeadId(null);
                logEvent('MAP_FILTER_STATUS', `Scope filtered to Status: ${(e.target.value || 'ALL').toUpperCase()}`);
              }}
              className="w-full bg-bg-subtle border border-border-dim hover:border-text-secondary/30 rounded-sm p-2 text-xs text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="all">ALL PIPELINE STAGES</option>
              <option value="new">NEW (PROSPECTS)</option>
              <option value="contacted">CONTACTED</option>
              <option value="converted">CONVERTED (CLIENTS)</option>
            </select>
          </div>

          {/* Existing CRM search, with an explicit action to discover new territory prospects */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase">SEARCH</label>
            <div className="flex gap-1.5">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Business, trade, owner or “plumbers near Kampala”"
                  className="w-full bg-bg-subtle border border-border-dim hover:border-text-secondary/30 rounded-sm p-2 pl-8.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleTerritorySearch(searchQuery)}
                disabled={isSearchingTerritory || !searchQuery.trim()}
                title="Discover new businesses for this trade and territory"
                className="shrink-0 rounded-sm border border-brand/50 bg-brand/10 px-2.5 text-[9px] font-mono font-bold text-brand hover:bg-brand/20 disabled:opacity-40"
              >
                {isSearchingTerritory ? 'SEARCHING…' : 'DISCOVER'}
              </button>
            </div>
            {territorySearchStatus && <p className="text-[9px] text-text-secondary">{territorySearchStatus}</p>}
          </div>

          {/* Heatmap Density Layer Toggle */}
          {/* Map Overlay Layer Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center justify-between">
              <span>DATA OVERLAY</span>
              <span className={activeOverlay !== 'none' ? 'text-brand font-bold' : 'text-text-dim'}>
                {activeOverlay !== 'none' ? 'ACTIVE' : 'OFF'}
              </span>
            </label>
            <select
              value={activeOverlay}
              onChange={(e) => {
                setActiveOverlay(e.target.value);
                logEvent('MAP_CHANGE_OVERLAY', `Overlay changed to ${e.target.value}`);
              }}
              className="w-full bg-bg-subtle border border-border-dim hover:border-brand rounded-sm p-2 text-xs text-text-primary focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="none">No Overlay</option>
              <option value="density">Opportunity Density</option>
              <option value="revenue">Revenue Heatmap</option>
              <option value="neural">Neural Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRIMARY GRID - LIST + MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEADS LIST SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col h-[550px] bg-bg-raised border border-border-dim rounded-sm overflow-hidden">
          <div className="bg-bg-subtle border-b border-border-dim p-3 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-mono font-bold text-text-primary uppercase">TERRITORY LEDGER LIST</span>
            <span className="bg-bg-raised border border-border-dim px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-brand">
              {filteredLeads.length} listings
            </span>
          </div>

          {selectedLeadIds.length > 0 && (
            <div className="p-2.5 border-b border-border-dim bg-accent/5 space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-text-secondary">{selectedLeadIds.length} SELECTED</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSelectedLeadIds([])} className="px-2 py-1 text-[9px] font-mono text-text-tertiary hover:text-text-primary">Clear</button>
                  <button onClick={() => void handleQueueSelectedLeads()} disabled={isQueueingSelected || !token} className="px-2.5 py-1.5 rounded-sm bg-brand text-black text-[9px] font-mono font-bold disabled:opacity-50">{isQueueingSelected ? 'ADDING…' : 'ADD TO WORK QUEUE'}</button>
                </div>
              </div>
              {queueFeedback && <p className="text-[10px] text-text-secondary">{queueFeedback}</p>}
              {onOpenWorkQueue && <button onClick={onOpenWorkQueue} className="text-[9px] text-brand font-mono underline underline-offset-2">Open Work Queue</button>}
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-border-dim/40">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-text-dim font-mono text-[11px] uppercase tracking-wider">
                No matching leads in active viewport.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLeadId === lead.id;
                const isQueuedSelected = selectedLeadIds.includes(lead.id);
                
                let urgencyColor = 'text-text-dim border-border-dim bg-bg-subtle';
                if ((lead.urgencyScore || 0) >= 7.5) {
                  urgencyColor = 'text-accent border-accent/20 bg-accent-dim/10';
                } else if ((lead.urgencyScore || 0) >= 5) {
                  urgencyColor = 'text-warning border-warning/20 bg-warning-dim/10';
                }

                let statusBullet = 'bg-[#3b82f6]';
                if (lead.status === 'contacted') statusBullet = 'bg-[#f59e0b]';
                if (lead.status === 'converted') statusBullet = 'bg-[#10b981]';

                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    className={`p-3.5 transition-colors cursor-pointer text-left space-y-2 ${
                      isSelected ? 'bg-bg-subtle border-l-2 border-brand' : 'hover:bg-bg-subtle/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <input type="checkbox" checked={isQueuedSelected} onClick={event => event.stopPropagation()} onChange={() => toggleLeadForQueue(lead.id)} aria-label={`Select ${lead.businessName} for Work Queue`} className="mt-0.5 accent-[var(--color-brand)] shrink-0" />
                        <div className="min-w-0">
                        <h4 className="text-[11px] font-mono font-bold text-text-primary line-clamp-1">
                          {lead.businessName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBullet}`} />
                          <span className="text-[9px] font-mono text-text-secondary uppercase">{lead.status}</span>
                        </div>
                        </div>
                      </div>

                      <span className={`border px-1.5 py-0.5 rounded-sm text-[8px] font-mono font-bold ${urgencyColor}`}>
                        S:{lead.urgencyScore || '0.0'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px] text-text-secondary font-mono">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-text-dim shrink-0" />
                        <span className="truncate">{lead.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-text-dim shrink-0" />
                        <span className="truncate">{lead.serviceType}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-border-dim/20">
                      {lead.googleRating ? (
                        <div className="flex items-center gap-1 text-[9px] text-amber-500">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{lead.googleRating} ({lead.reviewCount})</span>
                        </div>
                      ) : (
                        <span className="text-[8px] font-mono text-text-dim">NO GOOGLE REVIEWS</span>
                      )}

                      <span className="text-[9.5px] font-mono font-bold text-brand">
                        ${(lead.predictedLtvUsd || 0).toLocaleString()} <span className="text-[8px] font-normal text-text-secondary">LTV</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MAP CONTAINER WITH LOADING OVERLAY */}
        <div className="lg:col-span-8 bg-bg-raised border border-border-dim rounded-sm flex flex-col h-[550px] relative overflow-hidden">
          {isInitializingMap && (
            <div className="absolute inset-0 z-50 bg-panel-dark/95 backdrop-blur-md flex flex-col items-center justify-center space-y-3 font-mono text-xs text-text-primary">
              <Compass className="w-8 h-8 text-brand animate-spin" />
              <div className="font-bold tracking-wider">INITIALIZING TERRITORY CONQUEST MAP...</div>
              <div className="text-[10px] text-text-dim flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                INITIALIZING OPENFREEMAP VECTOR TILES...
              </div>
            </div>
          )}

          <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
            <LeadMap
              leads={mappedLeadsForMap}
              center={mapCenter}
              city={cityFilter === 'all' ? (filteredLeads[0]?.city || 'Winnipeg') : cityFilter}
              selectedLeadId={selectedLeadId}
              onSelectLead={handleSelectLead}
              activeOverlay={activeOverlay}
              onChangeOverlay={(newOverlay) => {
                setActiveOverlay(newOverlay);
                
                logEvent('MAP_CHANGE_OVERLAY', `Overlay changed to ${newOverlay}`);
              }}
              serviceZones={serviceZones}
              isDrawingZone={isDrawingZone}
              onAddZonePoint={handleAddZonePoint}
              drawingPoints={drawingPoints}
              territoryResults={territoryResults}
              onImportTerritoryResult={handleImportTerritoryResult}
              territorySearchStatus={territorySearchStatus}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

