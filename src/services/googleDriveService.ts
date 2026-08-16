import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Docs, Sheets, Slides and Google Drive scopes
export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/presentations.readonly",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
export const WORKSPACE_SCOPES = DRIVE_SCOPES;

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: "consent",
  access_type: "offline",
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is signed in from previous session, but access token needs refreshed popup if token expired
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Google Sign-In popup to obtain fresh OAuth Access Token for Drive API
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Não foi possível obter o token de acesso do Google Drive.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Erro ao autenticar com o Google Drive:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface GoogleDriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  trashed?: boolean;
}

/**
 * Lists files from user's Google Drive via REST API v3
 */
export const listGoogleDriveFiles = async (
  token: string,
  search?: string,
  pageSize: number = 25
): Promise<GoogleDriveItem[]> => {
  let query = "trashed = false";
  if (search && search.trim()) {
    const escaped = search.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", pageSize.toString());
  url.searchParams.set(
    "fields",
    "files(id, name, mimeType, size, iconLink, webViewLink, thumbnailLink, modifiedTime, trashed)"
  );
  url.searchParams.set("orderBy", "modifiedTime desc");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error("Sessão expirada. Por favor, conecte-se ao Google Drive novamente.");
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro ao listar arquivos do Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Uploads a note or document as a new file in Google Drive
 */
export const uploadNoteToGoogleDrive = async (
  token: string,
  title: string,
  content: string,
  mimeType: string = "text/plain"
): Promise<GoogleDriveItem> => {
  const metadata = {
    name: title,
    mimeType: mimeType === "application/vnd.google-apps.document" ? "application/vnd.google-apps.document" : "text/markdown",
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json; charset=UTF-8" })
  );
  form.append("file", new Blob([content], { type: "text/plain; charset=UTF-8" }));

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,iconLink,modifiedTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Falha ao exportar nota para o Google Drive");
  }

  return await response.json();
};

/**
 * Deletes a file from Google Drive (Requires explicit confirmation beforehand)
 */
export const deleteGoogleDriveFile = async (
  token: string,
  fileId: string
): Promise<void> => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Falha ao remover arquivo do Google Drive");
  }
};

export interface GoogleDocPreviewData {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  thumbnailLink?: string;
  hasThumbnail?: boolean;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Extracts Google Document ID from a full Drive/Docs URL or raw ID
 */
export function extractGoogleDocId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return trimmed;
  }
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  return null;
}

/**
 * Fetches real-time Drive metadata (including thumbnailLink and snippet) for a Google Doc
 */
export const getGoogleDocDrivePreview = async (
  token: string,
  fileId: string
): Promise<GoogleDocPreviewData> => {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  url.searchParams.set(
    "fields",
    "id,name,mimeType,description,thumbnailLink,hasThumbnail,webViewLink,iconLink,modifiedTime,size"
  );

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error("Sessão expirada. Conecte-se ao Google Drive novamente.");
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro ao carregar preview do Google Docs (${response.status})`);
  }

  const data = await response.json();

  let thumbnail = data.thumbnailLink;
  if (thumbnail) {
    // Drive API defaults to low-res =s220; upscale to high-res =s600 for sharp rendering
    thumbnail = thumbnail.replace(/=s\d+/, "=s600");
  }

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    description: data.description,
    thumbnailLink: thumbnail,
    hasThumbnail: data.hasThumbnail,
    webViewLink: data.webViewLink || `https://docs.google.com/document/d/${data.id}/edit`,
    iconLink: data.iconLink,
    modifiedTime: data.modifiedTime,
    size: data.size,
  };
};

