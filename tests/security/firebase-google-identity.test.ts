import { describe, expect, it, vi } from 'vitest';
import { verifyFirebaseGoogleIdToken } from '../../src/lib/firebaseGoogleIdentity';

const verifiedGoogleUser = {
  users: [{
    localId: 'firebase-user-123',
    email: 'owner@example.com',
    emailVerified: true,
    displayName: 'Workspace Owner',
    providerUserInfo: [{ providerId: 'google.com' }]
  }]
};

describe('Firebase Google identity verification', () => {
  it('verifies the Firebase ID token server-side and returns verified identity claims', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(verifiedGoogleUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    const identity = await verifyFirebaseGoogleIdToken('a'.repeat(32), 'public-web-api-key', fetcher);

    expect(identity).toEqual({
      uid: 'firebase-user-123',
      email: 'owner@example.com',
      displayName: 'Workspace Owner'
    });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, request] = fetcher.mock.calls[0];
    expect(String(url)).toContain('identitytoolkit.googleapis.com/v1/accounts:lookup');
    expect(String(url)).toContain('key=public-web-api-key');
    expect(JSON.parse(String(request?.body))).toEqual({ idToken: 'a'.repeat(32) });
  });

  it('rejects invalid Firebase tokens', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'INVALID_ID_TOKEN' }
    }), { status: 400 }));

    await expect(verifyFirebaseGoogleIdToken('a'.repeat(32), 'api-key', fetcher)).resolves.toBeNull();
  });

  it('rejects unverified email addresses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      users: [{ ...verifiedGoogleUser.users[0], emailVerified: false }]
    }), { status: 200 }));

    await expect(verifyFirebaseGoogleIdToken('a'.repeat(32), 'api-key', fetcher)).resolves.toBeNull();
  });

  it('rejects Firebase identities that are not linked to Google', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      users: [{ ...verifiedGoogleUser.users[0], providerUserInfo: [{ providerId: 'password' }] }]
    }), { status: 200 }));

    await expect(verifyFirebaseGoogleIdToken('a'.repeat(32), 'api-key', fetcher)).resolves.toBeNull();
  });

  it('fails closed when Firebase verification is unavailable', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 503 }));

    await expect(verifyFirebaseGoogleIdToken('a'.repeat(32), 'api-key', fetcher)).rejects.toThrow(
      'Firebase identity verification service returned HTTP 503'
    );
  });

  it('rejects missing or oversized credentials before making a request', async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(verifyFirebaseGoogleIdToken('', 'api-key', fetcher)).resolves.toBeNull();
    await expect(verifyFirebaseGoogleIdToken('a'.repeat(12_001), 'api-key', fetcher)).resolves.toBeNull();
    await expect(verifyFirebaseGoogleIdToken('a'.repeat(32), '', fetcher)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
