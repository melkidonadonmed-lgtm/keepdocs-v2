import { GoogleDriveItem } from "./googleDriveService";
import { SheetCell, SheetData } from "../types";

export interface GoogleSpreadsheetSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

export interface GoogleSpreadsheetDetail {
  spreadsheetId: string;
  title: string;
  sheetNames: string[];
  values: string[][];
  webViewLink: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

/**
 * Creates a brand new Google Spreadsheet on Google Sheets API v4
 */
export const createGoogleSpreadsheet = async (
  token: string,
  title: string,
  initialRows?: string[][]
): Promise<{ spreadsheetId: string; title: string; webViewLink: string }> => {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: title || "Nova Planilha KeepDocs",
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao criar Google Sheet (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Populate initial rows if provided
  if (initialRows && initialRows.length > 0) {
    try {
      await updateGoogleSpreadsheetValues(token, spreadsheetId, "A1", initialRows);
    } catch (updateErr) {
      console.warn("Could not insert initial rows into created Sheet:", updateErr);
    }
  }

  return {
    spreadsheetId,
    title: data.properties?.title || title,
    webViewLink,
  };
};

/**
 * Updates a range of values in Google Sheets
 */
export const updateGoogleSpreadsheetValues = async (
  token: string,
  spreadsheetId: string,
  range: string = "A1",
  values: string[][]
): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao atualizar células na planilha (${response.status})`);
  }
};

/**
 * Reads values from Google Spreadsheet
 */
export const getGoogleSpreadsheet = async (
  token: string,
  spreadsheetId: string
): Promise<GoogleSpreadsheetDetail> => {
  // 1. Fetch spreadsheet metadata (to discover sheet tab names)
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ao carregar metadados da planilha (${metaRes.status})`);
  }

  const metaData = await metaRes.json();
  const title = metaData.properties?.title || "Planilha sem título";
  const sheets = metaData.sheets || [];
  const sheetNames = sheets.map((s: any) => s.properties?.title || "Página1");
  const firstSheetName = sheetNames[0] || "Página1";

  // 2. Fetch cell values from first sheet
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      firstSheetName
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  let values: string[][] = [];
  if (valuesRes.ok) {
    const valuesData = await valuesRes.json();
    values = valuesData.values || [];
  }

  // 3. Optional: get drive thumbnail & modified time
  let thumbnailLink: string | undefined;
  let modifiedTime: string | undefined;
  try {
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=thumbnailLink,modifiedTime`,
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
    spreadsheetId,
    title,
    sheetNames,
    values,
    thumbnailLink,
    modifiedTime,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};

/**
 * Converts 2D string array to KeepDocs SheetData format
 */
export const convert2DArrayToSheetData = (rows: string[][]): SheetData => {
  const numRows = Math.max(rows.length, 12);
  const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const numCols = Math.max(maxCols, 6);

  const data: Record<string, SheetCell> = {};

  rows.forEach((row, rIdx) => {
    row.forEach((cellVal, cIdx) => {
      const colLetter = String.fromCharCode(65 + cIdx);
      const cellKey = `${colLetter}${rIdx + 1}`;
      const trimmed = cellVal !== undefined && cellVal !== null ? String(cellVal) : "";
      
      data[cellKey] = {
        value: trimmed,
        bold: rIdx === 0, // Header row bold by default
        align: !isNaN(Number(trimmed)) && trimmed.trim() !== "" ? "right" : "left",
        type: !isNaN(Number(trimmed)) && trimmed.trim() !== "" ? "number" : "text",
      };
    });
  });

  return {
    rows: numRows,
    cols: numCols,
    data,
  };
};

/**
 * Converts KeepDocs SheetData format to 2D string array for Sheets API export
 */
export const convertSheetDataTo2DArray = (sheetData: SheetData): string[][] => {
  const result: string[][] = [];
  const totalRows = Math.max(sheetData.rows || 10, 1);
  const totalCols = Math.max(sheetData.cols || 6, 1);

  for (let r = 1; r <= totalRows; r++) {
    const rowValues: string[] = [];
    let hasValueInRow = false;

    for (let c = 0; c < totalCols; c++) {
      const colLetter = String.fromCharCode(65 + c);
      const cellKey = `${colLetter}${r}`;
      const cell = sheetData.data[cellKey];
      const val = cell ? cell.value || "" : "";
      if (val) hasValueInRow = true;
      rowValues.push(val);
    }

    if (hasValueInRow || r <= 5) {
      result.push(rowValues);
    }
  }

  return result;
};

/**
 * Lists all Google Sheets from user's Google Drive
 */
export const listGoogleSheetsFiles = async (
  token: string,
  search?: string,
  pageSize: number = 30
): Promise<GoogleDriveItem[]> => {
  let query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
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
    throw new Error(err?.error?.message || `Erro ao listar Planilhas do Google (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};
