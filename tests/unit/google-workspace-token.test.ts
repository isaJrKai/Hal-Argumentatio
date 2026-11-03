import { describe, expect, it } from 'vitest';
import { getGoogleWorkspaceTokenExpiry, isGoogleWorkspaceAccessTokenFresh, GOOGLE_WORKSPACE_TOKEN_TTL_MS } from '../../src/lib/googleWorkspaceToken';

describe('Google Workspace OAuth token lifetime', () => {
  it('sets a conservative expiry before the provider token lifetime', () => {
    expect(getGoogleWorkspaceTokenExpiry(1_000)).toBe(1_000 + GOOGLE_WORKSPACE_TOKEN_TTL_MS);
  });

  it('accepts a token only while its expiry is in the future', () => {
    expect(isGoogleWorkspaceAccessTokenFresh(10_000, 9_999)).toBe(true);
    expect(isGoogleWorkspaceAccessTokenFresh(10_000, 10_000)).toBe(false);
    expect(isGoogleWorkspaceAccessTokenFresh(10_000, 10_001)).toBe(false);
  });

  it('fails closed for missing or invalid expiry metadata', () => {
    expect(isGoogleWorkspaceAccessTokenFresh(null, 1)).toBe(false);
    expect(isGoogleWorkspaceAccessTokenFresh('not-a-time', 1)).toBe(false);
  });
});
