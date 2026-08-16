import React, { useState } from "react";
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
import { WorkspaceCompanion } from "./components/WorkspaceCompanion";
import { CompanionLauncher } from "./components/CompanionLauncher";
import { WorkspaceAnalyticsModal } from "./components/WorkspaceAnalyticsModal";
import { UndoToast } from "./components/UndoToast";
import { MobileBottomNav } from "./components/MobileBottomNav";

import { Note } from "./types";
import { useNotesState } from "./hooks/useNotesState";
import { useFolders } from "./hooks/useFolders";
import { useModalManager } from "./hooks/useModalManager";
import { useNoteFilters } from "./hooks/useNoteFilters";
import { useDriveImport } from "./hooks/useDriveImport";
import { useWorkspaceBackup } from "./hooks/useWorkspaceBackup";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

/**
 * Orquestrador raiz do workspace.
 *
 * O estado vive nos hooks de `src/hooks/` (notas, pastas, modais, filtros,
 * importações, backup e atalhos globais); este componente apenas os compõe
 * e faz a ligação com a árvore de componentes.
 */
export default function App() {
  // Notas + persistência IndexedDB
  const {
    notes,
    setNotes,
    storageError,
    setStorageError,
    undoAction,
    setUndoAction,
    saveNote,
    togglePin,
    changeColor,
    duplicateNote,
    reorderNotes,
    trashNote,
  } = useNotesState();

  // Pastas + persistência IndexedDB
  const {
    folders,
    selectedFolder,
    setSelectedFolder,
    createFolder,
    deleteFolder,
    assignFolder,
  } = useFolders(setNotes);

  // Modais e painéis
  const modals = useModalManager();

  // Navegação, filtros e listas derivadas
  const filters = useNoteFilters({
    notes,
    folders,
    selectedFolder,
    onClearFolderSelection: () => setSelectedFolder(null),
  });

  // Importações (Drive / Docs / Sheets / Slides / Keep / arquivos locais)
  const driveImport = useDriveImport({
    notes,
    setNotes,
    saveNote,
    openInDocsEditor: modals.openInDocsEditor,
    openInSheetEditor: modals.openInSheetEditor,
  });

  // Backup global do workspace (.json)
  const { exportBackup, importBackup } = useWorkspaceBackup(notes, setNotes, setStorageError);

  // Atalhos globais (Cmd/Ctrl+K e Cmd/Ctrl+B)
  useGlobalShortcuts({
    onToggleCommandPalette: modals.toggleCommandPalette,
    onToggleCompanion: modals.toggleCompanion,
  });

  // Global Sync timestamp (read-only: última data conhecida, exibida no Header/DrivePicker)
  const [driveSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem("keepdocs_drive_synced_at");
  });

  // Selecionar uma pasta volta para "Todas as Notas" e limpa a tag
  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolder(folderId);
    if (folderId) {
      filters.setFilter("all");
      filters.setSelectedTag(null);
    }
  };

  // Create New Note Router: cria a nota e abre o editor correspondente
  const handleNewNote = (type: "doc" | "form" | "sheet" | "canvas" | "checklist") => {
    if (type === "form") {
      modals.openNewFormModal();
    } else if (type === "sheet") {
      modals.openNewSheetModal();
    } else if (type === "canvas") {
      modals.openNewCanvasModal();
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
      modals.openInDocsEditor(newNote);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#002b36] font-sans text-[#eee8d5] antialiased selection:bg-[#2aa198]/30">
        {/* Top Header */}
        <Header
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          layoutMode={filters.layoutMode}
          setLayoutMode={filters.setLayoutMode}
          onOpenCommandPalette={modals.openCommandPalette}
          onOpenDriveModal={modals.openDriveModal}
          onNewNote={handleNewNote}
          onOpenAIAssistant={modals.openAIAssistant}
          onOpenAnalytics={modals.openAnalyticsModal}
          onToggleMobileSidebar={() => filters.setIsMobileSidebarOpen(!filters.isMobileSidebarOpen)}
          onToggleSidebar={() => filters.setIsSidebarCollapsed(!filters.isSidebarCollapsed)}
          driveSyncedAt={driveSyncedAt}
          onExportBackup={exportBackup}
          onImportBackup={importBackup}
          onToggleCompanion={modals.toggleCompanion}
          isCompanionOpen={modals.showCompanion}
        />

        {/* Main Content Area: Sidebar + Masonry Grid */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentFilter={filters.currentFilter}
            setFilter={filters.setFilterAndClearSelections}
            selectedColor={filters.selectedColor}
            setSelectedColor={filters.setSelectedColor}
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            folderCounts={filters.folderCounts}
            onMoveNoteToFolder={assignFolder}
            onTrashNote={(id) => trashNote(id)}
            isCollapsed={filters.isSidebarCollapsed}
            onToggleCollapse={() => filters.setIsSidebarCollapsed(!filters.isSidebarCollapsed)}
            isMobileOpen={filters.isMobileSidebarOpen}
            onCloseMobile={() => filters.setIsMobileSidebarOpen(false)}
            notesCounts={filters.notesCounts}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            <TagFilterBar
              allTags={filters.allTags}
              selectedTag={filters.selectedTag}
              setSelectedTag={filters.setSelectedTag}
            />
            <MasonryGrid
              notes={filters.filteredNotes}
              layoutMode={filters.layoutMode}
              folders={folders}
              onOpenNote={modals.openNote}
              onTogglePin={togglePin}
              onChangeColor={changeColor}
              onDuplicate={duplicateNote}
              onDelete={trashNote}
              onAssignFolder={assignFolder}
              onNewNote={handleNewNote}
              onReorderNotes={reorderNotes}
            />
          </main>
        </div>

        {/* Workspace Companion in Main Menu View (Docked or Floating Pop-up Window) */}
        {modals.showCompanion && !modals.activeNoteForDocs && (
          <WorkspaceCompanion
            isOpen={modals.showCompanion}
            onClose={modals.closeCompanion}
            mode={modals.companionMode}
            onToggleMode={modals.toggleCompanionMode}
            allNotes={notes}
            onSelectNote={modals.openNote}
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
              saveNote(newNote);
              modals.openInDocsEditor(newNote);
            }}
            onAttachDriveFileToActiveNote={driveImport.addGlobalDriveAttachment}
          />
        )}

        {/* Companion Edge Quick Launcher (When closed) */}
        <CompanionLauncher
          isOpen={modals.showCompanion}
          onToggle={modals.openCompanion}
        />

        {/* Modals Suite */}
        {modals.activeNoteForDocs && (
          <DocsEditorModal
            note={modals.activeNoteForDocs}
            onClose={modals.closeDocsEditor}
            onSaveNote={saveNote}
            allNotes={notes}
            onSelectNote={modals.openNote}
            onNewNote={handleNewNote}
          />
        )}

        {modals.showFormModal && (
          <FormFillerModal
            note={modals.activeFormNote}
            onClose={modals.closeFormModal}
            onSaveAsNote={saveNote}
          />
        )}

        {modals.showSheetModal && (
          <MiniSheetEditor
            note={modals.activeSheetNote}
            onClose={modals.closeSheetModal}
            onSaveAsNote={saveNote}
          />
        )}

        {modals.showCanvasModal && (
          <ImageAnnotatorModal
            note={modals.activeCanvasNote}
            onClose={modals.closeCanvasModal}
            onSaveAsNote={saveNote}
          />
        )}

        {modals.showDriveModal && (
          <DrivePickerModal
            attachments={driveImport.allDriveAttachments}
            notes={notes}
            onAddAttachment={driveImport.addGlobalDriveAttachment}
            onImportDriveNote={driveImport.importDriveNote}
            onImportGoogleDoc={driveImport.importGoogleDoc}
            onImportGoogleSheet={driveImport.importGoogleSheet}
            onImportGoogleSlide={driveImport.importGoogleSlide}
            onImportKeepNotes={driveImport.importKeepNotes}
            onClose={modals.closeDriveModal}
            driveSyncedAt={driveSyncedAt}
          />
        )}

        <CommandPalette
          isOpen={modals.showCommandPalette}
          onClose={modals.closeCommandPalette}
          notes={notes}
          onOpenNote={modals.openNote}
          onNewNote={handleNewNote}
          onOpenDriveModal={modals.openDriveModal}
          onOpenAIAssistant={modals.openAIAssistant}
        />

        <AIAssistantModal
          isOpen={modals.showAIAssistant}
          onClose={modals.closeAIAssistant}
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
            saveNote(newNote);
            modals.openInDocsEditor(newNote);
          }}
        />

        {/* Workspace Analytics & Metrics Dashboard Modal */}
        <WorkspaceAnalyticsModal
          isOpen={modals.showAnalyticsModal}
          onClose={modals.closeAnalyticsModal}
          notes={notes}
          folders={folders}
          onOpenNote={modals.openNote}
        />

        {/* Optimistic UI Undo Toast */}
        <UndoToast
          action={undoAction}
          onDismiss={() => setUndoAction(null)}
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

        {/* Mobile Bottom Ergonomic Navigation Bar */}
        <MobileBottomNav
          currentFilter={filters.currentFilter}
          onSelectFilter={(f) => {
            filters.setFilterAndClearSelections(f);
            filters.setIsMobileSidebarOpen(false);
          }}
          onOpenNewNote={() => handleNewNote("doc")}
          onOpenAnalytics={modals.openAnalyticsModal}
          onToggleSidebar={() => filters.setIsMobileSidebarOpen(!filters.isMobileSidebarOpen)}
          isSidebarOpen={filters.isMobileSidebarOpen}
        />

        {/* Floating Quick Action Button & Popover (Desktop / Tablet) */}
        <div className="hidden md:block">
          <FloatingQuickMenu
            onCreateDoc={() => handleNewNote("doc")}
            onCreateTable={() => handleNewNote("sheet")}
            onCreateForm={() => handleNewNote("form")}
            onOpenCanvas={() => handleNewNote("canvas")}
            onImportDocument={driveImport.importDocument}
            onOpenCommandPalette={modals.openCommandPalette}
          />
        </div>
      </div>
    </DndProvider>
  );
}
