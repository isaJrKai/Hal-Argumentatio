import { Skill } from './types';

export const geoSkill: Skill = {
  id: 'geo_weather',
  name: 'Geo & Weather Intelligence',
  description: 'Connects to live Open-Meteo services to fetch real-time weather alerts and computes immediate home-services demand impact indicators.',
  category: 'geo',
  icon: 'CloudRain',
  inputs: [
    {
      name: 'city',
      label: 'Target City',
      type: 'string',
      required: true,
      defaultValue: '',
    }
  ],
  execute: async (inputs, contractorId) => {
    const { city } = inputs;
    if (!city) {
      throw new Error('City is a required input parameter');
    }

    try {
      // 1. Geocode the city via Open-Meteo's open service
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geocodeUrl, { signal: AbortSignal.timeout(7000) });
      if (!geoRes.ok) {
        throw new Error(`Geocoding request failed: ${geoRes.statusText}`);
      }

      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`No geographic coordinates resolved for city: "${city}"`);
      }

      const location = geoData.results[0];
      const { latitude, longitude, name, country, admin1 } = location;

      // 2. Query actual weather data using Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation,rain,snowfall&timezone=auto`;
      const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(7000) });
      if (!weatherRes.ok) {
        throw new Error(`Weather forecasting query failed: ${weatherRes.statusText}`);
      }

      const weatherData = await weatherRes.json();
      const current = weatherData.current_weather || {};
      const temp = current.temperature;
      const windspeed = current.windspeed;
      const weathercode = current.weathercode;
      if (!Number.isFinite(temp) || !Number.isFinite(windspeed) || !Number.isFinite(weathercode)) {
        throw new Error('Weather provider response did not include valid current weather measurements.');
      }
      const hourly = weatherData.hourly || {};
      const precipArray = hourly.precipitation;
      if (!Array.isArray(precipArray) || precipArray.length < 12 || !precipArray.slice(0, 12).every((value: unknown) => Number.isFinite(value))) {
        throw new Error('Weather provider response did not include a complete next-12-hour precipitation series.');
      }
      const next12hPrecipitation = precipArray.slice(0, 12).reduce((sum: number, val: number) => sum + val, 0); // next 12 forecast hours

      // 3. Compute Home Services & Trade Demand Indices (HAL Heuristics)
      // High precipitation = high emergency service demand
      const emergencyDemandIndex = Math.min(10, Math.round((next12hPrecipitation * 2) + (weathercode === 80 || weathercode === 81 || weathercode === 82 ? 5 : 2)));
      // Temperature extremes = high HVAC & exterior demand
      const climateDemandIndex = Math.min(10, Math.round(temp < 0 ? Math.abs(temp) / 4 : temp > 28 ? (temp - 25) * 1.5 : 1));

      // 4. Formulate contextual strategic suggestions
      let strategy = '';
      if (emergencyDemandIndex > 6) {
        strategy = `🚨 WARNING: High localized rainfall detected (${next12hPrecipitation.toFixed(1)}mm in the next 12 forecast hours). Emergency service demand is spiking. Recommend immediate email/text push to ${name} database for high-intent emergency service ads.`;
      } else if (climateDemandIndex > 7) {
        strategy = `⚠️ EXTREME TEMPERATURE ADVISORY: Local temperature in ${name} is ${temp}°C. Climate control and exterior systems will face surge loads. Pivot ad bid strategies to capture emergency breakdown repairs.`;
      } else {
        strategy = `Standard weather conditions in ${name} (${temp}°C, clean forecast). Recommend regular brand search ads with stable bidding parameters. Monitor regional demand shifts.`;
      }

      return {
        success: true,
        city: name,
        region: admin1,
        country,
        coordinates: { latitude, longitude },
        temperature: temp,
        windspeed,
        weathercode,
        next12hPrecipitationMm: Number(next12hPrecipitation.toFixed(2)),
        demandIndices: {
          emergencyDemand: emergencyDemandIndex,
          climateDemand: climateDemandIndex,
        },
        strategicActionableDirective: strategy,
        demandIndexMethod: 'HAL heuristic based on current weather and the next 12 forecast hours; not a measured service-demand forecast.',
        fetchedAt: new Date().toISOString()
      };

    } catch (err: any) {
      console.warn('Live geocoding or weather data unavailable:', err?.message || err);
      throw new Error(`Live weather data for "${city}" is unavailable right now. No substitute location or synthetic weather values were used.`);
    }
  }
};
