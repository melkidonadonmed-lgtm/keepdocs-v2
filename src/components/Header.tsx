import React from "react";
import {
  Search,
  Command,
  LayoutGrid,
  Grid3X3,
  List,
  Cloud,
  Plus,
  Sparkles,
  FileText,
  FileSpreadsheet,
  PenTool,
  ClipboardList,
  CheckSquare,
  Menu,
  PanelLeft,
  DatabaseBackup,
  Upload,
  MoreVertical,
  X,
  BarChart3,
} from "lucide-react";
import { LayoutMode } from "../types";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  onOpenCommandPalette: () => void;
  onOpenDriveModal: () => void;
  onNewNote: (type: "doc" | "form" | "sheet" | "canvas" | "checklist") => void;
  onOpenAIAssistant: () => void;
  onOpenAnalytics?: () => void;
  onToggleMobileSidebar: () => void;
  onToggleSidebar: () => void;
  driveSyncedAt: string | null;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onToggleCompanion?: () => void;
  isCompanionOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  layoutMode,
  setLayoutMode,
  onOpenCommandPalette,
  onOpenDriveModal,
  onNewNote,
  onOpenAIAssistant,
  onOpenAnalytics,
  onToggleMobileSidebar,
  onToggleSidebar,
  driveSyncedAt,
  onExportBackup,
  onImportBackup,
  onToggleCompanion,
  isCompanionOpen,
}) => {
  const [showNewDropdown, setShowNewDropdown] = React.useState(false);
  const [showMobileOverflow, setShowMobileOverflow] = React.useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/90 px-3 py-2.5 backdrop-blur-md sm:px-6">
      {/* Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMobileSidebar}
          className="btn-ghost flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          title="Abrir Menu de Navegação"
          aria-label="Abrir Menu de Navegação"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop & Tablet Sidebar Collapse Toggle */}
        <button
          onClick={onToggleSidebar}
          className="btn-ghost hidden h-9 w-9 items-center justify-center rounded-lg md:flex"
          title="Recolher / expandir menu lateral"
          aria-label="Recolher menu lateral"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2aa198] text-[#002b36] shadow-sm">
            <span className="text-xs font-bold tracking-tight">K</span>
          </div>
          <div className="hidden min-[400px]:block">
            <h1 className="text-sm font-medium tracking-tight text-[#eee8d5]">
              KeepDocs
            </h1>
          </div>
        </div>
      </div>

      {/* Global Search Bar - Desktop & Tablet */}
      <div className="hidden md:flex relative mx-4 max-w-md flex-1">
        <div className="relative flex w-full items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-[#586e75]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar notas, planilhas, forms... (Cmd+K)"
            className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] py-1.5 pl-8 pr-12 text-xs text-[#eee8d5] placeholder-[#586e75] outline-none transition-all focus:border-[#2aa198] focus:bg-[#073642]"
          />
          <button
            onClick={onOpenCommandPalette}
            className="absolute right-2 flex items-center gap-0.5 rounded border border-[rgba(147,161,161,0.2)] bg-[#002b36] px-1.5 py-0.5 text-[10px] font-medium text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] transition-colors"
            title="Abrir Command Palette (Cmd+K)"
          >
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay / Toggle */}
      {isMobileSearchOpen ? (
        <div className="absolute inset-x-2 top-2 z-40 flex items-center gap-2 rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#073642] p-1.5 shadow-2xl md:hidden">
          <Search className="ml-2 h-4 w-4 text-[#586e75]" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar notas..."
            className="flex-1 bg-transparent text-xs text-[#eee8d5] placeholder-[#586e75] outline-none"
          />
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex md:hidden items-center ml-auto mr-1">
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="btn-ghost flex h-10 w-10 items-center justify-center rounded-lg"
            title="Pesquisar"
            aria-label="Pesquisar"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-1.5">
        {/* Layout Mode Switcher (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center rounded-lg border border-[rgba(147,161,161,0.12)] bg-[#073642] p-0.5 text-[#93a1a1]">
          <button
            onClick={() => setLayoutMode("masonry")}
            className={`rounded-md p-1.5 transition-colors ${
              layoutMode === "masonry"
                ? "bg-[#0a4553] text-[#eee8d5]"
                : "hover:text-[#eee8d5]"
            }`}
            title="Mosaico Keep (Masonry)"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${
              layoutMode === "grid"
                ? "bg-[#0a4553] text-[#eee8d5]"
                : "hover:text-[#eee8d5]"
            }`}
            title="Grade Uniforme"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode("list")}
            className={`rounded-md p-1.5 transition-colors ${
              layoutMode === "list"
                ? "bg-[#0a4553] text-[#eee8d5]"
                : "hover:text-[#eee8d5]"
            }`}
            title="Lista Docs"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Workspace Companion & Drive Button */}
        {onToggleCompanion && (
          <button
            onClick={onToggleCompanion}
            className={`btn-ghost flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isCompanionOpen
                ? "bg-[#2aa198]/20 text-[#2aa198] border border-[#2aa198]/40"
                : "text-[#eee8d5]"
            }`}
            title="Abrir Workspace Companion & Google Drive (Ctrl+B)"
          >
            <Cloud className="h-3.5 w-3.5 text-[#2aa198]" />
            <span className="hidden sm:inline">Companion</span>
            <span className="hidden md:inline text-[9px] font-mono text-[#586e75] bg-[#002b36] px-1 rounded">⌘B</span>
          </button>
        )}

        {/* Analytics & Metrics Dashboard (Desktop / Tablet) */}
        {onOpenAnalytics && (
          <button
            onClick={onOpenAnalytics}
            className="btn-ghost hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#2aa198]"
            title="Dashboard de Métricas e Análises"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Métricas</span>
          </button>
        )}

        {/* AI Assistant Button (Desktop / Tablet) */}
        <button
          onClick={onOpenAIAssistant}
          className="btn-ghost hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          title="Assistente Gemini AI"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#2aa198]" />
          <span>Gemini AI</span>
        </button>

        {/* Google Drive Status & Connector (Desktop / Tablet) */}
        <button
          onClick={onOpenDriveModal}
          className="btn-ghost hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          title="Conectar e Sincronizar Google Drive"
        >
          <Cloud className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Drive</span>
          {driveSyncedAt && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#2aa198]" title="Sincronizado com Google Drive" />
          )}
        </button>

        {/* Workspace Backup (Desktop only) */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={onExportBackup}
            className="btn-ghost flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium"
            title="Exportar backup (.json)"
          >
            <DatabaseBackup className="h-3.5 w-3.5" />
            <span>Backup</span>
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="btn-ghost flex items-center rounded-lg p-1.5 text-xs font-medium"
            title="Restaurar backup (.json)"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile Overflow Menu (⋯) */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowMobileOverflow(!showMobileOverflow)}
            className="btn-ghost flex h-10 w-10 items-center justify-center rounded-lg"
            title="Mais opções"
            aria-label="Mais opções"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMobileOverflow && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMobileOverflow(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] p-1.5 shadow-2xl">
                {onOpenAnalytics && (
                  <button
                    onClick={() => {
                      onOpenAnalytics();
                      setShowMobileOverflow(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#2aa198] hover:bg-[#0a4553]"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard de Métricas</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onOpenAIAssistant();
                    setShowMobileOverflow(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553]"
                >
                  <Sparkles className="h-4 w-4 text-[#2aa198]" />
                  <span>Gemini AI</span>
                </button>
                <button
                  onClick={() => {
                    onOpenDriveModal();
                    setShowMobileOverflow(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553]"
                >
                  <Cloud className="h-4 w-4 text-[#2aa198]" />
                  <span>Google Drive</span>
                </button>
                <button
                  onClick={() => {
                    onExportBackup();
                    setShowMobileOverflow(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553]"
                >
                  <DatabaseBackup className="h-4 w-4 text-[#93a1a1]" />
                  <span>Exportar Backup</span>
                </button>
                <button
                  onClick={() => {
                    importInputRef.current?.click();
                    setShowMobileOverflow(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553]"
                >
                  <Upload className="h-4 w-4 text-[#93a1a1]" />
                  <span>Restaurar Backup</span>
                </button>

                <div className="my-1 border-t border-[rgba(147,161,161,0.12)]" />

                {/* Mobile Layout Switcher in Overflow */}
                <div className="flex items-center justify-around px-2 py-1">
                  <button
                    onClick={() => {
                      setLayoutMode("masonry");
                      setShowMobileOverflow(false);
                    }}
                    className={`rounded-lg p-2 ${layoutMode === "masonry" ? "bg-[#0a4553] text-[#eee8d5]" : "text-[#93a1a1]"}`}
                    title="Mosaico"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setLayoutMode("grid");
                      setShowMobileOverflow(false);
                    }}
                    className={`rounded-lg p-2 ${layoutMode === "grid" ? "bg-[#0a4553] text-[#eee8d5]" : "text-[#93a1a1]"}`}
                    title="Grade"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setLayoutMode("list");
                      setShowMobileOverflow(false);
                    }}
                    className={`rounded-lg p-2 ${layoutMode === "list" ? "bg-[#0a4553] text-[#eee8d5]" : "text-[#93a1a1]"}`}
                    title="Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Hidden backup input */}
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportBackup(file);
            e.target.value = "";
          }}
        />

        {/* Primary CTA: "Criar" Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowNewDropdown(!showNewDropdown)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#2aa198] px-3.5 text-xs font-medium text-[#002b36] shadow-sm transition-all hover:brightness-105 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Criar</span>
          </button>

          {showNewDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNewDropdown(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-[rgba(147,161,161,0.12)] border-t-[rgba(238,232,213,0.08)] bg-[#073642] p-1.5 shadow-2xl">
                <button
                  onClick={() => {
                    onNewNote("doc");
                    setShowNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002b36] text-[#2aa198]">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#eee8d5]">Nota Rica (Doc)</div>
                    <div className="text-[10px] text-[#93a1a1]">Editor completo estilo Google Docs</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNewNote("form");
                    setShowNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002b36] text-[#2aa198]">
                    <ClipboardList className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#eee8d5]">Formulário Inteligente</div>
                    <div className="text-[10px] text-[#93a1a1]">Template com auto-preenchimento</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNewNote("sheet");
                    setShowNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002b36] text-[#2aa198]">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#eee8d5]">Mini-Sheet (Planilha)</div>
                    <div className="text-[10px] text-[#93a1a1]">Grade interativa com fórmulas</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNewNote("checklist");
                    setShowNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002b36] text-[#2aa198]">
                    <CheckSquare className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#eee8d5]">Checklist de Tarefas</div>
                    <div className="text-[10px] text-[#93a1a1]">Lista de tarefas e afazeres</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNewNote("canvas");
                    setShowNewDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002b36] text-[#2aa198]">
                    <PenTool className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-medium text-[#eee8d5]">Canvas & Desenho</div>
                    <div className="text-[10px] text-[#93a1a1]">Desenhe com canetas e camadas</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
