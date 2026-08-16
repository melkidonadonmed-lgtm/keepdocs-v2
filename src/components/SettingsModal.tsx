import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  RotateCcw,
  Sparkles,
  Check,
  Copy,
  Download,
  Upload,
  Eye,
  Sliders,
  Layers,
  FileText,
  Pin,
  CheckSquare,
  FileSpreadsheet,
  PenTool,
  Info,
} from "lucide-react";
import { NoteColor } from "../types";
import {
  COLOR_CATEGORIES,
  DEFAULT_NOTE_COLORS,
  COLOR_PALETTE_PRESETS,
  CustomizableNoteColor,
  isValidHex,
  normalizeHex,
  saveCustomColorPalette,
  resetSingleColor,
  resetAllColors,
  exportPaletteToJson,
  importPaletteFromJson,
  getPerceivedBrightness,
} from "../services/colorPaletteService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColors: Record<CustomizableNoteColor, string>;
  onColorsChange: (newColors: Record<CustomizableNoteColor, string>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentColors,
  onColorsChange,
}) => {
  const [activeTab, setActiveTab] = useState<"colors" | "presets" | "backup">("colors");
  const [localColors, setLocalColors] = useState<Record<CustomizableNoteColor, string>>(currentColors);
  const [inputHexValues, setInputHexValues] = useState<Record<CustomizableNoteColor, string>>(() => {
    const initial: Record<CustomizableNoteColor, string> = { ...currentColors };
    return initial;
  });
  const [selectedPreviewColor, setSelectedPreviewColor] = useState<CustomizableNoteColor>("teal");
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  // Sync state when props change or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalColors(currentColors);
      setInputHexValues(currentColors);
      setImportError(null);
      setCopySuccess(false);
    }
  }, [isOpen, currentColors]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle color change (from picker or typed input)
  const handleColorUpdate = (key: CustomizableNoteColor, hexValue: string) => {
    setInputHexValues((prev) => ({ ...prev, [key]: hexValue }));

    if (isValidHex(hexValue)) {
      const normalized = normalizeHex(hexValue, DEFAULT_NOTE_COLORS[key]);
      const updated = { ...localColors, [key]: normalized };
      setLocalColors(updated);
      saveCustomColorPalette(updated);
      onColorsChange(updated);
      setAppliedPresetId(null);
    }
  };

  // Reset a specific color
  const handleResetSingle = (key: CustomizableNoteColor) => {
    const updated = resetSingleColor(key, localColors);
    setLocalColors(updated);
    setInputHexValues((prev) => ({ ...prev, [key]: DEFAULT_NOTE_COLORS[key] }));
    onColorsChange(updated);
    setAppliedPresetId(null);
  };

  // Reset all to default
  const handleResetAll = () => {
    const updated = resetAllColors();
    setLocalColors(updated);
    setInputHexValues(updated);
    onColorsChange(updated);
    setAppliedPresetId("solarized_dark");
  };

  // Apply a preset
  const handleApplyPreset = (presetId: string) => {
    const preset = COLOR_PALETTE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const updated = { ...preset.colors };
    setLocalColors(updated);
    setInputHexValues(updated);
    saveCustomColorPalette(updated);
    onColorsChange(updated);
    setAppliedPresetId(presetId);
  };

  // Export JSON
  const handleCopyJson = () => {
    const json = exportPaletteToJson(localColors);
    navigator.clipboard.writeText(json);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const json = exportPaletteToJson(localColors);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keepdocs-color-palette-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportSubmit = () => {
    try {
      if (!jsonInput.trim()) {
        setImportError("Cole o conteúdo JSON da paleta antes de importar.");
        return;
      }
      const imported = importPaletteFromJson(jsonInput);
      setLocalColors(imported);
      setInputHexValues(imported);
      onColorsChange(imported);
      setImportError(null);
      setJsonInput("");
      setActiveTab("colors");
    } catch (err: any) {
      setImportError("JSON inválido. Certifique-se de usar o formato gerado pelo KeepDocs.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importPaletteFromJson(text);
        setLocalColors(imported);
        setInputHexValues(imported);
        onColorsChange(imported);
        setImportError(null);
        setActiveTab("colors");
      } catch (err) {
        setImportError("Falha ao ler o arquivo JSON. Formato incompatível.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#002b36]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.18)] border-t-[rgba(238,232,213,0.12)] bg-[#073642] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/90 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2aa198]/20 text-[#2aa198] border border-[#2aa198]/30">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#eee8d5] flex items-center gap-2">
                <span>Personalizador de Paleta de Cores</span>
                <span className="text-[11px] font-mono font-normal text-[#2aa198] bg-[#002b36] px-2 py-0.5 rounded-full border border-[#2aa198]/25">
                  CSS Dinâmico
                </span>
              </h2>
              <p className="text-xs text-[#93a1a1]">
                Altere os códigos HEX das categorias <code className="text-[#2aa198] font-mono">NoteColor</code> e atualize as variáveis CSS em tempo real.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg text-[#93a1a1] hover:text-[#eee8d5]"
            title="Fechar (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] bg-[#01303c]/60 px-5 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("colors")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "colors"
                  ? "bg-[#0a4553] text-[#eee8d5] shadow-xs"
                  : "text-[#93a1a1] hover:bg-[#0a4553]/50 hover:text-[#eee8d5]"
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-[#2aa198]" />
              <span>Categorias ({COLOR_CATEGORIES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "presets"
                  ? "bg-[#0a4553] text-[#eee8d5] shadow-xs"
                  : "text-[#93a1a1] hover:bg-[#0a4553]/50 hover:text-[#eee8d5]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#b58900]" />
              <span>Predefinições ({COLOR_PALETTE_PRESETS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("backup")}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "backup"
                  ? "bg-[#0a4553] text-[#eee8d5] shadow-xs"
                  : "text-[#93a1a1] hover:bg-[#0a4553]/50 hover:text-[#eee8d5]"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[#268bd2]" />
              <span>Importar / Exportar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="btn-ghost flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[#dc322f] hover:bg-[#dc322f]/15"
              title="Restaurar todas as 9 cores para o padrão Solarized"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restaurar Padrões</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: INDIVIDUAL COLOR CUSTOMIZATION */}
          {activeTab === "colors" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-[#002b36]/60 border border-[rgba(147,161,161,0.12)] p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-[#93a1a1]">
                  <Info className="h-4 w-4 text-[#2aa198] shrink-0" />
                  <span>
                    Qualquer alteração feita abaixo é aplicada <strong>imediatamente às variáveis CSS</strong> do documento (<code>--dot-*</code>, <code>--color-note-*</code>), refletindo em todas as notas, filtros e seletores.
                  </span>
                </div>
              </div>

              {/* Color Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {COLOR_CATEGORIES.map((cat) => {
                  const currentColor = localColors[cat.key] || cat.defaultHex;
                  const currentInputValue = inputHexValues[cat.key] ?? currentColor;
                  const isModified = normalizeHex(currentColor) !== normalizeHex(cat.defaultHex);
                  const isInputValid = isValidHex(currentInputValue);
                  const brightness = getPerceivedBrightness(currentColor);
                  const isSelectedForPreview = selectedPreviewColor === cat.key;

                  return (
                    <div
                      key={cat.key}
                      onClick={() => setSelectedPreviewColor(cat.key)}
                      className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                        isSelectedForPreview
                          ? "border-[#2aa198] bg-[#0a4553]/70 ring-1 ring-[#2aa198]/50 shadow-md"
                          : "border-[rgba(147,161,161,0.12)] bg-[#002b36]/50 hover:border-[rgba(147,161,161,0.25)] hover:bg-[#002b36]/80"
                      }`}
                    >
                      {/* Top row: Label, NoteColor key, and reset */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/20 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: currentColor }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#eee8d5] truncate">
                              {cat.label}
                            </div>
                            <div className="text-[10px] font-mono text-[#586e75]">
                              type: <span className="text-[#2aa198] font-bold">"{cat.key}"</span>
                            </div>
                          </div>
                        </div>

                        {isModified && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetSingle(cat.key);
                            }}
                            className="btn-ghost flex h-6 items-center gap-1 rounded px-1.5 text-[10px] text-[#93a1a1] hover:text-[#dc322f] hover:bg-[#dc322f]/10"
                            title={`Restaurar para ${cat.defaultHex}`}
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                            <span>Padrão</span>
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-[#93a1a1] mb-3 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>

                      {/* Color Controls: Interactive Picker Swatch + Hex Input */}
                      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[rgba(147,161,161,0.08)]">
                        {/* Native Color Picker Styled Button */}
                        <label
                          className="relative flex h-8 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/30 shadow-inner overflow-hidden transition-transform hover:scale-105"
                          style={{ backgroundColor: currentColor }}
                          title="Clique para abrir o seletor visual de cores"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="color"
                            value={normalizeHex(currentColor)}
                            onChange={(e) => handleColorUpdate(cat.key, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <span
                            className={`text-[9px] font-bold select-none ${
                              brightness > 130 ? "text-black/80" : "text-white/90"
                            }`}
                          >
                            🎨
                          </span>
                        </label>

                        {/* Hex Code Input */}
                        <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            maxLength={7}
                            value={currentInputValue}
                            onChange={(e) => handleColorUpdate(cat.key, e.target.value)}
                            placeholder={cat.defaultHex}
                            className={`w-full rounded-lg border bg-[#073642] px-2.5 py-1.5 text-xs font-mono text-[#eee8d5] outline-none transition-colors ${
                              isInputValid
                                ? "border-[rgba(147,161,161,0.2)] focus:border-[#2aa198]"
                                : "border-[#dc322f] text-[#dc322f] focus:border-[#dc322f]"
                            }`}
                          />
                          {!isInputValid && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#dc322f]">
                              Inválido
                            </span>
                          )}
                        </div>

                        {/* CSS Variable Name Badge */}
                        <div
                          className="hidden xl:block text-[9px] font-mono text-[#586e75] bg-[#002b36] px-1.5 py-1 rounded truncate max-w-[85px]"
                          title={cat.cssVariable}
                        >
                          {cat.cssVariable}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Preview of Note Cards */}
              <div className="mt-6 border-t border-[rgba(147,161,161,0.12)] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#2aa198]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#eee8d5]">
                      Visualização ao Vivo das Notas com Variáveis CSS
                    </span>
                  </div>
                  <span className="text-[11px] text-[#93a1a1]">
                    Selecione uma cor acima para inspecionar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* Card 1: Sample Doc Note with Active Selected Color */}
                  <div
                    className="solarized-card relative flex flex-col justify-between p-4 transition-all duration-200"
                    style={{
                      borderTopColor: localColors[selectedPreviewColor],
                      borderTopWidth: "2px",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 rounded-lg bg-[#002b36] p-1.5 text-[#93a1a1]">
                          <FileText className="h-3.5 w-3.5 text-[#2aa198]" />
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full shadow-xs ring-1 ring-white/20 shrink-0"
                          style={{ backgroundColor: localColors[selectedPreviewColor] }}
                        />
                        <h4 className="card-title text-xs font-semibold truncate flex-1 text-[#eee8d5]">
                          Nota de Exemplo ({COLOR_CATEGORIES.find((c) => c.key === selectedPreviewColor)?.label})
                        </h4>
                      </div>
                      <p className="text-xs text-[#93a1a1] line-clamp-2 mb-3">
                        As variáveis CSS deste elemento estão sincronizadas dinamicamente com seu código HEX personalizado.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(147,161,161,0.1)] text-[10px] text-[#586e75]">
                      <span className="font-mono">{localColors[selectedPreviewColor]}</span>
                      <span
                        className="rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px]"
                        style={{
                          backgroundColor: `${localColors[selectedPreviewColor]}25`,
                          color: localColors[selectedPreviewColor],
                        }}
                      >
                        {selectedPreviewColor}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Sample Checklist */}
                  <div
                    className="solarized-card relative flex flex-col justify-between p-4 transition-all duration-200"
                    style={{
                      borderTopColor: localColors.green,
                      borderTopWidth: "2px",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 rounded-lg bg-[#002b36] p-1.5 text-[#93a1a1]">
                          <CheckSquare className="h-3.5 w-3.5 text-[#859900]" />
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full shadow-xs ring-1 ring-white/20 shrink-0"
                          style={{ backgroundColor: localColors.green }}
                        />
                        <h4 className="card-title text-xs font-semibold truncate flex-1 text-[#eee8d5]">
                          Tarefas & Checklist
                        </h4>
                      </div>
                      <div className="space-y-1 text-xs text-[#93a1a1]">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-[#859900]" />
                          <span className="line-through text-[#586e75]">CSS Dinâmico Ativado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-xs border border-[#859900]" />
                          <span>Testar paleta nos filtros</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(147,161,161,0.1)] text-[10px] text-[#586e75]">
                      <span className="font-mono">{localColors.green}</span>
                      <span
                        className="rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px]"
                        style={{
                          backgroundColor: `${localColors.green}25`,
                          color: localColors.green,
                        }}
                      >
                        green
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Sample Sheet */}
                  <div
                    className="solarized-card relative flex flex-col justify-between p-4 transition-all duration-200"
                    style={{
                      borderTopColor: localColors.amber,
                      borderTopWidth: "2px",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 rounded-lg bg-[#002b36] p-1.5 text-[#93a1a1]">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-[#cb4b16]" />
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full shadow-xs ring-1 ring-white/20 shrink-0"
                          style={{ backgroundColor: localColors.amber }}
                        />
                        <h4 className="card-title text-xs font-semibold truncate flex-1 text-[#eee8d5]">
                          Planilha Financeira
                        </h4>
                      </div>
                      <p className="text-xs text-[#93a1a1] line-clamp-2 mb-3">
                        Tabelas com fórmulas <code className="text-[#eee8d5] font-mono">=SUM(A1:A5)</code> e etiquetas coloridas.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(147,161,161,0.1)] text-[10px] text-[#586e75]">
                      <span className="font-mono">{localColors.amber}</span>
                      <span
                        className="rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px]"
                        style={{
                          backgroundColor: `${localColors.amber}25`,
                          color: localColors.amber,
                        }}
                      >
                        amber
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="text-xs text-[#93a1a1] bg-[#002b36]/60 border border-[rgba(147,161,161,0.12)] p-3.5 rounded-xl">
                Escolha uma predefinição curada para aplicar instantaneamente a todas as 9 categorias de cores das notas. Você pode continuar customizando valores individuais depois!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COLOR_PALETTE_PRESETS.map((preset) => {
                  const isCurrent = appliedPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                        isCurrent
                          ? "border-[#2aa198] bg-[#0a4553]/80 ring-1 ring-[#2aa198]"
                          : "border-[rgba(147,161,161,0.12)] bg-[#002b36]/50 hover:border-[rgba(147,161,161,0.25)] hover:bg-[#002b36]/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="text-sm font-semibold text-[#eee8d5]">{preset.name}</h3>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#2aa198] bg-[#2aa198]/20 px-2 py-0.5 rounded-full border border-[#2aa198]/30">
                              <Check className="h-3 w-3" /> Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#93a1a1] mb-3.5 leading-relaxed">
                          {preset.description}
                        </p>

                        {/* Swatches Bar */}
                        <div className="flex items-center gap-1.5 mb-4 p-1.5 rounded-lg bg-[#073642] border border-[rgba(147,161,161,0.1)]">
                          {COLOR_CATEGORIES.map((cat) => (
                            <span
                              key={cat.key}
                              className="h-5 flex-1 rounded-sm shadow-inner transition-transform hover:scale-110"
                              style={{ backgroundColor: preset.colors[cat.key] }}
                              title={`${cat.label}: ${preset.colors[cat.key]}`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                          isCurrent
                            ? "bg-[#2aa198] text-[#002b36] shadow-sm"
                            : "btn-ghost border border-[rgba(147,161,161,0.2)] bg-[#073642] text-[#eee8d5] hover:bg-[#0a4553]"
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isCurrent ? "Paleta em Uso" : "Aplicar Esta Paleta"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP / JSON IMPORT & EXPORT */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              {/* Export Section */}
              <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[#eee8d5] uppercase tracking-wider">
                      Exportar Configuração da Paleta
                    </h3>
                    <p className="text-xs text-[#93a1a1]">
                      Copie o JSON ou baixe o arquivo para transferir para outros navegadores ou workspaces.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="btn-ghost flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#073642] text-[#eee8d5] hover:bg-[#0a4553]"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#859900]" />
                          <span className="text-[#859900]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar JSON</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="btn-ghost flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#073642] text-[#eee8d5] hover:bg-[#0a4553]"
                    >
                      <Download className="h-3.5 w-3.5 text-[#2aa198]" />
                      <span>Baixar (.json)</span>
                    </button>
                  </div>
                </div>

                <pre className="rounded-lg bg-[#073642] p-3 text-[11px] font-mono text-[#93a1a1] overflow-x-auto max-h-40 border border-[rgba(147,161,161,0.1)]">
                  {exportPaletteToJson(localColors)}
                </pre>
              </div>

              {/* Import Section */}
              <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[#eee8d5] uppercase tracking-wider">
                      Importar Paleta JSON
                    </h3>
                    <p className="text-xs text-[#93a1a1]">
                      Cole o JSON de configuração ou carregue um arquivo baixado anteriormente.
                    </p>
                  </div>
                  <label className="btn-ghost flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#073642] text-[#eee8d5] hover:bg-[#0a4553] cursor-pointer">
                    <Upload className="h-3.5 w-3.5 text-[#268bd2]" />
                    <span>Carregar Arquivo</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {importError && (
                  <div className="rounded-lg bg-[#dc322f]/15 border border-[#dc322f]/30 p-2.5 text-xs text-[#dc322f]">
                    {importError}
                  </div>
                )}

                <textarea
                  rows={4}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`Cole o JSON aqui, por exemplo:\n{\n  "yellow": "#b58900",\n  "green": "#859900",\n  "teal": "#2aa198"\n}`}
                  className="w-full rounded-lg border border-[rgba(147,161,161,0.15)] bg-[#073642] p-2.5 text-xs font-mono text-[#eee8d5] placeholder-[#586e75] outline-none focus:border-[#2aa198]"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleImportSubmit}
                    disabled={!jsonInput.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2aa198] px-4 py-2 text-xs font-semibold text-[#002b36] hover:brightness-105 disabled:opacity-40 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Aplicar JSON Importado</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#002b36]/90 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-[#586e75]">
            <span className="h-2 w-2 rounded-full bg-[#2aa198] animate-pulse" />
            <span>Persistido automaticamente no navegador</span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-[#2aa198] px-5 py-2 text-xs font-semibold text-[#002b36] shadow-sm hover:brightness-105 active:scale-95 transition-all"
          >
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
