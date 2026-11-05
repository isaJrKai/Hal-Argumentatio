export interface GoogleAdsConnection { clientId:string; clientSecret:string; refreshToken:string; customerId:string; loginCustomerId?:string; developerToken?:string; }
export function parseGoogleAdsConnection(raw:string):GoogleAdsConnection {
 let value:unknown; try{value=JSON.parse(raw);}catch{throw new Error('Invalid Google Ads connection: expected a JSON OAuth credential object.');}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid Google Ads connection: expected a JSON object.');
 const v=value as Record<string,unknown>;
 const clientId=typeof v.clientId==='string'?v.clientId.trim():'';
 const clientSecret=typeof v.clientSecret==='string'?v.clientSecret.trim():'';
 const refreshToken=typeof v.refreshToken==='string'?v.refreshToken.trim():'';
 const customerId=typeof v.customerId==='string'?v.customerId.replace(/[-\\s]/g,''):'';
 const loginCustomerId=typeof v.loginCustomerId==='string'?v.loginCustomerId.replace(/[-\\s]/g,''):'';
 const developerToken=typeof v.developerToken==='string'?v.developerToken.trim():'';
 if(!clientId||!clientSecret||!refreshToken||!/^\\d{10}$/.test(customerId))throw new Error('Invalid Google Ads connection: clientId, clientSecret, refreshToken and a 10-digit customerId are required.');
 if(loginCustomerId&&!/^\\d{10}$/.test(loginCustomerId))throw new Error('Invalid Google Ads connection: loginCustomerId must contain exactly 10 digits.');
 return {clientId,clientSecret,refreshToken,customerId,loginCustomerId:loginCustomerId||undefined,developerToken:developerToken||undefined};
}
export function buildGoogleAdsCityPerformanceQuery():string {
 return ['SELECT segments.date, segments.geo_target_city, campaign.id, campaign.name, geographic_view.location_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value','FROM geographic_view',"WHERE segments.date DURING LAST_365_DAYS","AND geographic_view.location_type = 'LOCATION_OF_PRESENCE'",'AND metrics.impressions > 0'].join(' ');
}
export function buildGoogleAdsGeoConstantQuery(resources:string[]):string {
 const safe=resources.filter(v=>/^geoTargetConstants\\/\\d+$/.test(v));
 if(!safe.length||safe.length!==resources.length)throw new Error('Invalid Google Ads geo target resource list.');
 return `SELECT geo_target_constant.resource_name, geo_target_constant.name FROM geo_target_constant WHERE geo_target_constant.resource_name IN (${safe.map(v=>`'${v}'`).join(', ')})`;
}
export function extractGoogleAdsStreamRows(payload:unknown):any[] {
 if(!Array.isArray(payload))throw new Error('Google Ads returned an invalid SearchStream response.');
 const rows:any[]=[]; for(const batch of payload)if(batch&&typeof batch==='object'&&Array.isArray((batch as any).results))rows.push(...(batch as any).results);
 return rows;
}
