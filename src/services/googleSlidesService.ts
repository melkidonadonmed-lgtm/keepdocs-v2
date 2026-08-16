import { GoogleDriveItem } from "./googleDriveService";

export interface GooglePresentationDetail {
  presentationId: string;
  title: string;
  slidesCount: number;
  webViewLink: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  slidesText: string[];
}

/**
 * Creates a new Google Slides presentation
 */
export const createGooglePresentation = async (
  token: string,
  title: string,
  slideTitles?: string[]
): Promise<{ presentationId: string; title: string; webViewLink: string }> => {
  const response = await fetch("https://slides.googleapis.com/v1/presentations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: title || "Nova Apresentação KeepDocs",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao criar apresentação do Google Slides (${response.status})`);
  }

  const data = await response.json();
  const presentationId = data.presentationId;
  const webViewLink = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  return {
    presentationId,
    title: data.title || title,
    webViewLink,
  };
};

/**
 * Gets Google Slides details and text summaries
 */
export const getGooglePresentation = async (
  token: string,
  presentationId: string
): Promise<GooglePresentationDetail> => {
  const response = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao carregar apresentação (${response.status})`);
  }

  const data = await response.json();
  const title = data.title || "Apresentação sem título";
  const slides = data.slides || [];
  
  // Extract text from slides
  const slidesText: string[] = [];
  slides.forEach((slide: any, index: number) => {
    let slideContent = "";
    if (slide.pageElements) {
      slide.pageElements.forEach((pe: any) => {
        if (pe.shape?.text?.textElements) {
          pe.shape.text.textElements.forEach((te: any) => {
            if (te.textRun?.content) {
              slideContent += te.textRun.content;
            }
          });
        }
      });
    }
    slidesText.push(slideContent.trim() || `Slide ${index + 1}`);
  });

  // Get thumbnail from Drive
  let thumbnailLink: string | undefined;
  let modifiedTime: string | undefined;
  try {
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${presentationId}?fields=thumbnailLink,modifiedTime`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.thumbnailLink) {
        thumbnailLink = driveData.thumbnailLink.replace(/=s\d+/, "=s600");
      }
      modifiedTime = driveData.modifiedTime;
    }
  } catch (e) {
    // Non-fatal
  }

  return {
    presentationId,
    title,
    slidesCount: slides.length,
    webViewLink: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    thumbnailLink,
    modifiedTime,
    slidesText,
  };
};

/**
 * Lists all Google Slides presentations from user's Google Drive
 */
export const listGoogleSlidesFiles = async (
  token: string,
  search?: string,
  pageSize: number = 30
): Promise<GoogleDriveItem[]> => {
  let query = "mimeType = 'application/vnd.google-apps.presentation' and trashed = false";
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
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao listar Apresentações do Google (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};
