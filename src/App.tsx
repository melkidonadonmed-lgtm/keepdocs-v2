import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MasonryGrid } from "./components/MasonryGrid";
import { DocsEditorModal } from "./components/DocsEditorModal";
import { FormFillerModal } from "./components/FormFillerModal";
import { MiniSheetEditor } from "./components/MiniSheetEditor";
import { ImageAnnotatorModal } from "./components/ImageAnnotatorModal";
import { DrivePickerModal } from "./components/DrivePickerModal";
import { CommandPalette } from "./components/CommandPalette";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { FloatingQuickMenu } from "./components/FloatingQuickMenu";
import { TagFilterBar } from "./components/TagFilterBar";
import { WorkspaceCompanion, CompanionMode } from "./components/WorkspaceCompanion";
import { CompanionLauncher } from "./components/CompanionLauncher";

import { Note, NoteColor, ViewFilter, LayoutMode, DriveAttachment, EmbeddedTableData, Folder, SheetData } from "./types";
import { INITIAL_NOTES } from "./data/initialNotes";
import { DocumentIngestionService } from "./services/DocumentIngestionService";
import { NoteExportEngine } from "./services/NoteExportEngine";
import { loadNotes, saveNotes, loadFolders, saveFolders } from "./services/notesDb";
import { GoogleDocDetail } from "./services/googleDocsService";
import { convert2DArrayToSheetData } from "./services/googleSheetsService";

