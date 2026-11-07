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
- The existing CRM schema does not have dedicated latitude/longitude columns. The map reads OSM coordinates from the provenance JSON for imported OSM leads; other CRM leads still need a verified coordinate source before they can be pinned.

## Verification still required

Run the repository's frozen Bun install, TypeScript check, unit/integration/security tests, and production build on this branch. Then manually verify:
1. OpenFreeMap loads without a Google Maps key.
2. Weather cells refresh when the map viewport changes.
3. USGS events render and event details open.
4. Overpass POIs appear only for the visible viewport, named POIs can be added to the CRM review queue, and imported records retain OSM provenance and coordinates.
5. CRM leads without precise coordinates are not assigned invented map positions.
6. Harvest requests for 50 pass through the UI and authenticated API; actual results may be fewer.
7. Existing service-zone drawing and CRM selection still work.
