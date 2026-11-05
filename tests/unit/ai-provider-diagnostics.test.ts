import { describe, expect, it, vi } from 'vitest';
import { runProviderProbe } from '../../src/services/aiProviderDiagnostics';

describe('AI provider diagnostics probe', () => {
  it('does not call a provider when credentials are missing', async () => {
    const run = vi.fn(async () => 'HAL_PROVIDER_HEALTH_OK');
    await expect(runProviderProbe(false, run)).resolves.toEqual({
      configured: false,
      status: 'not_configured',
      latencyMs: null
    });
    expect(run).not.toHaveBeenCalled();
  });

  it('verifies only the expected live provider response', async () => {
    await expect(runProviderProbe(true, async () => 'HAL_PROVIDER_HEALTH_OK')).resolves.toMatchObject({
      configured: true,
      status: 'verified'
    });
  });

  it('rejects malformed or empty provider responses', async () => {
    await expect(runProviderProbe(true, async () => '')).resolves.toMatchObject({
      configured: true,
      status: 'failed',
      errorCode: 'INVALID_PROVIDER_RESPONSE'
    });
    await expect(runProviderProbe(true, async () => 'some unrelated text')).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'INVALID_PROVIDER_RESPONSE'
    });
  });

  it('reports provider HTTP failures without exposing provider response bodies', async () => {
    const error = Object.assign(new Error('sensitive provider body'), { status: 429 });
    await expect(runProviderProbe(true, async () => { throw error; })).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'HTTP_429'
    });
  });

  it('enforces a bounded timeout for a stalled provider', async () => {
    await expect(runProviderProbe(true, () => new Promise(() => {}), 5)).resolves.toMatchObject({
      configured: true,
      status: 'failed',
      errorCode: 'PROVIDER_TIMEOUT'
    });
  });
});
