import { GoogleDriveItem } from "./googleDriveService";

export interface GoogleDocSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

export interface GoogleDocDetail {
  documentId: string;
  title: string;
  contentHtml: string;
  plainText: string;
  revisionId?: string;
  webViewLink: string;
  thumbnailLink?: string;
  snippet?: string;
  modifiedTime?: string;
}

/**
 * Creates a brand new Google Doc on Google Docs API
 */
export const createGoogleDocument = async (
  token: string,
  title: string,
  initialContentHtml?: string
): Promise<{ documentId: string; title: string; webViewLink: string }> => {
  const response = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: title || "Novo Documento KeepDocs",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao criar Google Doc (${response.status})`);
  }

  const docData = await response.json();
  const documentId = docData.documentId;
  const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;

  // If initial content is provided, insert it into the Google Doc
  if (initialContentHtml && initialContentHtml.trim()) {
    try {
      const plainText = convertHtmlToPlainText(initialContentHtml);
      if (plainText.trim()) {
        await appendTextToGoogleDoc(token, documentId, plainText);
      }
    } catch (insertErr) {
      console.warn("Could not insert initial text to created Doc:", insertErr);
    }
  }

  return {
    documentId,
    title: docData.title || title,
    webViewLink,
  };
};

/**
 * Inserts plain text at the beginning/end of a Google Doc
 */
export const appendTextToGoogleDoc = async (
  token: string,
  documentId: string,
  text: string
): Promise<void> => {
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: text + "\n",
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao atualizar Google Doc (${response.status})`);
  }
};

/**
 * Gets a Google Doc by ID and converts its structural elements into HTML & plain text
 */
export const getGoogleDocument = async (
  token: string,
  documentId: string
): Promise<GoogleDocDetail> => {
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao carregar Google Doc (${response.status})`);
  }

  const doc = await response.json();
  const title = doc.title || "Documento sem título";
  const { html, text } = parseGoogleDocBody(doc.body);

  // Optional: fetch Drive thumbnail and metadata in parallel
  let thumbnailLink: string | undefined;
  let modifiedTime: string | undefined;
  try {
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${documentId}?fields=thumbnailLink,modifiedTime`,
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

  const snippet = text.trim().slice(0, 200);

  return {
    documentId: doc.documentId,
    title,
    contentHtml: html,
    plainText: text,
    snippet,
    thumbnailLink,
    modifiedTime,
    revisionId: doc.revisionId,
    webViewLink: `https://docs.google.com/document/d/${doc.documentId}/edit`,
  };
};

/**
 * Lists all Google Docs from user's Google Drive
 */
export const listGoogleDocsFiles = async (
  token: string,
  search?: string,
  pageSize: number = 30
): Promise<GoogleDriveItem[]> => {
  let query = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
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
    throw new Error(err?.error?.message || `Erro ao listar Google Docs (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Converts Google Doc structural body elements into clean HTML and plain text
 */
function parseGoogleDocBody(body: any): { html: string; text: string } {
  if (!body || !body.content) {
    return { html: "<p></p>", text: "" };
  }

  let htmlResult = "";
  let textResult = "";

  for (const element of body.content) {
    if (element.paragraph) {
      const paragraph = element.paragraph;
      const namedStyleType = paragraph.paragraphStyle?.namedStyleType || "NORMAL_TEXT";
      
      let paragraphHtml = "";
      let paragraphText = "";

      if (paragraph.elements) {
        for (const elem of paragraph.elements) {
          if (elem.textRun) {
            const rawContent = elem.textRun.content || "";
            const style = elem.textRun.textStyle || {};
            
            paragraphText += rawContent;

            // Escape HTML characters
            let escaped = escapeHtml(rawContent);

            // Apply inline formatting
            if (style.bold) escaped = `<strong>${escaped}</strong>`;
            if (style.italic) escaped = `<em>${escaped}</em>`;
            if (style.underline) escaped = `<u>${escaped}</u>`;
            if (style.strikethrough) escaped = `<s>${escaped}</s>`;
            if (style.link && style.link.url) {
              escaped = `<a href="${escapeHtml(style.link.url)}" target="_blank" rel="noopener noreferrer" class="text-[#2aa198] underline">${escaped}</a>`;
            }

            paragraphHtml += escaped;
          }
        }
      }

      textResult += paragraphText;

      // Wrap in appropriate tag according to namedStyleType
      if (namedStyleType === "TITLE" || namedStyleType === "HEADING_1") {
        htmlResult += `<h1>${paragraphHtml}</h1>`;
      } else if (namedStyleType === "HEADING_2") {
        htmlResult += `<h2>${paragraphHtml}</h2>`;
      } else if (namedStyleType === "HEADING_3") {
        htmlResult += `<h3>${paragraphHtml}</h3>`;
      } else if (paragraph.bullet) {
        htmlResult += `<li>${paragraphHtml}</li>`;
      } else {
        htmlResult += `<p>${paragraphHtml}</p>`;
      }
    } else if (element.table) {
      const table = element.table;
      let tableHtml = '<table class="w-full border-collapse my-2 border border-[rgba(147,161,161,0.2)]">';
      if (table.tableRows) {
        for (const row of table.tableRows) {
          tableHtml += "<tr>";
          if (row.tableCells) {
            for (const cell of row.tableCells) {
              tableHtml += '<td class="border border-[rgba(147,161,161,0.2)] p-2 text-xs">';
              const cellParsed = parseGoogleDocBody(cell);
              tableHtml += cellParsed.html;
              textResult += cellParsed.text + "\t";
              tableHtml += "</td>";
            }
          }
          tableHtml += "</tr>";
          textResult += "\n";
        }
      }
      tableHtml += "</table>";
      htmlResult += tableHtml;
    }
  }

  return { html: htmlResult, text: textResult };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function convertHtmlToPlainText(html: string): string {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.innerText || temp.textContent || "";
}
