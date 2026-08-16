import { useState, useEffect, useCallback, type MouseEvent } from "react";
import { Note, NoteColor } from "../types";
import { INITIAL_NOTES } from "../data/initialNotes";
import { loadNotes, saveNotes } from "../services/notesDb";

/**
 * Estado central das notas + persistência no IndexedDB.
 *
 * Responsável por:
 * - carregar as notas do IndexedDB na inicialização (com migração do localStorage legado);
 * - salvar com debounce (~500ms) sempre que as notas mudam, expondo `storageError` em caso de falha;
 * - ações de nota: save (upsert), pin, cor, duplicar, reordenar (D&D) e mover para a lixeira.
 */
export function useNotesState() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Load notes from IndexedDB on startup (with localStorage migration fallback)
  useEffect(() => {
    let cancelled = false;
    loadNotes().then((loaded) => {
      if (cancelled) return;
      if (loaded && loaded.length > 0) {
        setNotes(loaded);
      }
      setNotesLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync to IndexedDB with debounce (~500ms); warns the user in the UI on failure
  useEffect(() => {
    if (!notesLoaded) return;
    const timer = window.setTimeout(() => {
      saveNotes(notes)
        .then(() => setStorageError(null))
        .catch((e) => {
          console.error("Failed to save notes to IndexedDB:", e);
          setStorageError(
            "Não foi possível salvar suas notas (armazenamento cheio ou indisponível). Exporte um backup para não perder dados."
          );
        });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [notes, notesLoaded]);

  // Upsert: atualiza a nota existente ou insere no topo
  const saveNote = useCallback((updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
  }, []);

  const togglePin = useCallback((id: string, e: MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const changeColor = useCallback((id: string, color: NoteColor, e: MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const duplicateNote = useCallback((note: Note, e: MouseEvent) => {
    e.stopPropagation();
    const dup: Note = {
      ...note,
      id: "note_" + Date.now(),
      title: `${note.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [dup, ...prev]);
  }, []);

  const reorderNotes = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setNotes((prevNotes) => {
      const draggedIdx = prevNotes.findIndex((n) => n.id === draggedId);
      const targetIdx = prevNotes.findIndex((n) => n.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prevNotes;

      const newNotes = [...prevNotes];
      const [draggedNote] = newNotes.splice(draggedIdx, 1);

      // Inherit the target's pinned status if dragged across pinned/unpinned sections
      const targetNote = prevNotes[targetIdx];
      const updatedMovedNote = {
        ...draggedNote,
        pinned: targetNote.pinned,
        updatedAt: new Date().toISOString(),
      };

      const newTargetIdx = newNotes.findIndex((n) => n.id === targetId);
      newNotes.splice(newTargetIdx, 0, updatedMovedNote);
      return newNotes;
    });
  }, []);

  // Move para a lixeira (soft delete)
  const trashNote = useCallback((id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, trashed: true, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  return {
    notes,
    setNotes,
    storageError,
    setStorageError,
    saveNote,
    togglePin,
    changeColor,
    duplicateNote,
    reorderNotes,
    trashNote,
  };
}
