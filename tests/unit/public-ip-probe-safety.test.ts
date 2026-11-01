import { describe, expect, it } from 'vitest';
import { isPubliclyRoutableIp } from '../../src/lib/networkVerification';

describe('public IP allowlist for outbound website probes', () => {
  it('allows ordinary globally routable IPv4 and IPv6 addresses', () => {
    expect(isPubliclyRoutableIp('8.8.8.8')).toBe(true);
    expect(isPubliclyRoutableIp('1.1.1.1')).toBe(true);
    expect(isPubliclyRoutableIp('2606:4700:4700::1111')).toBe(true);
  });

  it('blocks private, loopback, link-local, and carrier-grade IPv4 ranges', () => {
    for (const address of [
      '10.0.0.1',
      '172.16.0.1',
      '192.168.1.1',
      '127.0.0.1',
      '169.254.1.1',
      '100.64.0.1',
      '0.0.0.0',
      '224.0.0.1',
      '192.0.2.10',
      '198.51.100.10',
      '203.0.113.10',
    ]) {
      expect(isPubliclyRoutableIp(address), address).toBe(false);
    }
  });

  it('blocks local and documentation IPv6 ranges and checks IPv4-mapped addresses', () => {
    expect(isPubliclyRoutableIp('::1')).toBe(false);
    expect(isPubliclyRoutableIp('fc00::1')).toBe(false);
    expect(isPubliclyRoutableIp('fe80::1')).toBe(false);
    expect(isPubliclyRoutableIp('2001:db8::1')).toBe(false);
    expect(isPubliclyRoutableIp('::ffff:192.168.1.10')).toBe(false);
    expect(isPubliclyRoutableIp('::ffff:8.8.8.8')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isPubliclyRoutableIp('not-an-ip')).toBe(false);
    expect(isPubliclyRoutableIp('127.0.0.999')).toBe(false);
  });
});
