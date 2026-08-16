import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  ClipboardList,
  FileSpreadsheet,
  PenTool,
  Cloud,
  Sparkles,
  Command,
  X,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Note } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onOpenNote: (note: Note) => void;
  onNewNote: (type: "doc" | "form" | "sheet" | "canvas" | "checklist") => void;
  onOpenDriveModal: () => void;
  onOpenAIAssistant: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  notes,
  onOpenNote,
  onNewNote,
  onOpenDriveModal,
  onOpenAIAssistant,
}) => {
  const [query, setQuery] = useState("");

  // Keydown listener for Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#002b36]/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.12)] bg-[#073642] shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[rgba(147,161,161,0.12)] px-4 py-3.5 bg-[#002b36]/40">
          <Search className="h-5 w-5 text-[#2aa198] mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um comando, título ou tag... (Cmd+K)"
            className="w-full bg-transparent text-sm font-medium text-[#eee8d5] outline-none placeholder-[#586e75]"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command Menu Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Create Actions */}
          {!query && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#586e75]">
                Ações Rápidas & Criação
              </div>

              <button
                onClick={() => {
                  onNewNote("doc");
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#2aa198]/15 p-1.5 text-[#2aa198]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-[#eee8d5]">Nova Nota Rica / Google Doc</div>
                    <div className="text-[10px] text-[#93a1a1]">Editor WYSIWYG completo com integração Google Docs</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#586e75]" />
              </button>

              <button
                onClick={() => {
                  onOpenDriveModal();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#268bd2]/15 p-1.5 text-[#268bd2]">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-[#eee8d5]">Explorar & Criar no Google Docs</div>
                    <div className="text-[10px] text-[#93a1a1]">Acesse e crie documentos diretamente no Google Docs</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#586e75]" />
              </button>

              <button
                onClick={() => {
                  onNewNote("sheet");
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#859900]/15 p-1.5 text-[#859900]">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-[#eee8d5]">Tabela / Mini-Sheets</div>
                    <div className="text-[10px] text-[#93a1a1]">Planilha com fórmulas integradas (=SUM, =AVERAGE)</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#586e75]" />
              </button>

              <button
                onClick={() => {
                  onNewNote("form");
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#b58900]/15 p-1.5 text-[#b58900]">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-[#eee8d5]">Formulário Dinâmico Auto-Preenchível</div>
                    <div className="text-[10px] text-[#93a1a1]">Contratos e relatórios com marcadores interativos</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#586e75]" />
              </button>

              <button
                onClick={() => {
                  onNewNote("canvas");
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#6c71c4]/15 p-1.5 text-[#6c71c4]">
                    <PenTool className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-[#eee8d5]">Anotação de Imagem (Canvas Overlay)</div>
                    <div className="text-[10px] text-[#93a1a1]">Desenhe sobre imagens com caneta, formas e texto</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#586e75]" />
              </button>

              <button
                onClick={() => {
                  onOpenAIAssistant();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#2aa198]/15 p-1.5 text-[#2aa198]">
                    <Sparkles className="h-4 w-4 text-[#2aa198]" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-[#eee8d5]">Assistente Gemini AI Brainstorm</div>
                    <div className="text-[10px] text-[#93a1a1]">Gere conteúdo, resumos e ideias com IA</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#586e75]" />
              </button>
            </div>
          )}

          {/* Search Matching Notes */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#586e75]">
              Notas no Workspace ({filteredNotes.length})
            </div>

            {filteredNotes.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#586e75] italic">
                Nenhuma nota encontrada para "{query}".
              </p>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    onOpenNote(note);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#eee8d5]">{note.title}</span>
                    <span className="text-[10px] text-[#586e75] font-mono">[{note.type}]</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {note.tags.map((t) => (
                      <span key={t} className="rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-1.5 py-0.5 text-[10px] text-[#93a1a1]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 px-4 py-2 text-[11px] text-[#586e75]">
          <span>Use as setas para navegar, Enter para selecionar</span>
          <span className="font-mono">Esc para fechar</span>
        </div>
      </div>
    </div>
  );
};
