/**
 * Read an API response without assuming the server returned JSON.
 *
 * Reverse proxies, auth middleware and deployment errors can return HTML or an
 * empty body for API requests. Parsing response.text() first lets callers show
 * the HTTP status and a short, safe diagnostic instead of a generic JSON error.
 */
export async function readApiResponse<T = any>(response: Response, context: string): Promise<T> {
  const raw = await response.text();
  const contentType = response.headers.get('content-type') || 'unknown content type';
  let payload: any = null;

  if (raw.trim()) {
    try {
      payload = JSON.parse(raw);
    } catch {
      const lower = raw.toLowerCase();
      const startupSignals = [
        'starting server',
        'server starting',
        'server is starting',
        'server is initializing',
        'backend service is initializing',
        'service is initializing',
        'initializing server',
        'warming up server',
        'server warming up'
      ];
      const isStarting = startupSignals.some(signal => lower.includes(signal));
      const preview = raw.replace(/\s+/g, ' ').trim().slice(0, 160);
      const suffix = isStarting
        ? ' Server is starting up. Reconnecting...'
        : (preview ? ` Response begins: "${preview}"` : '');
      const err = new Error(`${context}: expected JSON but received ${contentType} (HTTP ${response.status}).${suffix}`);
      if (isStarting) {
        (err as any).isStartingServer = true;
      }
      throw err;
    }
  } else if (response.ok) {
    throw new Error(`${context}: server returned an empty response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? (payload.error?.message || payload.error || payload.message)
      : null;
    throw new Error(typeof message === 'string' && message.trim()
      ? `${context}: ${message} (HTTP ${response.status}).`
      : `${context}: request failed (HTTP ${response.status}, ${contentType}).`);
  }

  return payload as T;
}
