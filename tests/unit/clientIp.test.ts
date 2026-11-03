import { describe, expect, it } from 'vitest';
import { getClientIp } from '../../src/lib/clientIp';

describe('getClientIp', () => {
  it('uses the address resolved by Express', () => {
    expect(getClientIp({
      ip: '203.0.113.10',
      socket: { remoteAddress: '127.0.0.1' }
    })).toBe('203.0.113.10');
  });

  it('falls back to the socket peer when Express has no address', () => {
    expect(getClientIp({ socket: { remoteAddress: '127.0.0.1' } })).toBe('127.0.0.1');
  });

  it('does not trust a client-supplied forwarded-for header', () => {
    const request = {
      socket: { remoteAddress: '198.51.100.7' },
      headers: { 'x-forwarded-for': '1.2.3.4' }
    };
    expect(getClientIp(request)).toBe('198.51.100.7');
  });

  it('returns a stable fallback when no address is available', () => {
    expect(getClientIp({})).toBe('unknown-ip');
  });
});
