import React, { useState } from "react";
import {
  FileText,
  Table,
  ClipboardList,
  Image as ImageIcon,
  Upload,
  Plus,
  Command,
  CheckSquare,
} from "lucide-react";

interface FloatingQuickMenuProps {
  onCreateDoc: () => void;
  onCreateTable: () => void;
  onCreateForm: () => void;
  onOpenCanvas: () => void;
  onImportDocument: (file: File) => void;
  onOpenCommandPalette: () => void;
}

export const FloatingQuickMenu: React.FC<FloatingQuickMenuProps> = ({
  onCreateDoc,
  onCreateTable,
  onCreateForm,
  onOpenCanvas,
  onImportDocument,
  onOpenCommandPalette,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportDocument(e.target.files[0]);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Floating Popover Options Menu */}
      {isOpen && (
        <div className="w-72 overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.18)] bg-[#101e26] p-2 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[#586e75]">
            <span>Criar Nova Nota</span>
            <kbd
              onClick={() => {
                onOpenCommandPalette();
                setIsOpen(false);
              }}
              className="flex cursor-pointer items-center gap-0.5 rounded bg-[#081419] px-1.5 py-0.5 text-[10px] text-[#93a1a1] font-mono hover:text-[#eee8d5]"
            >
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>

          <button
            onClick={() => {
              onCreateDoc();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-[#eee8d5] transition-colors hover:bg-[#182730]"
          >
            <span className="rounded-lg bg-[#b58900]/15 p-1.5 text-[#b58900]">
              <FileText className="h-4 w-4" />
            </span>
            <div className="text-left">
              <div className="font-medium text-[#eee8d5]">Documento Rico (Docs)</div>
              <div className="text-[10px] text-[#93a1a1]">Editor completo com formatação</div>
            </div>
          </button>

          <button
            onClick={() => {
              onCreateTable();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-[#eee8d5] transition-colors hover:bg-[#182730]"
          >
            <span className="rounded-lg bg-[#859900]/15 p-1.5 text-[#859900]">
              <Table className="h-4 w-4" />
            </span>
            <div className="text-left">
              <div className="font-medium text-[#eee8d5]">Planilha (Sheets)</div>
              <div className="text-[10px] text-[#93a1a1]">Mini-tabela interativa com fórmulas</div>
            </div>
          </button>

          <button
            onClick={() => {
              onCreateForm();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-[#eee8d5] transition-colors hover:bg-[#182730]"
          >
            <span className="rounded-lg bg-[#268bd2]/15 p-1.5 text-[#268bd2]">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div className="text-left">
              <div className="font-medium text-[#eee8d5]">Formulário Dinâmico</div>
              <div className="text-[10px] text-[#93a1a1]">Modelo auto-preenchível com IA</div>
            </div>
          </button>
          <button
            onClick={() => {
              onOpenCanvas();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-[#eee8d5] transition-colors hover:bg-[#182730]"
          >
            <span className="rounded-lg bg-[#6c71c4]/15 p-1.5 text-[#6c71c4]">
              <ImageIcon className="h-4 w-4" />
            </span>
            <div className="text-left">
              <div className="font-medium text-[#eee8d5]">Canvas Vetorial</div>
              <div className="text-[10px] text-[#93a1a1]">Anotações livres sobre imagem</div>
            </div>
          </button>

          <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs text-[#eee8d5] transition-colors hover:bg-[#182730]">
            <span className="rounded-lg bg-[#2aa198]/15 p-1.5 text-[#2aa198]">
              <Upload className="h-4 w-4" />
            </span>
            <div className="text-left">
              <div className="font-medium text-[#eee8d5]">Importar Arquivo</div>
              <div className="text-[10px] text-[#93a1a1]">Suporta CSV, TXT, MD e JSON</div>
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv,.txt,.md,.json,.xlsx"
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Main Teal Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2aa198] text-[#002b36] shadow-xl shadow-[#2aa198]/25 transition-all duration-200 hover:brightness-105 hover:scale-105 active:scale-95 focus:outline-none"
        aria-label="Abrir Menu de Ações Rápidas"
      >
        <Plus className={`h-6 w-6 stroke-[2.5] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
      </button>
    </div>
  );
};
