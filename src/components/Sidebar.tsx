import React from "react";
import { useDrop } from "react-dnd";
import {
  Pin,
  FileText,
  ClipboardList,
  FileSpreadsheet,
  PenTool,
  Cloud,
  Trash2,
  Archive,
  Layers,
  Folder as FolderIcon,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { ViewFilter, NoteColor, Folder, DND_ITEM_TYPES } from "../types";

interface SidebarProps {
  currentFilter: ViewFilter;
  setFilter: (filter: ViewFilter) => void;
  selectedColor: NoteColor | null;
  setSelectedColor: (color: NoteColor | null) => void;
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  folderCounts: Record<string, number>;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  onArchiveNote?: (noteId: string) => void;
  onTrashNote?: (noteId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  notesCounts: {
    all: number;
    pinned: number;
    docs: number;
    forms: number;
    sheets: number;
    canvas: number;
    drive: number;
    trash: number;
  };
}

// Droppable folder item for expanded view
const DroppableFolderItem: React.FC<{
  folder: Folder;
  active: boolean;
  count: number;
  onSelect: () => void;
  onDelete: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  itemClass: (active: boolean) => string;
  countBadge: (count: number, active: boolean) => React.ReactNode;
}> = ({ folder, active, count, onSelect, onDelete, onMoveNoteToFolder, itemClass, countBadge }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM_TYPES.NOTE,
      drop: (item: { id: string }) => {
        if (onMoveNoteToFolder) {
          onMoveNoteToFolder(item.id, folder.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [folder.id, onMoveNoteToFolder]
  );

  return (
    <div
      ref={(node) => {
        dropRef(node);
      }}
      className={`group/folder relative rounded-lg transition-all ${
        isOver && canDrop
          ? "ring-2 ring-[#2aa198] bg-[#0a4553] scale-[1.02] shadow-sm"
          : canDrop
          ? "ring-1 ring-[#2aa198]/40"
          : ""
      }`}
    >
      <button onClick={onSelect} className={itemClass(active)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <FolderIcon
            className={`h-4 w-4 shrink-0 transition-transform ${
              isOver ? "scale-125 text-[#2aa198]" : active ? "text-[#2aa198]" : "text-[#586e75]"
            }`}
          />
          <span className="truncate">{folder.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOver && (
            <span className="rounded bg-[#2aa198] px-1.5 py-0.5 text-[9px] font-medium text-[#002b36] uppercase tracking-wider animate-pulse">
              Soltar
            </span>
          )}
          {countBadge(count, active)}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-9 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-[#586e75] hover:bg-[#dc322f]/20 hover:text-[#dc322f] group-hover/folder:block transition-colors"
        title="Excluir pasta (notas são mantidas)"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

// Droppable folder item for collapsed rail
const DroppableRailFolderItem: React.FC<{
  folder: Folder;
  active: boolean;
  onSelect: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
}> = ({ folder, active, onSelect, onMoveNoteToFolder }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM_TYPES.NOTE,
      drop: (item: { id: string }) => {
        if (onMoveNoteToFolder) {
          onMoveNoteToFolder(item.id, folder.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [folder.id, onMoveNoteToFolder]
  );

  return (
    <div
      ref={(node) => {
        dropRef(node);
      }}
      className="relative"
    >
      <button
        onClick={onSelect}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
          isOver
            ? "bg-[#2aa198] text-[#002b36] scale-110 ring-2 ring-[#2aa198] shadow-md"
            : active
            ? "bg-[#0a4553] text-[#eee8d5]"
            : canDrop
            ? "text-[#2aa198] bg-[#0a4553]/50 ring-1 ring-[#2aa198]/40"
            : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5]"
        }`}
        title={`Pasta: ${folder.name} (Solte a nota aqui para mover)`}
      >
        <FolderIcon className={`h-4 w-4 ${isOver ? "animate-bounce" : ""}`} />
      </button>
    </div>
  );
};

// Droppable drop target for "Todas as Notas" (removes note from folder)
const DroppableAllNotesItem: React.FC<{
  active: boolean;
  count?: number;
  onSelect: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  itemClass: (active: boolean) => string;
  countBadge: (count: number, active: boolean) => React.ReactNode;
}> = ({ active, count, onSelect, onMoveNoteToFolder, itemClass, countBadge }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM_TYPES.NOTE,
      drop: (item: { id: string }) => {
        if (onMoveNoteToFolder) {
          onMoveNoteToFolder(item.id, null);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onMoveNoteToFolder]
  );

  return (
    <div
      ref={(node) => {
        dropRef(node);
      }}
      className={`rounded-lg transition-all ${
        isOver && canDrop
          ? "ring-2 ring-[#2aa198] bg-[#0a4553] scale-[1.01]"
          : ""
      }`}
    >
      <button onClick={onSelect} className={itemClass(active)}>
        <div className="flex items-center gap-2.5">
          <Layers className={`h-4 w-4 ${isOver ? "scale-125 text-[#2aa198]" : ""}`} />
          <span>Todas as Notas</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isOver && (
            <span className="rounded bg-[#0a4553] px-1.5 py-0.5 text-[9px] font-medium text-[#eee8d5] uppercase tracking-wider">
              Sem Pasta
            </span>
          )}
          {count !== undefined && countBadge(count, active)}
        </div>
      </button>
    </div>
  );
};

// Droppable Trash Target
const DroppableTrashItem: React.FC<{
  active: boolean;
  count: number;
  onSelect: () => void;
  onTrashNote?: (noteId: string) => void;
  countBadge: (count: number, active: boolean) => React.ReactNode;
}> = ({ active, count, onSelect, onTrashNote, countBadge }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM_TYPES.NOTE,
      drop: (item: { id: string }) => {
        if (onTrashNote) {
          onTrashNote(item.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onTrashNote]
  );

  return (
    <div
      ref={(node) => {
        dropRef(node);
      }}
      className={`rounded-lg transition-all ${
        isOver && canDrop
          ? "ring-2 ring-[#dc322f] bg-[#dc322f]/20 scale-[1.02]"
          : ""
      }`}
    >
      <button
        onClick={onSelect}
        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          active || isOver
            ? "bg-[#dc322f]/15 text-[#dc322f] font-medium border-l-2 border-[#dc322f]"
            : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5] border-l-2 border-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Trash2 className={`h-4 w-4 ${isOver ? "scale-125 text-[#dc322f] animate-bounce" : ""}`} />
          <span>Lixeira</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isOver && (
            <span className="rounded bg-[#dc322f] px-1.5 py-0.5 text-[9px] font-medium text-white uppercase tracking-wider">
              Excluir
            </span>
          )}
          {countBadge(count, false)}
        </div>
      </button>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  setFilter,
  selectedColor,
  setSelectedColor,
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  folderCounts,
  onMoveNoteToFolder,
  onTrashNote,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  notesCounts,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");

  const colors: { name: NoteColor; class: string; label: string }[] = [
    { name: "default", class: "bg-[#073642] border-[rgba(147,161,161,0.2)]", label: "Padrão" },
    { name: "yellow", class: "dot-yellow border-transparent", label: "Amarelo Solar" },
    { name: "green", class: "dot-green border-transparent", label: "Verde Musgo" },
    { name: "teal", class: "dot-teal border-transparent", label: "Teal Suave" },
    { name: "blue", class: "dot-blue border-transparent", label: "Azul Céu" },
    { name: "purple", class: "dot-purple border-transparent", label: "Violeta" },
    { name: "pink", class: "dot-pink border-transparent", label: "Magenta" },
    { name: "amber", class: "dot-amber border-transparent", label: "Laranja Queimado" },
    { name: "red", class: "dot-red border-transparent", label: "Terracota" },
    { name: "gray", class: "dot-gray border-transparent", label: "Cinza Névoa" },
  ];

  const handleSelectFilter = (filter: ViewFilter) => {
    setFilter(filter);
    if (onCloseMobile) onCloseMobile();
  };

  const submitNewFolder = () => {
    const name = newFolderName.trim();
    if (name) onCreateFolder(name);
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  const navItems: {
    filter: ViewFilter;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    { filter: "pinned", label: "Fixadas", icon: <Pin className="h-3.5 w-3.5" />, count: notesCounts.pinned },
    { filter: "docs", label: "Documentos", icon: <FileText className="h-3.5 w-3.5" />, count: notesCounts.docs },
    { filter: "forms", label: "Formulários", icon: <ClipboardList className="h-3.5 w-3.5" />, count: notesCounts.forms },
    { filter: "sheets", label: "Planilhas", icon: <FileSpreadsheet className="h-3.5 w-3.5" />, count: notesCounts.sheets },
    { filter: "canvas", label: "Canvas", icon: <PenTool className="h-3.5 w-3.5" />, count: notesCounts.canvas },
    { filter: "drive", label: "Anexos Drive", icon: <Cloud className="h-3.5 w-3.5" />, count: notesCounts.drive },
  ];

  const itemClass = (active: boolean) =>
    `flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
      active
        ? "bg-[#0a4553] text-[#eee8d5] border-l-2 border-[#2aa198]"
        : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5] border-l-2 border-transparent"
    }`;

  const countBadge = (count: number, active: boolean) => (
    <span
      className={`rounded px-1.5 py-0.2 text-[10px] tabular-nums font-medium ${
        active
          ? "bg-[#2aa198]/20 text-[#2aa198]"
          : "bg-[#002b36] text-[#586e75]"
      }`}
    >
      {count}
    </span>
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Mobile Drawer Header */}
      <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] pb-3 lg:hidden">
        <span className="font-medium text-[#eee8d5]">Navegação</span>
        <button
          onClick={onCloseMobile}
          className="btn-ghost flex h-10 w-10 items-center justify-center rounded-lg p-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation Views */}
      <div className="space-y-1">
        <div className="section-label px-2.5 pb-1">
          Módulos
        </div>

        {/* Droppable "Todas as Notas" */}
        <DroppableAllNotesItem
          active={currentFilter === "all" && !selectedFolder}
          count={notesCounts.all}
          onSelect={() => handleSelectFilter("all")}
          onMoveNoteToFolder={onMoveNoteToFolder}
          itemClass={itemClass}
          countBadge={countBadge}
        />

        {navItems.map((item) => {
          const active = currentFilter === item.filter && !selectedFolder;
          return (
            <button
              key={item.filter}
              onClick={() => handleSelectFilter(item.filter)}
              className={itemClass(active)}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && countBadge(item.count, active)}
            </button>
          );
        })}
      </div>

      {/* Folders */}
      <div className="space-y-1 border-t border-[rgba(147,161,161,0.12)] pt-5">
        <div className="flex items-center justify-between px-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="section-label">Pastas</span>
            <span className="text-[10px] text-[#586e75]" title="Arraste notas diretamente para as pastas">
              (D&D)
            </span>
          </div>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="btn-ghost rounded-md p-1"
            title="Criar nova pasta"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        {isCreatingFolder && (
          <div className="px-1 pb-1.5">
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewFolder();
                if (e.key === "Escape") {
                  setNewFolderName("");
                  setIsCreatingFolder(false);
                }
              }}
              onBlur={submitNewFolder}
              placeholder="Nome da pasta..."
              className="w-full rounded-lg border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-2.5 py-1.5 text-xs text-[#eee8d5] placeholder-[#586e75] outline-none focus:border-[#2aa198]"
            />
          </div>
        )}

        {folders.length === 0 && !isCreatingFolder && (
          <p className="px-2.5 text-[11px] text-[#586e75]">
            Nenhuma pasta. Clique em + para criar.
          </p>
        )}

        {folders.map((folder) => {
          const active = selectedFolder === folder.id;
          return (
            <DroppableFolderItem
              key={folder.id}
              folder={folder}
              active={active}
              count={folderCounts[folder.id] || 0}
              onSelect={() => {
                onSelectFolder(active ? null : folder.id);
                if (onCloseMobile) onCloseMobile();
              }}
              onDelete={() => onDeleteFolder(folder.id)}
              onMoveNoteToFolder={onMoveNoteToFolder}
              itemClass={itemClass}
              countBadge={countBadge}
            />
          );
        })}
      </div>

      {/* Color Palette Filter */}
      <div className="space-y-2 border-t border-[rgba(147,161,161,0.12)] pt-5">
        <div className="flex items-center justify-between px-2.5">
          <span className="section-label">Cores</span>
          {selectedColor && (
            <button
              onClick={() => {
                setSelectedColor(null);
                if (onCloseMobile) onCloseMobile();
              }}
              className="text-[10px] font-medium text-[#2aa198] hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 px-2.5">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setSelectedColor(selectedColor === c.name ? null : c.name);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`h-5 w-5 rounded-full border transition-all ${c.class} ${
                selectedColor === c.name
                  ? "ring-2 ring-[#2aa198] ring-offset-2 ring-offset-[#01303c]"
                  : "opacity-70 hover:opacity-100"
              }`}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* System Archives & Trash */}
      <div className="space-y-1 border-t border-[rgba(147,161,161,0.12)] pt-5">
        <button
          onClick={() => handleSelectFilter("archive")}
          className={itemClass(currentFilter === "archive")}
        >
          <div className="flex items-center gap-2.5">
            <Archive className="h-4 w-4" />
            <span>Arquivadas</span>
          </div>
        </button>

        <DroppableTrashItem
          active={currentFilter === "trash"}
          count={notesCounts.trash}
          onSelect={() => handleSelectFilter("trash")}
          onTrashNote={onTrashNote}
          countBadge={countBadge}
        />
      </div>
    </div>
  );

  // Collapsed icon rail (desktop only)
  const collapsedRail = (
    <div className="flex flex-col items-center gap-1.5">
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="btn-ghost mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
          title="Expandir menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => handleSelectFilter("all")}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          currentFilter === "all" && !selectedFolder
            ? "bg-[#0a4553] text-[#eee8d5]"
            : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5]"
        }`}
        title="Todas as Notas"
      >
        <Layers className="h-4 w-4" />
      </button>
      {navItems.map((item) => {
        const active = currentFilter === item.filter && !selectedFolder;
        return (
          <button
            key={item.filter}
            onClick={() => handleSelectFilter(item.filter)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              active
                ? "bg-[#0a4553] text-[#eee8d5]"
                : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5]"
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        );
      })}
      {folders.map((folder) => (
        <DroppableRailFolderItem
          key={folder.id}
          folder={folder}
          active={selectedFolder === folder.id}
          onSelect={() => onSelectFolder(selectedFolder === folder.id ? null : folder.id)}
          onMoveNoteToFolder={onMoveNoteToFolder}
        />
      ))}
      <div className="my-2 h-px w-6 bg-[rgba(147,161,161,0.12)]" />
      <button
        onClick={() => handleSelectFilter("archive")}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          currentFilter === "archive"
            ? "bg-[#0a4553] text-[#eee8d5]"
            : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5]"
        }`}
        title="Arquivadas"
      >
        <Archive className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleSelectFilter("trash")}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          currentFilter === "trash"
            ? "bg-[#dc322f]/20 text-[#dc322f]"
            : "text-[#93a1a1] hover:bg-[#0a4553]/60 hover:text-[#eee8d5]"
        }`}
        title="Lixeira"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Persistent Sidebar (collapsible) - Fundo #01303c rígido */}
      <aside
        className={`hidden flex-shrink-0 border-r border-[rgba(147,161,161,0.12)] bg-[#01303c] p-3.5 transition-[width] duration-200 ease-out md:block ${
          isCollapsed ? "w-16 overflow-y-auto" : "w-60 overflow-y-auto"
        }`}
      >
        {isCollapsed ? (
          collapsedRail
        ) : (
          <div className="space-y-1">
            {onToggleCollapse && (
              <div className="flex justify-end pb-1">
                <button
                  onClick={onToggleCollapse}
                  className="btn-ghost flex h-7 w-7 items-center justify-center rounded-lg"
                  title="Recolher menu lateral"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {sidebarContent}
          </div>
        )}
      </aside>

      {/* Mobile Slide-Over Drawer (<768px) - Sem blur invasivo, ágil e compacto */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
          />
          <aside className="relative z-50 w-64 max-w-[75vw] flex-shrink-0 overflow-y-auto border-r border-[rgba(147,161,161,0.15)] bg-[#01303c] p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
