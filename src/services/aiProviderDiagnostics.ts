export type ProviderProbeResult = {
  configured: boolean;
  status: 'not_configured' | 'verified' | 'failed';
  latencyMs: number | null;
  errorCode?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Runs a real provider inference probe with a hard response deadline.
 * A configured key is never considered healthy until the expected marker
 * is returned by the provider. The probe deliberately exposes no raw output.
 */
export async function runProviderProbe(
  configured: boolean,
  run: () => Promise<string>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ProviderProbeResult> {
  if (!configured) {
    return { configured: false, status: 'not_configured', latencyMs: null };
  }

  const startedAt = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const output = await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          const error = new Error('Provider probe timed out.');
          error.name = 'ProviderProbeTimeoutError';
          reject(error);
        }, Math.max(1, timeoutMs));
      })
    ]);
    const latencyMs = Date.now() - startedAt;
    if (typeof output !== 'string' || !output.includes('HAL_PROVIDER_HEALTH_OK')) {
      return { configured: true, status: 'failed', latencyMs, errorCode: 'INVALID_PROVIDER_RESPONSE' };
    }
    return { configured: true, status: 'verified', latencyMs };
  } catch (error: any) {
    const latencyMs = Date.now() - startedAt;
    if (error?.name === 'ProviderProbeTimeoutError') {
      return { configured: true, status: 'failed', latencyMs, errorCode: 'PROVIDER_TIMEOUT' };
    }
    const statusCode = Number(error?.status || error?.statusCode);
    const errorCode = Number.isFinite(statusCode) && statusCode > 0
      ? `HTTP_${statusCode}`
      : 'PROVIDER_REQUEST_FAILED';
    return { configured: true, status: 'failed', latencyMs, errorCode };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
