import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "./firebase";
import { Note, Folder } from "../types";
import { CustomizableNoteColor } from "./colorPaletteService";

/**
 * Sanitizes a Note object to prevent nested arrays and undefined properties from failing Firestore writes
 */
export function sanitizeNoteForFirestore(note: Note, userId: string): Record<string, any> {
  const data: Record<string, any> = {
    id: note.id,
    userId: userId,
    title: note.title || "",
    type: note.type || "doc",
    color: note.color || "default",
    pinned: Boolean(note.pinned),
    archived: Boolean(note.archived),
    trashed: Boolean(note.trashed),
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || new Date().toISOString(),
  };

  if (note.content !== undefined) data.content = note.content;
  if (note.plainTextContent !== undefined) data.plainTextContent = note.plainTextContent;
  if (note.folderId !== undefined && note.folderId !== null) data.folderId = note.folderId;
  if (note.formTemplateId !== undefined) data.formTemplateId = note.formTemplateId;
  if (note.coverImage !== undefined) data.coverImage = note.coverImage;
  if (note.driveSyncId !== undefined) data.driveSyncId = note.driveSyncId;
  if (note.googleDocId !== undefined) data.googleDocId = note.googleDocId;
  if (note.googleDocUrl !== undefined) data.googleDocUrl = note.googleDocUrl;
  if (note.googleDocThumbnail !== undefined) data.googleDocThumbnail = note.googleDocThumbnail;
  if (note.googleDocSnippet !== undefined) data.googleDocSnippet = note.googleDocSnippet;
  if (note.googleDocModifiedTime !== undefined) data.googleDocModifiedTime = note.googleDocModifiedTime;

  // Flat string array
  if (Array.isArray(note.tags)) {
    data.tags = note.tags.filter((t) => typeof t === "string");
  }

  // Serialize complex/nested array structures as JSON strings to avoid Firestore nested array errors
  if (note.tables && Array.isArray(note.tables)) {
    try {
      data.tablesJson = JSON.stringify(note.tables);
    } catch (e) {
      console.warn("Failed to serialize tables to JSON:", e);
    }
  }

  if (note.sheetData) {
    try {
      data.sheetDataJson = JSON.stringify(note.sheetData);
    } catch (e) {
      console.warn("Failed to serialize sheetData to JSON:", e);
    }
  }

  if (note.imageAnnotation) {
    try {
      data.imageAnnotationJson = JSON.stringify(note.imageAnnotation);
    } catch (e) {
      console.warn("Failed to serialize imageAnnotation to JSON:", e);
    }
  }

  if (note.formValues) {
    try {
      data.formValuesJson = JSON.stringify(note.formValues);
    } catch (e) {
      console.warn("Failed to serialize formValues to JSON:", e);
    }
  }

  // Safe flat object arrays
  if (Array.isArray(note.checklist)) {
    data.checklist = note.checklist.map((item) => ({
      id: item.id || "",
      text: item.text || "",
      completed: Boolean(item.completed),
    }));
  }

  if (Array.isArray(note.comments)) {
    data.comments = note.comments.map((c) => {
      const sanitizedComment: Record<string, any> = {
        id: c.id || "",
        author: c.author || "",
        text: c.text || "",
        createdAt: c.createdAt || new Date().toISOString(),
      };
      if (c.avatarUrl) sanitizedComment.avatarUrl = c.avatarUrl;
      if (c.resolved !== undefined) sanitizedComment.resolved = Boolean(c.resolved);
      return sanitizedComment;
    });
  }

  if (Array.isArray(note.annotations)) {
    data.annotations = note.annotations.map((a) => ({
      id: a.id || "",
      baseImageUrl: a.baseImageUrl || "",
      vectorJson: a.vectorJson || "",
      renderedImageUrl: a.renderedImageUrl || "",
    }));
  }

  if (Array.isArray(note.attachments)) {
    data.attachments = note.attachments.map((att) => {
      const sanitizedAtt: Record<string, any> = {
        id: att.id || "",
        fileName: att.fileName || "",
        fileType: att.fileType || "txt",
        fileSize: Number(att.fileSize) || 0,
        url: att.url || "",
      };
      if (att.driveFileId) sanitizedAtt.driveFileId = att.driveFileId;
      if (att.extractedText) sanitizedAtt.extractedText = att.extractedText;
      return sanitizedAtt;
    });
  }

  if (Array.isArray(note.driveAttachments)) {
    data.driveAttachments = note.driveAttachments.map((d) => {
      const sanitizedDrive: Record<string, any> = {
        id: d.id || "",
        name: d.name || "",
        mimeType: d.mimeType || "",
        size: d.size || "",
        driveUrl: d.driveUrl || "",
        syncedAt: d.syncedAt || new Date().toISOString(),
        fileType: d.fileType || "doc",
      };
      if (d.thumbnailUrl) sanitizedDrive.thumbnailUrl = d.thumbnailUrl;
      return sanitizedDrive;
    });
  }

  return data;
}

