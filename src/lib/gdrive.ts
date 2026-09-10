import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add all Google Drive scopes requested by the user
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Handle in-memory access token cache or state recovery from sessionStorage for usability
try {
  const savedToken = sessionStorage.getItem('gdrive_access_token');
  if (savedToken) {
    cachedAccessToken = savedToken;
  }
} catch (e) {
  console.warn('Session storage not accessible for token caching', e);
}

export const initAuth = (
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
        sessionStorage.removeItem('gdrive_access_token');
      } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem('gdrive_access_token', cachedAccessToken);
    } catch (e) {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.info('Google Drive sign-in popup was closed by the user.');
      return null;
    }

    if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup-blocked')) {
      throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups or open the app in a new tab to authenticate.');
    }

    console.error('Google Auth Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem('gdrive_access_token');
  } catch (e) {}
};

// Drive API File Model
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

// Drive API Helpers
export const listDriveFiles = async (
  token: string,
  folderId: string = 'root',
  searchQuery: string = ''
): Promise<DriveListResponse> => {
  let q = `'${folderId}' in parents and trashed = false`;
  if (searchQuery.trim()) {
    q = `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink,parents)&orderBy=folder,name&pageSize=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive list error (${res.status}): ${errText}`);
  }

  return res.json();
};

export const createDriveFolder = async (
  token: string,
  name: string,
  parentId: string = 'root'
): Promise<DriveFile> => {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId !== 'root' ? [parentId] : undefined,
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive folder creation error (${res.status}): ${errText}`);
  }

  return res.json();
};

export const uploadDriveFile = async (
  token: string,
  file: File,
  parentId: string = 'root'
): Promise<DriveFile> => {
  const metadata = {
    name: file.name,
    parents: parentId !== 'root' ? [parentId] : undefined,
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive file upload error (${res.status}): ${errText}`);
  }

  return res.json();
};

export const deleteDriveFile = async (token: string, fileId: string): Promise<boolean> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive delete error (${res.status}): ${errText}`);
  }

  return true;
};
