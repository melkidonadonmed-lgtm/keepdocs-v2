import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Bold,
  AlignLeft,
  AlignRight,
  Check,
  Calculator,
  Share2,
} from "lucide-react";
import { SheetData, SheetCell, Note } from "../types";
import { evaluateFormula, getColumnLetter } from "../utils/helpers";
import { EditorHeader } from "./EditorHeader";
import { GhostButton } from "./GhostButton";
import { ShareModal } from "./ShareModal";

interface MiniSheetEditorProps {
  note?: Note | null;
  onClose: () => void;
  onSaveAsNote: (note: Note) => void;
}

export const MiniSheetEditor: React.FC<MiniSheetEditorProps> = ({
  note,
  onClose,
  onSaveAsNote,
}) => {
  const [title, setTitle] = useState(note?.title || "Nova Planilha Mini-Sheet");
  const [sheetData, setSheetData] = useState<SheetData>(
    note?.sheetData || {
      rows: 6,
      cols: 5,
      data: {
        A1: { value: "Item / Descrição", bold: true },
        B1: { value: "Valor (R$)", bold: true, align: "right" },
        C1: { value: "Qtd", bold: true, align: "right" },
        D1: { value: "Total", bold: true, align: "right" },

        A2: { value: "Desenvolvimento Web" },
        B2: { value: "1500" },
        C2: { value: "2" },
        D2: { value: "=B2*C2", formula: "=B2*C2", bold: true, align: "right" },

        A3: { value: "Design UI/UX KeepDocs" },
        B3: { value: "800" },
        C3: { value: "3" },
        D3: { value: "=B3*C3", formula: "=B3*C3", bold: true, align: "right" },

        A4: { value: "TOTAL GERAL", bold: true },
        B4: { value: "" },
        C4: { value: "" },
        D4: { value: "=SUM(D2:D3)", formula: "=SUM(D2:D3)", bold: true, align: "right" },
      },
    }
  );

  const [selectedCellKey, setSelectedCellKey] = useState<string>("A1");
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [formulaInputValue, setFormulaInputValue] = useState<string>(
    sheetData.data["A1"]?.formula || sheetData.data["A1"]?.value || ""
  );
  const [showShareModal, setShowShareModal] = useState(false);

  const handleSelectCell = (key: string) => {
    setSelectedCellKey(key);
    const cell = sheetData.data[key];
    setFormulaInputValue(cell?.formula || cell?.value || "");
  };

  const handleCellChange = (key: string, val: string) => {
    const isFormula = val.startsWith("=");
    setSheetData((prev) => {
      const existing = prev.data[key] || {};
      const updatedCell: SheetCell = {
        ...existing,
        value: val,
        formula: isFormula ? val : undefined,
      };
      return {
        ...prev,
        data: {
          ...prev.data,
          [key]: updatedCell,
        },
      };
    });
  };

  const handleToggleCellBold = () => {
    setSheetData((prev) => {
      const cell = prev.data[selectedCellKey] || { value: "" };
      return {
        ...prev,
        data: {
          ...prev.data,
          [selectedCellKey]: { ...cell, bold: !cell.bold },
        },
      };
    });
  };

  const handleCellAlign = (align: "left" | "right") => {
    setSheetData((prev) => {
      const cell = prev.data[selectedCellKey] || { value: "" };
      return {
        ...prev,
        data: {
          ...prev.data,
          [selectedCellKey]: { ...cell, align },
        },
      };
    });
  };

  const handleAddRow = () => {
    setSheetData((prev) => ({ ...prev, rows: prev.rows + 1 }));
  };

  const handleAddCol = () => {
    setSheetData((prev) => ({ ...prev, cols: prev.cols + 1 }));
  };

  const handleSave = () => {
    const newNote: Note = {
      id: note ? note.id : "sheet_note_" + Date.now(),
      title: title || "Planilha Mini-Sheet",
      content: `<p>Planilha com ${sheetData.rows} linhas e ${sheetData.cols} colunas.</p>`,
      type: "sheet",
      color: "green",
      tags: ["Planilha", "Dados"],
      pinned: note ? note.pinned : false,
      archived: false,
      trashed: false,
      createdAt: note ? note.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheetData,
    };
    onSaveAsNote(newNote);
    onClose();
  };

  const currentNoteForShare: Note = {
    id: note ? note.id : "temp_sheet",
    title: title || "Planilha Mini-Sheet",
    content: `<p>Planilha com ${sheetData.rows} linhas e ${sheetData.cols} colunas.</p>`,
    type: "sheet",
    color: "green",
    tags: ["Planilha"],
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sheetData,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#002b36]/80 p-2 backdrop-blur-sm sm:p-6">
      <div className="relative flex h-full max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.12)] bg-[#073642] shadow-2xl">
        {/* Standardized Responsive Editor Header */}
        <EditorHeader
          icon={<FileSpreadsheet className="h-5 w-5 text-[#859900]" />}
          title={title}
          onTitleChange={setTitle}
          isTitleEditable={true}
          subtitle="Suporte a fórmulas: =SUM(A1:A5), =AVERAGE(), =A1+B1, =B2*C2"
          actions={
            <>
              <GhostButton
                variant="ghost"
                onClick={() => setShowShareModal(true)}
                title="Compartilhar e Exportar Planilha (CSV, PDF, etc.)"
              >
                <Share2 className="h-3.5 w-3.5 text-[#268bd2]" />
                <span>Compartilhar</span>
              </GhostButton>

              <GhostButton
                variant="accent"
                onClick={handleSave}
                title="Salvar alterações na nota"
              >
                <Check className="h-4 w-4" />
                <span>Salvar</span>
              </GhostButton>
            </>
          }
          onClose={onClose}
        />

        {/* Share Modal */}
        <ShareModal
          note={currentNoteForShare}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Formula Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#859900] bg-[#859900]/15 px-2.5 py-1 rounded-[8px] border border-[#859900]/30 flex-shrink-0">
            <Calculator className="h-3.5 w-3.5" />
            <span>{selectedCellKey}</span>
          </div>

          <input
            type="text"
            value={formulaInputValue}
            onChange={(e) => {
              setFormulaInputValue(e.target.value);
              handleCellChange(selectedCellKey, e.target.value);
            }}
            placeholder="Digite valor ou fórmula (ex: =SUM(A1:D1))..."
            className="flex-1 min-w-[140px] rounded-[10px] border border-[rgba(147,161,161,0.15)] bg-[#002b36] px-3 py-1 text-xs font-mono text-[#eee8d5] outline-none focus:border-[#2aa198]"
          />

          <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-1 hidden sm:block" />

          {/* Formatting buttons */}
          <div className="flex items-center gap-1">
            <GhostButton
              size="icon"
              onClick={handleToggleCellBold}
              title="Negrito"
              className="h-8 w-8 rounded-[8px]"
            >
              <Bold className="h-3.5 w-3.5" />
            </GhostButton>
            <GhostButton
              size="icon"
              onClick={() => handleCellAlign("left")}
              title="Alinhar Esquerda"
              className="h-8 w-8 rounded-[8px]"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </GhostButton>
            <GhostButton
              size="icon"
              onClick={() => handleCellAlign("right")}
              title="Alinhar Direita"
              className="h-8 w-8 rounded-[8px]"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </GhostButton>
          </div>

          <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-1 hidden sm:block" />

          {/* Add Rows / Cols */}
          <div className="flex items-center gap-1">
            <GhostButton
              onClick={handleAddRow}
              title="Adicionar linha"
              className="h-8 px-2.5 rounded-[8px] bg-[#002b36] border border-[rgba(147,161,161,0.12)] text-[11px]"
            >
              <Plus className="h-3 w-3" />
              <span>+ Linha</span>
            </GhostButton>
            <GhostButton
              onClick={handleAddCol}
              title="Adicionar coluna"
              className="h-8 px-2.5 rounded-[8px] bg-[#002b36] border border-[rgba(147,161,161,0.12)] text-[11px]"
            >
              <Plus className="h-3 w-3" />
              <span>+ Coluna</span>
            </GhostButton>
          </div>
        </div>

        {/* Interactive Spreadsheet Grid with NO column truncation */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-[#002b36]/30">
          <div className="mx-auto max-w-full rounded-xl border border-[rgba(147,161,161,0.15)] bg-[#002b36] shadow-md overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#073642] text-[#93a1a1] font-mono">
                  <th className="w-10 min-w-[40px] border-b border-r border-[rgba(147,161,161,0.15)] px-2 py-1.5 text-center text-[10px]">
                    #
                  </th>
                  {Array.from({ length: sheetData.cols }).map((_, cIdx) => (
                    <th
                      key={cIdx}
                      className="min-w-[110px] border-b border-r border-[rgba(147,161,161,0.15)] px-3 py-1.5 text-center font-bold text-[#eee8d5] text-[11px] whitespace-nowrap"
                    >
                      {getColumnLetter(cIdx)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: sheetData.rows }).map((_, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#073642]/40 transition-colors">
                    {/* Row Index */}
                    <td className="border-b border-r border-[rgba(147,161,161,0.12)] bg-[#073642]/60 text-center font-mono font-bold text-[#586e75] text-[10px]">
                      {rIdx + 1}
                    </td>

                    {/* Cells */}
                    {Array.from({ length: sheetData.cols }).map((_, cIdx) => {
                      const colLetter = getColumnLetter(cIdx);
                      const cellKey = `${colLetter}${rIdx + 1}`;
                      const cell = sheetData.data[cellKey];
                      const isSelected = selectedCellKey === cellKey;
                      const isEditing = editingCellKey === cellKey;
                      const displayValue = cell?.formula
                        ? evaluateFormula(cell.formula, sheetData)
                        : cell?.value || "";

                      return (
                        <td
                          key={cellKey}
                          onClick={() => handleSelectCell(cellKey)}
                          className={`relative min-w-[110px] border-b border-r border-[rgba(147,161,161,0.1)] p-0 text-[#eee8d5] ${
                            isSelected ? "ring-2 ring-[#2aa198] z-10 bg-[#073642]" : ""
                          }`}
                        >
                          {cell?.formula && !isEditing && (
                            <span
                              className="pointer-events-none absolute right-1.5 top-1 z-10 text-[9px] font-mono font-bold text-[#859900]"
                              title={`Fórmula: ${cell.formula}`}
                            >
                              fx
                            </span>
                          )}
                          <input
                            type="text"
                            value={isEditing ? cell?.formula || cell?.value || "" : displayValue}
                            onFocus={() => setEditingCellKey(cellKey)}
                            onBlur={() => setEditingCellKey(null)}
                            onChange={(e) => handleCellChange(cellKey, e.target.value)}
                            title={cell?.formula ? `Fórmula: ${cell.formula}` : undefined}
                            className={`w-full bg-transparent px-3 py-2 outline-none text-xs font-mono tabular-nums ${
                              cell?.bold ? "font-bold text-[#2aa198]" : "text-[#eee8d5]"
                            } ${cell?.align === "right" ? "text-right" : "text-left"} ${
                              cell?.formula ? "pr-6 text-[#859900]" : ""
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#002b36]/40 px-4 py-2.5 sm:px-6 text-[11px] text-[#586e75]">
          <span>Planilha com recálculo automático em tempo real</span>
          <span>{sheetData.rows} linhas × {sheetData.cols} colunas</span>
        </div>
      </div>
    </div>
  );
};
