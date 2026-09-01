export async function safeFetchJson(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('Service Unavailable') || trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
    throw new Error('Service Temporarily Unavailable (Gateway / Proxy response).');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }
}
