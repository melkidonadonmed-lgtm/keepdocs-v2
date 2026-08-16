import { openDB, IDBPDatabase } from "idb";
import { Note, Folder } from "../types";

const DB_NAME = "keepdocs_workspace_db";
const STORE_NAME = "workspace";
const NOTES_KEY = "notes_v1";
const FOLDERS_KEY = "folders_v1";
const LEGACY_LOCALSTORAGE_KEY = "keepdocs_workspace_notes_v1";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

/**
 * Carrega as notas do IndexedDB. Se não houver nada salvo, tenta migrar
 * os dados legados do localStorage (versão anterior do app).
 */
export async function loadNotes(): Promise<Note[] | null> {
  try {
    const db = await getDb();
    const notes = await db.get(STORE_NAME, NOTES_KEY);
    if (Array.isArray(notes)) {
      return notes as Note[];
    }

    // Fallback: migração única do localStorage para o IndexedDB
    const legacy = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        await db.put(STORE_NAME, parsed, NOTES_KEY);
        localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
        return parsed as Note[];
      }
    }
  } catch (err) {
    console.error("Falha ao carregar notas do IndexedDB:", err);
  }
  return null;
}

/**
 * Persiste todas as notas no IndexedDB. Lança exceção em caso de
 * quota excedida para que a UI possa avisar o usuário.
 */
export async function saveNotes(notes: Note[]): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, notes, NOTES_KEY);
}

/** Carrega as pastas do IndexedDB. */
export async function loadFolders(): Promise<Folder[] | null> {
  try {
    const db = await getDb();
    const folders = await db.get(STORE_NAME, FOLDERS_KEY);
    if (Array.isArray(folders)) {
      return folders as Folder[];
    }
  } catch (err) {
    console.error("Falha ao carregar pastas do IndexedDB:", err);
  }
  return null;
}

/** Persiste todas as pastas no IndexedDB. */
export async function saveFolders(folders: Folder[]): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, folders, FOLDERS_KEY);
}
