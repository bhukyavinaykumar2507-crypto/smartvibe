import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

const FOLDER_NAME = 'SmartVibe_Machine_Reports';
const TOKEN_STORAGE_KEY = 'smartvibe_gdrive_token';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

function getFirebaseConfig(): Record<string, string> | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !projectId) {
    return null;
  }

  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    appId: appId || '',
  };
}

function ensureFirebaseAuth(): Auth | null {
  if (firebaseAuth) return firebaseAuth;
  const cfg = getFirebaseConfig();
  if (!cfg) return null;

  try {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(cfg);
    firebaseAuth = getAuth(firebaseApp);
    return firebaseAuth;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setAccessToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage restriction errors
  }
}

export function initAuth(callback: (user: User | null) => void): () => void {
  const auth = ensureFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

export async function googleSignIn(): Promise<{ user: User; token: string }> {
  const auth = ensureFirebaseAuth();
  if (!auth) {
    throw new Error(
      'Google Drive sign-in is not configured in this environment. Set VITE_FIREBASE_* variables or download reports locally.'
    );
  }

  const provider = new GoogleAuthProvider();
  for (const scope of DRIVE_SCOPES) {
    provider.addScope(scope);
  }

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error('Google Drive OAuth access token was not granted.');
  }
  setAccessToken(token);
  return { user: result.user, token };
}

export async function logoutGoogle(): Promise<void> {
  setAccessToken(null);
  const auth = ensureFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

async function getOrCreateFolderId(token: string): Promise<string> {
  const query = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!searchRes.ok) {
    throw new Error(`Google Drive search failed (${searchRes.status})`);
  }
  const searchJson = await searchRes.json();
  if (searchJson.files && searchJson.files.length > 0) {
    return searchJson.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Drive folder (${createRes.status})`);
  }
  const created = await createRes.json();
  return created.id;
}

export async function listSmartVibeFiles(): Promise<DriveFile[]> {
  const token = getAccessToken();
  if (!token) return [];

  const folderId = await getOrCreateFolderId(token);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Unable to list Drive reports (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function uploadReportToDrive(
  fileName: string,
  content: string,
  mimeType = 'text/html'
): Promise<DriveFile> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google Drive before uploading.');
  }

  const folderId = await getOrCreateFolderId(token);
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType,
  };

  const boundary = '-------smartvibe_multipart_boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(`Drive upload failed (${res.status})`);
  }

  return await res.json();
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Drive session expired.');
  }
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Delete failed (${res.status})`);
  }
}
