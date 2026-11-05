import dns from 'node:dns';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicWebsitePage } from '../../src/lib/networkVerification';

describe('bounded public website fetch safety', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects credentials, non-HTTP protocols, custom ports and IP literals before DNS', async () => {
    const lookup = vi.spyOn(dns.promises, 'lookup');
    await expect(fetchPublicWebsitePage('file:///etc/passwd')).rejects.toThrow('Only public HTTP(S)');
    await expect(fetchPublicWebsitePage('https://user:pass@example.com')).rejects.toThrow('Only public HTTP(S)');
    await expect(fetchPublicWebsitePage('https://example.com:8443')).rejects.toThrow('Only public HTTP(S)');
    await expect(fetchPublicWebsitePage('https://127.0.0.1')).rejects.toThrow('Only public HTTP(S)');
    expect(lookup).not.toHaveBeenCalled();
  });

  it('blocks DNS answers that include private or loopback addresses', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 }
    ] as any);

    await expect(fetchPublicWebsitePage('https://mixed-dns.example')).rejects.toThrow('private, reserved, or non-public');
  });

  it('blocks private-only DNS answers before opening an HTTP connection', async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([
      { address: '10.0.0.8', family: 4 }
    ] as any);

    await expect(fetchPublicWebsitePage('https://internal.example')).rejects.toThrow('private, reserved, or non-public');
  });
});
