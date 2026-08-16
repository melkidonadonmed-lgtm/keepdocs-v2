import { useMemo, useCallback, type Dispatch, type SetStateAction } from "react";
import { Note, DriveAttachment, EmbeddedTableData, SheetData } from "../types";
import { DocumentIngestionService } from "../services/DocumentIngestionService";
import { GoogleDocDetail } from "../services/googleDocsService";
import { convert2DArrayToSheetData } from "../services/googleSheetsService";

interface UseDriveImportOptions {
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  saveNote: (note: Note) => void;
  openInDocsEditor: (note: Note) => void;
  openInSheetEditor: (note: Note) => void;
}

/**
 * Importações de conteúdo externo para o workspace:
 * anexos do Google Drive, Google Docs/Sheets/Slides, Google Keep (JSON)
 * e arquivos locais (CSV/XLSX/TXT/MD/JSON) via DocumentIngestionService.
 *
 * Cada importação cria a nota correspondente e a abre no editor adequado.
 */
export function useDriveImport({ notes, setNotes, saveNote, openInDocsEditor, openInSheetEditor }: UseDriveImportOptions) {
  // Collect all drive attachments across notes
  const allDriveAttachments: DriveAttachment[] = useMemo(
    () => notes.flatMap((n) => n.driveAttachments || []),
    [notes]
  );

  const addGlobalDriveAttachment = useCallback(
    (att: DriveAttachment) => {
      if (notes.length > 0) {
        const updatedFirstNote = {
          ...notes[0],
          driveAttachments: [...(notes[0].driveAttachments || []), att],
        };
        saveNote(updatedFirstNote);
      }
    },
    [notes, saveNote]
  );

  const importDriveNote = useCallback(
    (item: any) => {
      const isSheet = item.mimeType?.includes("spreadsheet");
      const newNote: Note = {
        id: `drive_note_${Date.now()}`,
        title: item.name || "Documento do Google Drive",
        content: `<p>Documento vinculado do Google Drive: <a href="${item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`}" target="_blank" rel="noopener noreferrer"><strong>${item.name}</strong></a></p>`,
        type: isSheet ? "sheet" : "doc",
        color: isSheet ? "green" : "blue",
        tags: ["Google Drive", isSheet ? "Planilha" : "Documento"],
        driveAttachments: [
          {
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            size: item.size ? `${(parseInt(item.size, 10) / 1024 / 1024).toFixed(1)} MB` : "N/A",
            driveUrl: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
            syncedAt: new Date().toISOString(),
            fileType: isSheet ? "sheet" : "doc",
          },
        ],
        pinned: false,
        archived: false,
        trashed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveNote(newNote);
      openInDocsEditor(newNote);
    },
    [saveNote, openInDocsEditor]
  );

  // Google Doc Ingestion Handler
  const importGoogleDoc = useCallback(
    (doc: GoogleDocDetail) => {
      const newNote: Note = {
        id: "gdoc_" + (doc.documentId || Date.now()),
        title: doc.title || "Documento Google Docs",
        content: doc.contentHtml || (doc.plainText ? `<p>${doc.plainText}</p>` : "<p>Documento importado do Google Docs.</p>"),
        type: "doc",
        color: "blue",
        tags: ["Google Docs", "Importado"],
        pinned: false,
        archived: false,
        trashed: false,
        googleDocId: doc.documentId,
        googleDocUrl: doc.webViewLink,
        googleDocThumbnail: doc.thumbnailLink,
        googleDocSnippet: doc.snippet || (doc.plainText ? doc.plainText.trim().slice(0, 200) : undefined),
        googleDocModifiedTime: doc.modifiedTime || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveNote(newNote);
      openInDocsEditor(newNote);
    },
    [saveNote, openInDocsEditor]
  );

  // Google Sheets Ingestion Handler
  const importGoogleSheet = useCallback(
    (sheet: any) => {
      const values = sheet.values || [];
      let convertedSheetData: SheetData | undefined;
      if (values && values.length > 0) {
        convertedSheetData = convert2DArrayToSheetData(values);
      }
      const newNote: Note = {
        id: "gsheet_" + (sheet.spreadsheetId || Date.now()),
        title: sheet.title || "Planilha Google Sheets",
        content: `<p>Planilha sincronizada do Google Sheets: <a href="${sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`}" target="_blank" rel="noopener noreferrer"><strong>${sheet.title}</strong></a></p>`,
        type: "sheet",
        color: "green",
        tags: ["Google Sheets", "Planilha"],
        pinned: false,
        archived: false,
        trashed: false,
        sheetData: convertedSheetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveNote(newNote);
      openInSheetEditor(newNote);
    },
    [saveNote, openInSheetEditor]
  );

  // Google Slides Ingestion Handler
  const importGoogleSlide = useCallback(
    (slide: any) => {
      const slidesHtml = (slide.slidesText || [])
        .map((txt: string, idx: number) => `<h3>Slide ${idx + 1}</h3><p>${txt || "Slide sem texto"}</p>`)
        .join("<hr />");

      const newNote: Note = {
        id: "gslide_" + (slide.presentationId || Date.now()),
        title: slide.title || "Apresentação Google Slides",
        content: slidesHtml || `<p>Apresentação: <a href="${slide.webViewLink || `https://docs.google.com/presentation/d/${slide.presentationId}/edit`}" target="_blank" rel="noopener noreferrer"><strong>${slide.title}</strong></a></p>`,
        type: "doc",
        color: "purple",
        tags: ["Google Slides", "Apresentação"],
        pinned: false,
        archived: false,
        trashed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveNote(newNote);
      openInDocsEditor(newNote);
    },
    [saveNote, openInDocsEditor]
  );

  // Google Keep Bulk Notes Ingestion Handler
  const importKeepNotes = useCallback(
    (keepNotes: Partial<Note>[]) => {
      const newNotes: Note[] = keepNotes.map((k, idx) => ({
        id: "keep_" + Date.now() + "_" + idx,
        title: k.title || "Nota Google Keep",
        content: k.content || "<p>Nota do Google Keep</p>",
        type: k.type || "doc",
        color: k.color || "yellow",
        tags: k.tags || ["Google Keep"],
        pinned: !!k.pinned,
        archived: !!k.archived,
        trashed: false,
        checklist: k.checklist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setNotes((prev) => [...newNotes, ...prev]);
      if (newNotes.length > 0) {
        openInDocsEditor(newNotes[0]);
      }
    },
    [setNotes, openInDocsEditor]
  );

  // Document Ingestion Handler for CSV, TXT, MD, JSON files
  const importDocument = useCallback(
    async (file: File) => {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "csv" || ext === "xlsx") {
          const table: EmbeddedTableData = await DocumentIngestionService.parseSpreadsheetToTable(file);
          const newNote: Note = {
            id: `imported_tbl_${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
            content: `<p>Tabela importada do arquivo <strong>${file.name}</strong>.</p>`,
            type: "sheet",
            color: "green",
            tags: ["Importado", "Planilha"],
            tables: [table],
            pinned: false,
            archived: false,
            trashed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveNote(newNote);
          openInDocsEditor(newNote);
        } else {
          const partialNote = await DocumentIngestionService.parseTextFileToNote(file);
          const newNote: Note = {
            id: partialNote.id || `imported_doc_${Date.now()}`,
            title: partialNote.title || "Nota Importada",
            content: partialNote.content || "<p>Conteúdo importado.</p>",
            type: "doc",
            color: partialNote.color || "blue",
            tags: partialNote.tags || ["Importado"],
            attachments: partialNote.attachments || [],
            pinned: false,
            archived: false,
            trashed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveNote(newNote);
          openInDocsEditor(newNote);
        }
      } catch (err) {
        console.error("Erro ao importar documento:", err);
      }
    },
    [saveNote, openInDocsEditor]
  );

  return {
    allDriveAttachments,
    addGlobalDriveAttachment,
    importDriveNote,
    importGoogleDoc,
    importGoogleSheet,
    importGoogleSlide,
    importKeepNotes,
    importDocument,
  };
}
