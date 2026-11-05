import {describe,expect,it} from 'vitest';
import {parseGoogleAdsConnection,buildGoogleAdsCityPerformanceQuery,buildGoogleAdsGeoConstantQuery,extractGoogleAdsStreamRows} from '../../src/lib/googleAdsIngestion';
const valid=JSON.stringify({clientId:'client.apps.googleusercontent.com',clientSecret:'secret',refreshToken:'refresh',customerId:'123-456-7890',loginCustomerId:'111-222-3333'});
describe('Google Ads history ingestion contract',()=>{
 it('normalizes account IDs and validates OAuth credentials',()=>expect(parseGoogleAdsConnection(valid)).toMatchObject({customerId:'1234567890',loginCustomerId:'1112223333'}));
 it('rejects malformed, incomplete and invalid account credentials',()=>{
  expect(()=>parseGoogleAdsConnection('not-json')).toThrow(/JSON/);
  expect(()=>parseGoogleAdsConnection(JSON.stringify({clientId:'x'}))).toThrow(/required/);
  expect(()=>parseGoogleAdsConnection(JSON.stringify({clientId:'x',clientSecret:'x',refreshToken:'x',customerId:'123'}))).toThrow(/10-digit/);
 });
 it('queries genuine city-level daily conversions over the last year',()=>{
  const q=buildGoogleAdsCityPerformanceQuery(); expect(q).toContain('FROM geographic_view'); expect(q).toContain('segments.geo_target_city'); expect(q).toContain('metrics.conversions'); expect(q).toContain('LAST_365_DAYS'); expect(q).toContain('LOCATION_OF_PRESENCE');
 });
 it('rejects unsafe geo-target resource names',()=>{
  expect(buildGoogleAdsGeoConstantQuery(['geoTargetConstants/123'])).toContain("'geoTargetConstants/123'");
  expect(()=>buildGoogleAdsGeoConstantQuery(["x' OR 1=1 --"])).toThrow(/resource list/);
 });
 it('flattens SearchStream batches and rejects invalid envelopes',()=>{
  expect(extractGoogleAdsStreamRows([{results:[{id:1}]},{results:[{id:2}]}])).toEqual([{id:1},{id:2}]);
  expect(extractGoogleAdsStreamRows([{results:[]}])).toEqual([]);
  expect(()=>extractGoogleAdsStreamRows({results:[]})).toThrow(/invalid/);
 });
});
