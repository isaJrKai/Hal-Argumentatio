export interface VerifiedFirebaseGoogleIdentity {
  uid: string;
  email: string;
  displayName: string | null;
}

interface FirebaseLookupUser {
  localId?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  providerUserInfo?: Array<{ providerId?: string }>;
}

interface FirebaseLookupResponse {
  users?: FirebaseLookupUser[];
}

/**
 * Verifies a Firebase ID token with Firebase Authentication's account lookup
 * endpoint. The API response is authoritative; caller-supplied email/name values
 * must never be used to establish an account identity.
 */
export async function verifyFirebaseGoogleIdToken(
  idToken: string,
  webApiKey: string,
  fetcher: typeof fetch = fetch
): Promise<VerifiedFirebaseGoogleIdentity | null> {
  if (
    typeof idToken !== 'string' ||
    idToken.length < 20 ||
    idToken.length > 12_000 ||
    typeof webApiKey !== 'string' ||
    !webApiKey.trim()
  ) {
    return null;
  }

  const response = await fetcher(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(webApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(8_000)
    }
  );

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(`Firebase identity verification service returned HTTP ${response.status}.`);
    }
    return null;
  }

  const payload = await response.json() as FirebaseLookupResponse;
  const user = Array.isArray(payload.users) ? payload.users[0] : undefined;
  if (
    !user ||
    typeof user.localId !== 'string' ||
    !user.localId ||
    typeof user.email !== 'string' ||
    !user.email.includes('@') ||
    user.emailVerified !== true ||
    !Array.isArray(user.providerUserInfo) ||
    !user.providerUserInfo.some(provider => provider.providerId === 'google.com')
  ) {
    return null;
  }

  return {
    uid: user.localId,
    email: user.email.trim().toLowerCase(),
    displayName: typeof user.displayName === 'string' && user.displayName.trim()
      ? user.displayName.trim().slice(0, 160)
      : null
  };
}