/**
 * Deserializes Firestore document back into a fully typed Note object
 */
export function deserializeFirestoreNote(docData: Record<string, any>): Note {
  const note: Note = {
    id: docData.id,
    title: docData.title || "",
    content: docData.content || "",
    type: docData.type || "doc",
    color: docData.color || "default",
    tags: Array.isArray(docData.tags) ? docData.tags : [],
    pinned: Boolean(docData.pinned),
    archived: Boolean(docData.archived),
    trashed: Boolean(docData.trashed),
    createdAt: docData.createdAt || new Date().toISOString(),
    updatedAt: docData.updatedAt || new Date().toISOString(),
  };

  if (docData.plainTextContent !== undefined) note.plainTextContent = docData.plainTextContent;
  if (docData.folderId !== undefined) note.folderId = docData.folderId;
  if (docData.formTemplateId !== undefined) note.formTemplateId = docData.formTemplateId;

  // Restore tables
  if (docData.tablesJson && typeof docData.tablesJson === "string") {
    try {
      note.tables = JSON.parse(docData.tablesJson);
    } catch (e) {
      console.warn("Failed to parse tablesJson:", e);
    }
  } else if (Array.isArray(docData.tables)) {
    note.tables = docData.tables;
  }

  // Restore sheetData
  if (docData.sheetDataJson && typeof docData.sheetDataJson === "string") {
    try {
      note.sheetData = JSON.parse(docData.sheetDataJson);
    } catch (e) {
      console.warn("Failed to parse sheetDataJson:", e);
    }
  } else if (docData.sheetData) {
    note.sheetData = docData.sheetData;
  }

  // Restore imageAnnotation
  if (docData.imageAnnotationJson && typeof docData.imageAnnotationJson === "string") {
    try {
      note.imageAnnotation = JSON.parse(docData.imageAnnotationJson);
    } catch (e) {
      console.warn("Failed to parse imageAnnotationJson:", e);
    }
  } else if (docData.imageAnnotation) {
    note.imageAnnotation = docData.imageAnnotation;
  }

  // Restore formValues
  if (docData.formValuesJson && typeof docData.formValuesJson === "string") {
    try {
      note.formValues = JSON.parse(docData.formValuesJson);
    } catch (e) {
      console.warn("Failed to parse formValuesJson:", e);
    }
  } else if (docData.formValues) {
    note.formValues = docData.formValues;
  }

  // Restore arrays
  if (Array.isArray(docData.annotations)) note.annotations = docData.annotations;
  if (Array.isArray(docData.attachments)) note.attachments = docData.attachments;
  if (Array.isArray(docData.driveAttachments)) note.driveAttachments = docData.driveAttachments;
  if (Array.isArray(docData.checklist)) note.checklist = docData.checklist;
  if (Array.isArray(docData.comments)) note.comments = docData.comments;

  // Restore metadata
  if (docData.coverImage) note.coverImage = docData.coverImage;
  if (docData.driveSyncId) note.driveSyncId = docData.driveSyncId;
  if (docData.googleDocId) note.googleDocId = docData.googleDocId;
  if (docData.googleDocUrl) note.googleDocUrl = docData.googleDocUrl;
  if (docData.googleDocThumbnail) note.googleDocThumbnail = docData.googleDocThumbnail;
  if (docData.googleDocSnippet) note.googleDocSnippet = docData.googleDocSnippet;
  if (docData.googleDocModifiedTime) note.googleDocModifiedTime = docData.googleDocModifiedTime;

  return note;
}