export default function App() {
  // Persistence in IndexedDB (migrates legacy localStorage data on first load)
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Load notes & folders from IndexedDB on startup (with localStorage migration fallback)
  useEffect(() => {
    let cancelled = false;
    loadNotes().then((loaded) => {
      if (cancelled) return;
      if (loaded && loaded.length > 0) {
        setNotes(loaded);
      }
      setNotesLoaded(true);
    });
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

  // Global Sync timestamp
  const [driveSyncedAt, setDriveSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem("keepdocs_drive_synced_at");
  });

  // UI Navigation & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setFilter] = useState<ViewFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<NoteColor | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Pastas (persistidas no IndexedDB)
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Active Modals State
  const [activeNoteForDocs, setActiveNoteForDocs] = useState<Note | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeFormNote, setActiveFormNote] = useState<Note | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [activeSheetNote, setActiveSheetNote] = useState<Note | null>(null);
  const [showCanvasModal, setShowCanvasModal] = useState(false);
  const [activeCanvasNote, setActiveCanvasNote] = useState<Note | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [companionMode, setCompanionMode] = useState<CompanionMode>("window");

  // Centralized Global Shortcuts (Cmd+K and Cmd+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !e.shiftKey) {
        e.preventDefault();
        setShowCompanion((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  // Persist folders with debounce
  useEffect(() => {
    if (!foldersLoaded) return;
    const timer = window.setTimeout(() => {
      saveFolders(folders).catch((e) => console.error("Failed to save folders:", e));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [folders, foldersLoaded]);

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  // Calculate notes counts for Sidebar
  const notesCounts = {
    all: notes.filter((n) => !n.trashed && !n.archived).length,
    pinned: notes.filter((n) => n.pinned && !n.trashed && !n.archived).length,
    docs: notes.filter((n) => n.type === "doc" && !n.trashed && !n.archived).length,
    forms: notes.filter((n) => n.type === "form" && !n.trashed && !n.archived).length,
    sheets: notes.filter((n) => n.type === "sheet" && !n.trashed && !n.archived).length,
    canvas: notes.filter((n) => n.type === "canvas" && !n.trashed && !n.archived).length,
    drive: notes.filter((n) => n.driveAttachments && n.driveAttachments.length > 0 && !n.trashed).length,
    trash: notes.filter((n) => n.trashed).length,
  };

  const folderCounts: Record<string, number> = {};
  folders.forEach((f) => {
    folderCounts[f.id] = notes.filter((n) => n.folderId === f.id && !n.trashed && !n.archived).length;
  });

  // Folder handlers
  const handleCreateFolder = (name: string) => {
    const folder: Folder = {
      id: "folder_" + Date.now(),
      name,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, folder]);
    setSelectedFolder(folder.id);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!window.confirm("Excluir esta pasta? As notas dentro dela serão mantidas (sem pasta).")) return;
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: undefined } : n))
    );
    if (selectedFolder === folderId) setSelectedFolder(null);
  };

  const handleAssignFolder = (id: string, folderId: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, folderId: folderId ?? undefined, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolder(folderId);
    if (folderId) {
      setFilter("all");
      setSelectedTag(null);
    }
  };

  const handleSetFilter = (filter: ViewFilter) => {
    setFilter(filter);
    setSelectedFolder(null);
    setSelectedTag(null);
  };

  // Filter notes based on active sidebar tab & search
  const filteredNotes = notes.filter((note) => {
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
  });

  // Open note depending on its type
  const handleOpenNote = (note: Note) => {
    if (note.type === "form") {
      setActiveFormNote(note);
      setShowFormModal(true);
    } else if (note.type === "sheet") {
      setActiveSheetNote(note);
      setShowSheetModal(true);
    } else if (note.type === "canvas") {
      setActiveCanvasNote(note);
      setShowCanvasModal(true);
    } else {
      setActiveNoteForDocs(note);
    }
  };

  // Create New Note Router
  const handleNewNote = (type: "doc" | "form" | "sheet" | "canvas" | "checklist") => {
    if (type === "form") {
      setActiveFormNote(null);
      setShowFormModal(true);
    } else if (type === "sheet") {
      setActiveSheetNote(null);
      setShowSheetModal(true);
    } else if (type === "canvas") {
      setActiveCanvasNote(null);
      setShowCanvasModal(true);
    } else {
      const newNote: Note = {
        id: "note_" + Date.now(),
        title: type === "checklist" ? "Nova Lista de Tarefas" : "Novo Documento Google Docs",
        content: type === "checklist" ? "<p>Checklist de atividades:</p>" : "<h2>Novo Documento</h2><p>Comece a escrever seu texto rico aqui...</p>",
        type: type === "checklist" ? "checklist" : "doc",
        color: "default",
        tags: [type === "checklist" ? "Checklist" : "Documento"],
        pinned: false,
        archived: false,
        trashed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checklist: type === "checklist" ? [{ id: "c1", text: "Primeira tarefa", completed: false }] : undefined,
      };
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteForDocs(newNote);
    }
  };

  // Note actions
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleChangeColor = (id: string, color: NoteColor, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleDuplicate = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup: Note = {
      ...note,
      id: "note_" + Date.now(),
      title: `${note.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [dup, ...prev]);
  };

  const handleReorderNotes = (draggedId: string, targetId: string) => {
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
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, trashed: true, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
  };

  // Google Drive Sync API call (ainda não implementado no backend — responde 501)
  const handleSyncDrive = async () => {
    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesCount: notes.length, lastSync: driveSyncedAt }),
      });
      if (!res.ok) {
        console.warn(`Drive sync indisponível (HTTP ${res.status}): recurso ainda não implementado.`);
        return;
      }
      const data = await res.json();
      if (data.syncedAt) {
        setDriveSyncedAt(data.syncedAt);
        localStorage.setItem("keepdocs_drive_synced_at", data.syncedAt);
      }
    } catch (err) {
      console.error("Erro na sincronização Drive:", err);
    }
  };

  // Global workspace backup (export / import all notes as a single .json)
  const handleExportBackup = () => {
    NoteExportEngine.exportWorkspaceBackup(notes);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const imported: Note[] = Array.isArray(parsed) ? parsed : parsed.notes;
        if (!Array.isArray(imported) || imported.length === 0) {
          throw new Error("Arquivo de backup inválido ou vazio.");
        }
        if (window.confirm(`Importar backup com ${imported.length} nota(s)? Isso substituirá as notas atuais.`)) {
          setNotes(imported);
        }
      } catch (err) {
        console.error("Erro ao importar backup:", err);
        setStorageError("Falha ao importar o backup: arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  // Collect all drive attachments across notes
  const allDriveAttachments: DriveAttachment[] = notes.flatMap((n) => n.driveAttachments || []);

  const handleAddGlobalDriveAttachment = (att: DriveAttachment) => {
    if (notes.length > 0) {
      const updatedFirstNote = {
        ...notes[0],
        driveAttachments: [...(notes[0].driveAttachments || []), att],
      };
      handleSaveNote(updatedFirstNote);
    }
  };

  const handleImportDriveNote = (item: any) => {
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
    handleSaveNote(newNote);
    setActiveNoteForDocs(newNote);
  };

  // Google Doc Ingestion Handler
  const handleImportGoogleDoc = (doc: GoogleDocDetail) => {
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
    handleSaveNote(newNote);
    setActiveNoteForDocs(newNote);
  };

  // Google Sheets Ingestion Handler
  const handleImportGoogleSheet = (sheet: any) => {
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
    handleSaveNote(newNote);
    setActiveSheetNote(newNote);
    setShowSheetModal(true);
  };

  // Google Slides Ingestion Handler
  const handleImportGoogleSlide = (slide: any) => {
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
    handleSaveNote(newNote);
    setActiveNoteForDocs(newNote);
  };

  // Google Keep Bulk Notes Ingestion Handler
  const handleImportKeepNotes = (keepNotes: Partial<Note>[]) => {
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
      setActiveNoteForDocs(newNotes[0]);
    }
  };

  // Document Ingestion Handler for CSV, TXT, MD, JSON files
  const handleImportDocument = async (file: File) => {
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
        handleSaveNote(newNote);
        setActiveNoteForDocs(newNote);
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
        handleSaveNote(newNote);
        setActiveNoteForDocs(newNote);
      }
    } catch (err) {
      console.error("Erro ao importar documento:", err);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#002b36] font-sans text-[#eee8d5] antialiased selection:bg-[#2aa198]/30">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenDriveModal={() => setShowDriveModal(true)}
          onNewNote={handleNewNote}
          onOpenAIAssistant={() => setShowAIAssistant(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          driveSyncedAt={driveSyncedAt}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onToggleCompanion={() => setShowCompanion((prev) => !prev)}
          isCompanionOpen={showCompanion}
        />

        {/* Main Content Area: Sidebar + Masonry Grid */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentFilter={currentFilter}
            setFilter={handleSetFilter}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            folderCounts={folderCounts}
            onMoveNoteToFolder={handleAssignFolder}
            onTrashNote={(id) => handleDelete(id)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            notesCounts={notesCounts}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <TagFilterBar
              allTags={allTags}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
            />
            <MasonryGrid
              notes={filteredNotes}
              layoutMode={layoutMode}
              folders={folders}
              onOpenNote={handleOpenNote}
              onTogglePin={handleTogglePin}
              onChangeColor={handleChangeColor}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onAssignFolder={handleAssignFolder}
              onNewNote={handleNewNote}
              onReorderNotes={handleReorderNotes}
            />
          </main>
        </div>

        {/* Workspace Companion in Main Menu View (Docked or Floating Pop-up Window) */}
        {showCompanion && !activeNoteForDocs && (
          <WorkspaceCompanion
            isOpen={showCompanion}
            onClose={() => setShowCompanion(false)}
            mode={companionMode}
            onToggleMode={() =>
              setCompanionMode((prev) => (prev === "sidebar" ? "window" : "sidebar"))
            }
            allNotes={notes}
            onSelectNote={(note) => handleOpenNote(note)}
            onNewNote={handleNewNote}
            onInsertIntoDocument={(textOrHtml) => {
              const newNote: Note = {
                id: `note_companion_${Date.now()}`,
                title: "Novo Documento (Companion)",
                content: textOrHtml,
                type: "doc",
                color: "teal",
                tags: ["Companion", "Workspace"],
                pinned: false,
                archived: false,
                trashed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              handleSaveNote(newNote);
              setActiveNoteForDocs(newNote);
            }}
            onAttachDriveFileToActiveNote={(att) => {
              handleAddGlobalDriveAttachment(att);
            }}
          />
        )}

        {/* Companion Edge Quick Launcher (When closed) */}
        <CompanionLauncher
          isOpen={showCompanion}
          onToggle={() => setShowCompanion(true)}
        />

        {/* Modals Suite */}
        {activeNoteForDocs && (
          <DocsEditorModal
            note={activeNoteForDocs}
            onClose={() => setActiveNoteForDocs(null)}
            onSaveNote={handleSaveNote}
            allNotes={notes}
            onSelectNote={handleOpenNote}
            onNewNote={handleNewNote}
          />
        )}

        {showFormModal && (
          <FormFillerModal
            note={activeFormNote}
            onClose={() => {
              setShowFormModal(false);
              setActiveFormNote(null);
            }}
            onSaveAsNote={handleSaveNote}
          />
        )}

        {showSheetModal && (
          <MiniSheetEditor
            note={activeSheetNote}
            onClose={() => {
              setShowSheetModal(false);
              setActiveSheetNote(null);
            }}
            onSaveAsNote={handleSaveNote}
          />
        )}

        {showCanvasModal && (
          <ImageAnnotatorModal
            note={activeCanvasNote}
            onClose={() => {
              setShowCanvasModal(false);
              setActiveCanvasNote(null);
            }}
            onSaveAsNote={handleSaveNote}
          />
        )}

        {showDriveModal && (
          <DrivePickerModal
            attachments={allDriveAttachments}
            notes={notes}
            onAddAttachment={handleAddGlobalDriveAttachment}
            onImportDriveNote={handleImportDriveNote}
            onImportGoogleDoc={handleImportGoogleDoc}
            onImportGoogleSheet={handleImportGoogleSheet}
            onImportGoogleSlide={handleImportGoogleSlide}
            onImportKeepNotes={handleImportKeepNotes}
            onClose={() => setShowDriveModal(false)}
            driveSyncedAt={driveSyncedAt}
          />
        )}

        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          notes={notes}
          onOpenNote={handleOpenNote}
          onNewNote={handleNewNote}
          onOpenDriveModal={() => setShowDriveModal(true)}
          onOpenAIAssistant={() => setShowAIAssistant(true)}
        />

        <AIAssistantModal
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onCreateNoteFromAI={(title, content) => {
            const newNote: Note = {
              id: "ai_note_" + Date.now(),
              title,
              content,
              type: "doc",
              color: "purple",
              tags: ["IA", "Gemini"],
              pinned: false,
              archived: false,
              trashed: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            handleSaveNote(newNote);
            setActiveNoteForDocs(newNote);
          }}
        />

        {/* Storage Failure Banner */}
        {storageError && (
          <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 shadow-xl dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-300">
            <span>{storageError}</span>
            <button
              onClick={() => setStorageError(null)}
              className="rounded-lg px-2 py-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floating Quick Action Button & Popover */}
        <FloatingQuickMenu
          onCreateDoc={() => handleNewNote("doc")}
          onCreateTable={() => handleNewNote("sheet")}
          onCreateForm={() => handleNewNote("form")}
          onOpenCanvas={() => handleNewNote("canvas")}
          onImportDocument={handleImportDocument}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />
      </div>
    </DndProvider>
  );
}
