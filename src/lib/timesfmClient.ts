export interface TimesFmForecastPoint {
  step: number;
  point: number;
  lower: number;
  upper: number;
}

export interface TimesFmForecastResponse {
  success: true;
  model: string;
  version: string;
  backend: string;
  input_points: number;
  horizon: number;
  forecast: TimesFmForecastPoint[];
}

export function validateTimesFmForecast(
  value: unknown,
  expectedHorizon: number
): TimesFmForecastResponse {
  if (!value || typeof value !== 'object') {
    throw new Error('TimesFM returned an invalid response');
  }

  const result = value as Partial<TimesFmForecastResponse>;
  if (
    result.success !== true ||
    typeof result.model !== 'string' ||
    typeof result.version !== 'string' ||
    typeof result.backend !== 'string' ||
    !Number.isInteger(result.input_points) || Number(result.input_points) < 8 || Number(result.input_points) > 1024 ||
    result.horizon !== expectedHorizon ||
    !Array.isArray(result.forecast) ||
    result.forecast.length !== expectedHorizon
  ) {
    throw new Error('TimesFM response does not match the expected contract');
  }

  const forecast = result.forecast.map((point, index) => {
    if (
      !point ||
      point.step !== index + 1 ||
      ![point.point, point.lower, point.upper].every(
        (number) => typeof number === 'number' && Number.isFinite(number) && number >= 0
      ) ||
      point.lower > point.point ||
      point.point > point.upper
    ) {
      throw new Error(`TimesFM returned an invalid forecast point at step ${index + 1}`);
    }
    return point;
  });

  return {
    success: true,
    model: result.model,
    version: result.version,
    backend: result.backend,
    input_points: Number(result.input_points),
    horizon: expectedHorizon,
    forecast
  };
}

export async function requestTimesFmForecast(
  series: number[],
  horizon: number
): Promise<TimesFmForecastResponse> {
  const serviceUrl = process.env.TIMESFM_SERVICE_URL?.trim();
  const apiKey = process.env.TIMESFM_API_KEY?.trim();

  if (!serviceUrl || !apiKey) {
    throw new Error('TimesFM service is not configured');
  }
  if (series.length < 8 || series.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('TimesFM requires at least 8 finite, non-negative historical observations');
  }
  const contextSeries = series.slice(-1024);
  if (new Set(contextSeries).size <= 1) {
    throw new Error('TimesFM requires variation in the historical observations');
  }
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 52) {
    throw new Error('TimesFM horizon must be between 1 and 52');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, '')}/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ series: contextSeries, horizon, frequency: 'weekly' }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`TimesFM service returned HTTP ${response.status}`);
    }

    return validateTimesFmForecast(await response.json(), horizon);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TimesFM inference timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
