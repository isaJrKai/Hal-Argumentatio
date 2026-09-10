import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Unified Provider with Google Drive, Calendar, and Gmail scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

try {
  const savedToken = sessionStorage.getItem('google_workspace_access_token') || sessionStorage.getItem('gdrive_access_token');
  if (savedToken) {
    cachedAccessToken = savedToken;
  }
} catch (e) {
  console.warn('Session storage not accessible for token caching', e);
}

export const initGoogleWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
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
      try {
        sessionStorage.removeItem('google_workspace_access_token');
        sessionStorage.removeItem('gdrive_access_token');
      } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleWorkspaceSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain access token from Google Sign-In with Workspace scopes');
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem('google_workspace_access_token', cachedAccessToken);
      sessionStorage.setItem('gdrive_access_token', cachedAccessToken);
    } catch (e) {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // If the user closed or cancelled the popup window, handle smoothly without throwing an error
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.info('Google Workspace sign-in popup was closed by the user.');
      return null;
    }

    if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup-blocked')) {
      throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups or open the app in a new tab to authenticate.');
    }

    console.error('Google Workspace Auth Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleWorkspaceToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleWorkspaceLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem('google_workspace_access_token');
    sessionStorage.removeItem('gdrive_access_token');
  } catch (e) {}
};

// ─── Google Calendar Helpers ──────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export const listCalendarEvents = async (token: string): Promise<CalendarEvent[]> => {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&singleEvents=true&orderBy=startTime`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Failed to list calendar events: ${res.statusText}`);
  }
  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (
  token: string, 
  event: { summary: string; description: string; startTime: string; endTime: string; attendeeEmail?: string }
): Promise<CalendarEvent> => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const body: any = {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.startTime },
    end: { dateTime: event.endTime }
  };
  if (event.attendeeEmail) {
    body.attendees = [{ email: event.attendeeEmail }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create calendar consultation event');
  }
  return res.json();
};

// ─── Gmail Helpers ────────────────────────────────────────────────────────────
export const sendGmailMessage = async (
  token: string,
  opts: { to: string; subject: string; bodyHtml: string }
): Promise<{ id: string; threadId: string }> => {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(opts.subject)))}?=`;
  const messageParts = [
    `To: ${opts.to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    opts.bodyHtml
  ];
  const message = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to dispatch email via Gmail API');
  }
  return res.json();
};
