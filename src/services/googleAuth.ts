import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from '@firebase/auth';
import { auth } from '../lib/firebaseClient';

export { auth };

export const provider = new GoogleAuthProvider();
// Request standard Google Workspace identity scopes
provider.addScope('openid');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    onAuthFailure?.();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; idToken?: string } | null> => {
  if (!auth) {
    throw new Error('Google sign-in is not configured. Firebase project credentials are missing.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    let token = credential?.accessToken || null;
    const idToken = await result.user.getIdToken();

    if (!token) {
      token = idToken;
    }

    cachedAccessToken = token;
    return { user: result.user, accessToken: token, idToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  if (auth) await signOut(auth);
  cachedAccessToken = null;
};
