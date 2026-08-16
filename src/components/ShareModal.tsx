import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Printer,
  FileCode,
  FileEdit,
  Cloud,
  ExternalLink,
} from "lucide-react";
import { Note } from "../types";
import { NoteExportEngine } from "../services/NoteExportEngine";

interface ShareModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToGoogleDocs?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  note,
  isOpen,
  onClose,
  onSaveToGoogleDocs,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) return null;

  const hasSheetOrTables =
    note.type === "sheet" ||
    (note.sheetData !== undefined && note.sheetData !== null) ||
    (note.tables !== undefined && note.tables.length > 0);

  const hasImageOrCanvas =
    note.type === "canvas" ||
    !!note.imageAnnotation?.base64Image ||
    (note.attachments && note.attachments.some((a) => a.type === "image" || a.url.startsWith("data:image")));

  const handleCopyRichText = async () => {
    const success = await NoteExportEngine.copyFormattedContent(note);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportPDF = () => {
    NoteExportEngine.exportToPDF(note);
    onClose();
  };

  const handleExportMD = () => {
    NoteExportEngine.exportToMarkdown(note);
    onClose();
  };

  const handleExportTXT = () => {
    NoteExportEngine.exportToPlainText(note);
    onClose();
  };

  const handleExportDOCX = () => {
    NoteExportEngine.exportToDocx(note);
    onClose();
  };

  const handleExportCSV = () => {
    NoteExportEngine.exportToCSV(note);
    onClose();
  };

  const handleExportPNG = () => {
    NoteExportEngine.exportToPNG(note);
    onClose();
  };

  const handleExportJSON = () => {
    NoteExportEngine.exportToJSON(note);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl border border-[rgba(147,161,161,0.18)] bg-[#073642] text-[#eee8d5] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar Indicator */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#586e75]/40" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2aa198]/15 text-[#2aa198]">
              <Share2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#eee8d5] truncate">
                Compartilhar & Exportar
              </h3>
              <p className="text-[11px] text-[#93a1a1] truncate max-w-[240px]">
                {note.title || "Nota Sem Título"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] transition-colors"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Options List */}
        <div className="max-h-[75vh] overflow-y-auto p-4 space-y-2">
          {/* Option: Copy Formatted Content */}
          <button
            onClick={handleCopyRichText}
            className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2aa198]/15 text-[#2aa198]">
                {copied ? <Check className="h-4 w-4 text-[#859900]" /> : <Copy className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#eee8d5]">
                  {copied ? "Copiado com sucesso!" : "Copiar Texto Formatado"}
                </div>
                <div className="text-[10px] text-[#93a1a1]">
                  Área de transferência com formatação Rich Text (HTML)
                </div>
              </div>
            </div>
            {copied && (
              <span className="rounded-md bg-[#859900]/20 px-2 py-0.5 text-[10px] font-bold text-[#859900]">
                Copiado!
              </span>
            )}
          </button>

          {/* Option: PDF Export */}
          <button
            onClick={handleExportPDF}
            className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cb4b16]/15 text-[#cb4b16]">
                <Printer className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#eee8d5]">Exportar como PDF</div>
                <div className="text-[10px] text-[#93a1a1]">
                  Visualização limpa pronta para impressão ou PDF A4
                </div>
              </div>
            </div>
            <Download className="h-4 w-4 text-[#586e75] group-hover:text-[#eee8d5] transition-colors" />
          </button>

          {/* Option: DOCX / Word */}
          <button
            onClick={handleExportDOCX}
            className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#268bd2]/15 text-[#268bd2]">
                <FileEdit className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#eee8d5]">Documento Word (.doc / DOCX)</div>
                <div className="text-[10px] text-[#93a1a1]">
                  Compatível com Microsoft Word, Google Docs e Pages
                </div>
              </div>
            </div>
            <Download className="h-4 w-4 text-[#586e75] group-hover:text-[#eee8d5] transition-colors" />
          </button>

          {/* Option: Markdown */}
          <button
            onClick={handleExportMD}
            className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#b58900]/15 text-[#b58900]">
                <FileCode className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#eee8d5]">Markdown (.md)</div>
                <div className="text-[10px] text-[#93a1a1]">
                  Estrutura leve para Obsidian, GitHub e Notion
                </div>
              </div>
            </div>
            <Download className="h-4 w-4 text-[#586e75] group-hover:text-[#eee8d5] transition-colors" />
          </button>

          {/* Option: Plain Text */}
          <button
            onClick={handleExportTXT}
            className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6c71c4]/15 text-[#6c71c4]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#eee8d5]">Texto Puro (.txt)</div>
                <div className="text-[10px] text-[#93a1a1]">
                  Arquivo de texto simples sem formatação
                </div>
              </div>
            </div>
            <Download className="h-4 w-4 text-[#586e75] group-hover:text-[#eee8d5] transition-colors" />
          </button>

          {/* Option: CSV (Conditional - Hidden if incompatible) */}
          {hasSheetOrTables && (
            <button
              onClick={handleExportCSV}
              className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#859900]/15 text-[#859900]">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#eee8d5]">Planilha CSV (.csv)</div>
                  <div className="text-[10px] text-[#93a1a1]">
                    Exportar matriz tabular para Excel e Google Sheets
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-[#586e75] group-hover:text-[#eee8d5] transition-colors" />
            </button>
          )}

          {/* Option: PNG Image (Conditional - Hidden if incompatible) */}
          {hasImageOrCanvas && (
            <button
              onClick={handleExportPNG}
              className="flex w-full items-center justify-between rounded-xl border border-[rgba(147,161,161,0.1)] bg-[#002b36]/70 p-3 text-left transition-all hover:bg-[#0a4553] hover:border-[#2aa198]/30 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d33682]/15 text-[#d33682]">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#eee8d5]">Imagem PNG (.png)</div>
                  <div className="text-[10px] text-[#93a1a1]">
                    Download da imagem do canvas ou anexo visual
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-[#586e75] group-hover:text-[#eee8d5] transition-colors" />
            </button>
          )}

          {/* Option: Google Docs Save (Conditional) */}
          {onSaveToGoogleDocs && (
            <button
              onClick={() => {
                onSaveToGoogleDocs();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#268bd2]/30 bg-[#268bd2]/10 p-3 text-left transition-all hover:bg-[#268bd2]/20 group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#268bd2]/20 text-[#268bd2]">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#268bd2]">Salvar no Google Docs</div>
                  <div className="text-[10px] text-[#93a1a1]">
                    Sincronizar ou exportar nativamente no Google Drive
                  </div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-[#268bd2]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
