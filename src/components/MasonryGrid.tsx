import React from "react";
import { Note, NoteColor, LayoutMode, Folder } from "../types";
import { NoteCard } from "./NoteCard";
import { Sparkles, Plus, FileText } from "lucide-react";

interface MasonryGridProps {
  notes: Note[];
  layoutMode: LayoutMode;
  folders: Folder[];
  onOpenNote: (note: Note) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onChangeColor: (id: string, color: NoteColor, e: React.MouseEvent) => void;
  onDuplicate: (note: Note, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onAssignFolder: (id: string, folderId: string | null, e: React.MouseEvent) => void;
  onNewNote: (type: "doc" | "form" | "sheet" | "canvas" | "checklist") => void;
  onReorderNotes?: (draggedId: string, targetId: string) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  notes,
  layoutMode,
  folders,
  onOpenNote,
  onTogglePin,
  onChangeColor,
  onDuplicate,
  onDelete,
  onAssignFolder,
  onNewNote,
  onReorderNotes,
}) => {
  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  if (notes.length === 0) {
    return (
      <div className="solarized-card flex flex-col items-center justify-center p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#002b36] text-[#2aa198]">
          <FileText className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-medium text-[#eee8d5]">
          Nenhuma nota encontrada no filtro atual
        </h3>
        <p className="mt-1.5 max-w-sm text-xs text-[#93a1a1]">
          Crie um novo documento no estilo Google Docs, um formulário dinâmico ou uma planilha interativa.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNewNote("doc")}
            className="flex items-center gap-1.5 rounded-xl bg-[#2aa198] px-4 py-2 text-xs font-medium text-[#002b36] hover:brightness-105 transition-all shadow-md"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Criar Nova Nota</span>
          </button>
          <button
            onClick={() => onNewNote("form")}
            className="btn-ghost flex items-center gap-1.5 rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] px-4 py-2 text-xs font-medium text-[#eee8d5]"
          >
            <Sparkles className="h-4 w-4 text-[#2aa198]" />
            <span>Usar Template Dinâmico</span>
          </button>
        </div>
      </div>
    );
  }

  const renderCardList = (items: Note[]) => {
    if (layoutMode === "list") {
      return (
        <div className="flex flex-col space-y-4">
          {items.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              folders={folders}
              onOpen={onOpenNote}
              onTogglePin={onTogglePin}
              onChangeColor={onChangeColor}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onAssignFolder={onAssignFolder}
              onReorder={onReorderNotes}
            />
          ))}
        </div>
      );
    }

    if (layoutMode === "grid") {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              folders={folders}
              onOpen={onOpenNote}
              onTogglePin={onTogglePin}
              onChangeColor={onChangeColor}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onAssignFolder={onAssignFolder}
              onReorder={onReorderNotes}
            />
          ))}
        </div>
      );
    }

    // Default: Masonry CSS Columns Flow (1 col mobile <768px, 2 cols tablet 768-1024px, 3+ cols desktop >1024px)
    return (
      <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3 xl:columns-4">
        {items.map((note) => (
          <div key={note.id} className="break-inside-avoid">
            <NoteCard
              note={note}
              folders={folders}
              onOpen={onOpenNote}
              onTogglePin={onTogglePin}
              onChangeColor={onChangeColor}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onAssignFolder={onAssignFolder}
              onReorder={onReorderNotes}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="section-label">Fixadas ({pinnedNotes.length})</span>
          </div>
          {renderCardList(pinnedNotes)}
        </div>
      )}

      {/* Unpinned Notes Section */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-3.5">
          {pinnedNotes.length > 0 && (
            <div className="border-t border-[rgba(147,161,161,0.12)] pt-6">
              <span className="section-label">Outras Notas</span>
            </div>
          )}
          {renderCardList(unpinnedNotes)}
        </div>
      )}
    </div>
  );
};
