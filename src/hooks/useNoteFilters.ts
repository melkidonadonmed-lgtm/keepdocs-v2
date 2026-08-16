import { useState, useMemo, useCallback } from "react";
import { Note, NoteColor, ViewFilter, LayoutMode, Folder } from "../types";

interface UseNoteFiltersOptions {
  notes: Note[];
  folders: Folder[];
  selectedFolder: string | null;
  /** Chamado quando um filtro da sidebar é trocado (limpa a seleção de pasta) */
  onClearFolderSelection: () => void;
}

/**
 * Estado de navegação e filtragem do workspace:
 * busca, filtro da sidebar, tag, cor, modo de layout e visibilidade
 * das sidebars (mobile / colapsada).
 *
 * Também deriva: `allTags`, `notesCounts`, `folderCounts` e `filteredNotes`.
 */
export function useNoteFilters({ notes, folders, selectedFolder, onClearFolderSelection }: UseNoteFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setFilter] = useState<ViewFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<NoteColor | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Trocar de filtro limpa pasta e tag selecionadas (comportamento original)
  const setFilterAndClearSelections = useCallback(
    (filter: ViewFilter) => {
      setFilter(filter);
      onClearFolderSelection();
      setSelectedTag(null);
    },
    [onClearFolderSelection]
  );

  // Extract all unique tags
  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags))), [notes]);

  // Calculate notes counts for Sidebar
  const notesCounts = useMemo(
    () => ({
      all: notes.filter((n) => !n.trashed && !n.archived).length,
      pinned: notes.filter((n) => n.pinned && !n.trashed && !n.archived).length,
      docs: notes.filter((n) => n.type === "doc" && !n.trashed && !n.archived).length,
      forms: notes.filter((n) => n.type === "form" && !n.trashed && !n.archived).length,
      sheets: notes.filter((n) => n.type === "sheet" && !n.trashed && !n.archived).length,
      canvas: notes.filter((n) => n.type === "canvas" && !n.trashed && !n.archived).length,
      drive: notes.filter((n) => n.driveAttachments && n.driveAttachments.length > 0 && !n.trashed).length,
      trash: notes.filter((n) => n.trashed).length,
    }),
    [notes]
  );

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => {
      counts[f.id] = notes.filter((n) => n.folderId === f.id && !n.trashed && !n.archived).length;
    });
    return counts;
  }, [notes, folders]);

  // Filter notes based on active sidebar tab & search
  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        if (currentFilter === "trash") return note.trashed;
        if (note.trashed) return false;

        if (currentFilter === "archive") return note.archived;
        if (note.archived) return false;

        if (currentFilter === "pinned" && !note.pinned) return false;
        if (currentFilter === "docs" && note.type !== "doc") return false;
        if (currentFilter === "forms" && note.type !== "form") return false;
        if (currentFilter === "sheets" && note.type !== "sheet") return false;
        if (currentFilter === "canvas" && note.type !== "canvas") return false;
        if (currentFilter === "drive" && (!note.driveAttachments || note.driveAttachments.length === 0)) return false;

        if (selectedFolder && note.folderId !== selectedFolder) return false;
        if (selectedTag && !note.tags.includes(selectedTag)) return false;
        if (selectedColor && note.color !== selectedColor) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchTag = note.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTag) return false;
        }

        return true;
      }),
    [notes, currentFilter, selectedFolder, selectedTag, selectedColor, searchQuery]
  );

  return {
    searchQuery,
    setSearchQuery,
    currentFilter,
    setFilter,
    setFilterAndClearSelections,
    selectedTag,
    setSelectedTag,
    selectedColor,
    setSelectedColor,
    layoutMode,
    setLayoutMode,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    allTags,
    notesCounts,
    folderCounts,
    filteredNotes,
  };
}
