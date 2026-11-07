# HAL Lead Intelligence Map

## What changed in this workstream

- OpenFreeMap (OpenMapTiles / OpenStreetMap data) is the default basemap. The map style is loaded from the public OpenFreeMap Liberty style endpoint; no Google Maps API key is required.
- MapLibre GL JS is loaded from a pinned CDN version so this change does not require a package-lock or bun.lock rewrite.
- Existing CRM leads are plotted only when their record contains valid latitude/longitude coordinates. City-centroid offsets are not valid business locations and have been removed.
- The OSM Trades layer queries the visible map bounding box through Overpass for named mapped craft POIs. A user can add one to the CRM review queue; it is tagged as `openstreetmap_poi`, marked `UNVERIFIED_STAGING`, and given a human review task.
- The Weather layer samples a 4x4 grid within the visible viewport using Open-Meteo current conditions and near-term precipitation forecast. It is contextual weather, not proof of demand or damage.
- The Earthquakes layer reads the USGS past-week GeoJSON feed and displays event magnitude and source details.
- Saved service-zone polygons and drawing interactions remain supported.
- The contractor niche directory now includes a broad home-service taxonomy across construction, plumbing, HVAC, electrical, roofing, landscaping, renovation, exterior work, cleaning, pest control, and restoration.
- The harvester and authenticated harvest endpoint now accept a requested maximum of 50 leads. Discovery is still allowed to return fewer than requested and must not fabricate businesses to fill a quota.

## Source and evidence boundaries

| Layer | Source | What it establishes | What it does not establish |
|---|---|---|---|
| Basemap | OpenFreeMap / OpenStreetMap | Map geometry and labels | Business existence or contact validity |
| OSM Trades | Overpass API | A community-mapped POI and its OSM tags | Current operation, phone validity, or completeness |
| Weather | Open-Meteo | Modelled weather conditions/forecast at sampled grid points | Property damage or contractor demand |
| Earthquakes | USGS GeoJSON | Reported seismic events and magnitudes | Damage at a particular property |
| CRM pins | Lead record coordinates | The recorded coordinates, if present | Accuracy beyond the evidence used to record them |
| Web harvest | Gemini Google Search grounding | Search-grounded business candidates and source evidence | A direct Google Maps or registry integration |

## Important licensing / operational notes

- OpenFreeMap's public instance is offered without API keys or registration; retain visible attribution.
- Open-Meteo's free hosted API is for non-commercial use. HAL must replace it with a commercially licensed provider or a self-hosted/appropriately licensed data source before commercial production or a paid buyer deployment.
- Overpass and Nominatim are shared community services. Queries should stay limited to the visible map viewport or explicit user searches; do not bulk-download OSM data or use the public endpoints as an unrestricted scraping backend.
- OSM POIs enter the CRM only after an explicit user action on the map popup. Their OSM ID, type, attribution, and coordinates are preserved in the existing `groundingEvidence` JSON field; they remain unverified and require human review before outreach.
- The existing CRM schema does not have dedicated latitude/longitude columns. The map reads OSM and geocoding coordinates from the existing `groundingEvidence` JSONB field, avoiding a risky schema migration.
- Existing CRM records can be geocoded in tenant-scoped batches of up to 50 using Geoapify. Harvested leads now retain a public business address when a search source explicitly supports one. The geocoder uses that address first and accepts high-confidence building/house/amenity matches; when no address is available, it searches by business name and city with `type=amenity` and requires an exact/prefix name match. Both paths require confidence of at least 0.75 (or building-level confidence of at least 0.7 for an address). The geocoding record stores provider, coordinates, formatted address, result type, confidence, timestamp, precision, and attribution.
- If Geoapify cannot confidently identify a named business, the lead stays in the CRM but remains unpinned. City-only fallback coordinates and synthetic neighbourhood offsets are prohibited.
- Configure `GEOAPIFY_API_KEY` as a server-side secret before using the geocoding action. Never expose it through a `VITE_` client variable. Geoapify's published Free plan currently allows commercial production use within 3,000 credits/day and rate limits, with required attribution.

## Verification still required

Run the repository's frozen Bun install, TypeScript check, unit/integration/security tests, and production build on this branch. Then manually verify:
1. OpenFreeMap loads without a Google Maps key.
2. With `GEOAPIFY_API_KEY` configured, batch geocoding persists only high-confidence named business POIs; without the key, the endpoint returns a clear configuration error.
3. No city-centre or synthetic-offset coordinates are used for individual leads.
4. Weather cells refresh when the map viewport changes.
5. USGS events render and event details open.
6. Overpass POIs appear only for the visible viewport, named POIs can be added to the CRM review queue, and imported records retain OSM provenance and coordinates.
7. CRM leads without precise coordinates are not assigned invented map positions.
8. Harvest requests for 50 pass through the UI and authenticated API; actual results may be fewer.
9. Existing service-zone drawing and CRM selection still work.
