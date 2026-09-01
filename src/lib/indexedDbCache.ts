import { Lead } from '../types';

const DB_NAME = 'HAL_ConquestMapDB';
const DB_VERSION = 2;
const LEADS_STORE = 'cached_leads';
const META_STORE = 'cache_metadata';
const ZONES_STORE = 'service_zones';
const TILES_STORE = 'tile_packages';

export interface CacheInfo {
  leads: Lead[];
  lastCachedAt: string | null;
  count: number;
}

export interface ServiceZone {
  id: string;
  name: string;
  color: string;
  city: string;
  points: Array<{ lat: number; lng: number }>;
  createdAt: string;
}

export interface TilePackage {
  city: string;
  tileCount: number;
  sizeKb: number;
  downloadedAt: string;
}

/**
 * Opens or initializes the IndexedDB instance for local territory map caching.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for lead objects with coordinates metadata
      if (!db.objectStoreNames.contains(LEADS_STORE)) {
        const leadStore = db.createObjectStore(LEADS_STORE, { keyPath: 'id' });
        leadStore.createIndex('city', 'city', { unique: false });
        leadStore.createIndex('status', 'status', { unique: false });
      }

      // Store for metadata (timestamps, stats)
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }

      // Store for interactive polygon service zones
      if (!db.objectStoreNames.contains(ZONES_STORE)) {
        db.createObjectStore(ZONES_STORE, { keyPath: 'id' });
      }

      // Store for offline map tile packages
      if (!db.objectStoreNames.contains(TILES_STORE)) {
        db.createObjectStore(TILES_STORE, { keyPath: 'city' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.warn('[IndexedDB] Database open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Persists lead listings into local IndexedDB for offline access.
 */
export async function saveLeadsToIndexedDB(leads: Lead[]): Promise<void> {
  if (!leads || leads.length === 0) return;

  try {
    const db = await openDB();
    const tx = db.transaction([LEADS_STORE, META_STORE], 'readwrite');
    const leadStore = tx.objectStore(LEADS_STORE);
    const metaStore = tx.objectStore(META_STORE);

    // Write lead records
    for (const lead of leads) {
      leadStore.put(lead);
    }

    // Record cache timestamp
    const nowIso = new Date().toISOString();
    metaStore.put({ key: 'lastCachedAt', value: nowIso });
    metaStore.put({ key: 'cachedCount', value: leads.length });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] Successfully cached ${leads.length} prospect locations at ${nowIso}`);
        resolve();
      };
      tx.onerror = () => {
        console.warn('[IndexedDB] Transaction error while caching leads:', tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Save operation skipped or failed:', err);
  }
}

/**
 * Retrieves previously cached leads and metadata from IndexedDB.
 */
export async function getLeadsFromIndexedDB(): Promise<CacheInfo> {
  try {
    const db = await openDB();
    const tx = db.transaction([LEADS_STORE, META_STORE], 'readonly');
    const leadStore = tx.objectStore(LEADS_STORE);
    const metaStore = tx.objectStore(META_STORE);

    const getAllLeadsReq = leadStore.getAll();
    const getTimestampReq = metaStore.get('lastCachedAt');

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        const leads: Lead[] = getAllLeadsReq.result || [];
        const lastCachedAt: string | null = getTimestampReq.result ? getTimestampReq.result.value : null;
        resolve({
          leads,
          lastCachedAt,
          count: leads.length
        });
      };

      tx.onerror = () => {
        console.warn('[IndexedDB] Error fetching cached leads:', tx.error);
        resolve({ leads: [], lastCachedAt: null, count: 0 });
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Read operation failed:', err);
    return { leads: [], lastCachedAt: null, count: 0 };
  }
}

/**
 * Saves a custom Service Zone polygon.
 */
export async function saveServiceZone(zone: ServiceZone): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([ZONES_STORE], 'readwrite');
    tx.objectStore(ZONES_STORE).put(zone);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save service zone:', err);
  }
}

/**
 * Gets all custom Service Zones.
 */
export async function getServiceZones(): Promise<ServiceZone[]> {
  try {
    const db = await openDB();
    const tx = db.transaction([ZONES_STORE], 'readonly');
    const req = tx.objectStore(ZONES_STORE).getAll();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(req.result || []);
      tx.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Deletes a Service Zone by ID.
 */
export async function deleteServiceZone(zoneId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([ZONES_STORE], 'readwrite');
    tx.objectStore(ZONES_STORE).delete(zoneId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to delete service zone:', err);
  }
}

/**
 * Saves downloaded tile package metadata for offline maps.
 */
export async function saveTilePackage(pkg: TilePackage): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([TILES_STORE], 'readwrite');
    tx.objectStore(TILES_STORE).put(pkg);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save tile package:', err);
  }
}

/**
 * Gets cached tile packages.
 */
export async function getTilePackages(): Promise<TilePackage[]> {
  try {
    const db = await openDB();
    const tx = db.transaction([TILES_STORE], 'readonly');
    const req = tx.objectStore(TILES_STORE).getAll();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(req.result || []);
      tx.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Clears the IndexedDB cache for lead locations, zones, and tiles.
 */
export async function clearIndexedDBCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([LEADS_STORE, META_STORE, ZONES_STORE, TILES_STORE], 'readwrite');
    tx.objectStore(LEADS_STORE).clear();
    tx.objectStore(META_STORE).clear();
    tx.objectStore(ZONES_STORE).clear();
    tx.objectStore(TILES_STORE).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Clear cache failed:', err);
  }
}
