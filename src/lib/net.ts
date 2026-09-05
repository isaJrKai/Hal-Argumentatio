/**
 * fetch() with a hard timeout.
 *
 * Native fetch has no default timeout: a hung upstream (AI provider, maps
 * API, scraping target) would pin the request indefinitely. This wraps the
 * call in an AbortController and rejects with a clear error after
 * `timeoutMs` milliseconds.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  timeoutMs = 30000
): Promise<Response> {
  const { timeoutMs: explicitTimeout, ...fetchOptions } = options;
  const effectiveTimeout = explicitTimeout ?? timeoutMs;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

  // Preserve a caller-provided signal and abort ours alongside it.
  const callerSignal = fetchOptions.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${effectiveTimeout}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
