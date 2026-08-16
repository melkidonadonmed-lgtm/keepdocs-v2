import { useState, useEffect, useCallback, type Dispatch, type SetStateAction, type MouseEvent } from "react";
import { Folder, Note } from "../types";
import { loadFolders, saveFolders } from "../services/notesDb";

/**
 * Estado das pastas + persistência no IndexedDB.
 *
 * Recebe `setNotes` porque excluir uma pasta também desvincula as notas
 * que estavam dentro dela (elas são mantidas, apenas "sem pasta").
 */
export function useFolders(setNotes: Dispatch<SetStateAction<Note[]>>) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Load folders from IndexedDB on startup
  useEffect(() => {
    let cancelled = false;
    loadFolders().then((loadedFolders) => {
      if (cancelled) return;
      if (loadedFolders) {
        setFolders(loadedFolders);
      }
      setFoldersLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist folders with debounce (~500ms)
  useEffect(() => {
    if (!foldersLoaded) return;
    const timer = window.setTimeout(() => {
      saveFolders(folders).catch((e) => console.error("Failed to save folders:", e));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [folders, foldersLoaded]);

  const createFolder = useCallback((name: string) => {
    const folder: Folder = {
      id: "folder_" + Date.now(),
      name,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, folder]);
    setSelectedFolder(folder.id);
  }, []);

  const deleteFolder = useCallback(
    (folderId: string) => {
      if (!window.confirm("Excluir esta pasta? As notas dentro dela serão mantidas (sem pasta).")) return;
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setNotes((prev) =>
        prev.map((n) => (n.folderId === folderId ? { ...n, folderId: undefined } : n))
      );
      setSelectedFolder((prev) => (prev === folderId ? null : prev));
    },
    [setNotes]
  );

  const assignFolder = useCallback(
    (id: string, folderId: string | null, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, folderId: folderId ?? undefined, updatedAt: new Date().toISOString() } : n
        )
      );
    },
    [setNotes]
  );

  return {
    folders,
    selectedFolder,
    setSelectedFolder,
    createFolder,
    deleteFolder,
    assignFolder,
  };
}
