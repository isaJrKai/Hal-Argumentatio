import {
  isGoogleWorkspaceConfigured,
  initGoogleWorkspaceAuth,
  googleWorkspaceSignIn,
  getGoogleWorkspaceToken,
  googleWorkspaceLogout
} from './googleWorkspace';

export { isGoogleWorkspaceConfigured };
export const initAuth = initGoogleWorkspaceAuth;
export const googleSignIn = googleWorkspaceSignIn;
export const getAccessToken = getGoogleWorkspaceToken;
export const logout = googleWorkspaceLogout;

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