/**
 * Sanitizes a Folder object for Firestore
 */
export function sanitizeFolderForFirestore(folder: Folder, userId: string): Record<string, any> {
  const data: Record<string, any> = {
    id: folder.id,
    userId: userId,
    name: folder.name || "Nova Pasta",
    createdAt: folder.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return data;
}

/**
 * Real-time listener for user notes
 */
export function subscribeToUserNotes(
  userId: string,
  onUpdate: (notes: Note[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const notesPath = "notes";
  const q = query(collection(db, notesPath), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: Note[] = [];
      snapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        notes.push(deserializeFirestoreNote(rawData));
      });
      // Sort newest first by default
      notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onUpdate(notes);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, notesPath);
    }
  );
}

/**
 * Real-time listener for user folders
 */
export function subscribeToUserFolders(
  userId: string,
  onUpdate: (folders: Folder[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const foldersPath = "folders";
  const q = query(collection(db, foldersPath), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const folders: Folder[] = [];
      snapshot.forEach((docSnap) => {
        folders.push(docSnap.data() as Folder);
      });
      onUpdate(folders);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, foldersPath);
    }
  );
}

/**
 * Upsert a single note to Firestore
 */
export async function syncNoteToFirestore(note: Note, userId: string): Promise<void> {
  const path = `notes/${note.id}`;
  try {
    const payload = sanitizeNoteForFirestore(note, userId);
    await setDoc(doc(db, "notes", note.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a single note from Firestore
 */
export async function deleteNoteFromFirestore(noteId: string): Promise<void> {
  const path = `notes/${noteId}`;
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Upsert a folder to Firestore
 */
export async function syncFolderToFirestore(folder: Folder, userId: string): Promise<void> {
  const path = `folders/${folder.id}`;
  try {
    const payload = sanitizeFolderForFirestore(folder, userId);
    await setDoc(doc(db, "folders", folder.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a folder from Firestore
 */
export async function deleteFolderFromFirestore(folderId: string): Promise<void> {
  const path = `folders/${folderId}`;
  try {
    await deleteDoc(doc(db, "folders", folderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save user custom color palette to Firestore
 */
export async function syncUserSettingsToFirestore(
  userId: string,
  palette: Record<CustomizableNoteColor, string>,
  layoutMode?: string
): Promise<void> {
  const path = `user_settings/${userId}`;
  try {
    await setDoc(
      doc(db, "user_settings", userId),
      {
        userId,
        palette,
        layoutMode: layoutMode || "grid",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch upload local notes & folders to Firestore (used on first Google Login sync)
 */
export async function syncAllLocalToFirestore(
  notes: Note[],
  folders: Folder[],
  userId: string
): Promise<{ notesSynced: number; foldersSynced: number }> {
  try {
    const batch = writeBatch(db);

    notes.forEach((note) => {
      const noteRef = doc(db, "notes", note.id);
      batch.set(noteRef, sanitizeNoteForFirestore(note, userId), { merge: true });
    });

    folders.forEach((folder) => {
      const folderRef = doc(db, "folders", folder.id);
      batch.set(folderRef, sanitizeFolderForFirestore(folder, userId), { merge: true });
    });

    await batch.commit();
    return {
      notesSynced: notes.length,
      foldersSynced: folders.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "batch_sync");
    return { notesSynced: 0, foldersSynced: 0 };
  }
}
