import { describe, expect, it } from 'vitest';
import { getClientIp } from '../../src/lib/clientIp';

describe('getClientIp', () => {
  it('uses a valid Cloudflare origin client IP', () => {
    expect(getClientIp({ headers: { 'cf-connecting-ip': '203.0.113.10' }, socket: { remoteAddress: '10.0.0.1' } })).toBe('203.0.113.10');
  });
  it('ignores a caller-supplied X-Forwarded-For value', () => {
    expect(getClientIp({ headers: { 'x-forwarded-for': '1.2.3.4' }, socket: { remoteAddress: '10.0.0.1' } })).toBe('10.0.0.1');
  });
  it('rejects malformed Cloudflare header values and falls back to the socket peer', () => {
    expect(getClientIp({ headers: { 'cf-connecting-ip': 'not-an-ip' }, socket: { remoteAddress: '10.0.0.1' } })).toBe('10.0.0.1');
  });
  it('uses a stable fallback when no address is available', () => {
    expect(getClientIp({})).toBe('unknown-ip');
  });
});
