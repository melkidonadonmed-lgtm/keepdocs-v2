import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ClipboardList,
  Check,
  FileText,
  Wand2,
  Upload,
  Trash2,
  AlertCircle,
  Share2,
} from "lucide-react";
import { FormTemplate, Note } from "../types";
import { INITIAL_TEMPLATES } from "../data/initialTemplates";
import { DocumentIngestionService } from "../services/DocumentIngestionService";
import { sanitizeHtml } from "../utils/sanitizeHtml";
import { EditorHeader } from "./EditorHeader";
import { GhostButton } from "./GhostButton";
import { ShareModal } from "./ShareModal";

interface FormFillerModalProps {
  note?: Note | null;
  onClose: () => void;
  onSaveAsNote: (note: Note) => void;
}

export const FormFillerModal: React.FC<FormFillerModalProps> = ({
  note,
  onClose,
  onSaveAsNote,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate>(
    INITIAL_TEMPLATES[0]
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [docTitle, setDocTitle] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTopicPrompt, setAiTopicPrompt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"form" | "preview">("form");
  const [showShareModal, setShowShareModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note && note.formValues) {
      setFormValues(note.formValues);
      setDocTitle(note.title);
      const tmpl = INITIAL_TEMPLATES.find((t) => t.id === note.formTemplateId) || INITIAL_TEMPLATES[0];
      setSelectedTemplate(tmpl);
    } else {
      // Initialize default field values
      const initialVals: Record<string, string> = {};
      selectedTemplate.fields.forEach((f) => {
        initialVals[f.id] = "";
      });
      setFormValues(initialVals);
      if (!docTitle) {
        setDocTitle(selectedTemplate.title);
      }
    }
  }, [selectedTemplate, note]);

  // Real-time document generation as user types
  useEffect(() => {
    let result = selectedTemplate.templateContent;
    Object.keys(formValues).forEach((key) => {
      const val = formValues[key] || `<span class="text-[#b58900] font-bold">[${key}]</span>`;
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, val);
    });
    setGeneratedHtml(result);
  }, [formValues, selectedTemplate]);

  const handleInputChange = (fieldId: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  // Remove a field from current active template
  const handleRemoveField = (fieldId: string) => {
    setSelectedTemplate((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
    setFormValues((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  // Handle Document Upload & Gemini Template Auto-Generation
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsAiLoading(true);
    setStatusText(`Lendo ${file.name} e analisando campos com Gemini AI...`);

    try {
      const extractedText = await DocumentIngestionService.extractTextFromDocument(file);

      const res = await fetch("/api/gemini/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: extractedText }),
      });

      if (!res.ok) {
        throw new Error("Falha ao se comunicar com a IA para estruturar o modelo.");
      }

      const resJson = await res.json();
      const generatedTemplate = resJson.template || resJson;

      if (!generatedTemplate.fields || generatedTemplate.fields.length === 0) {
        throw new Error("Nenhum campo preenchível foi detectado neste documento. Tente outro arquivo.");
      }

      const newTmpl: FormTemplate = {
        id: `custom_imported_${Date.now()}`,
        title: generatedTemplate.title || file.name.replace(/\.[^/.]+$/, ""),
        category: generatedTemplate.category || "Importado",
        description: generatedTemplate.description || `Modelo extraído de ${file.name}`,
        templateContent: generatedTemplate.templateContent || `<p>${extractedText}</p>`,
        fields: generatedTemplate.fields.map((f: any) => ({
          id: f.id || `field_${Math.random().toString(36).slice(2, 7)}`,
          label: f.label || "Campo Sem Nome",
          type: f.type || "text",
          placeholder: f.placeholder || "",
          required: f.required !== false,
          options: f.options,
        })),
      };

      setSelectedTemplate(newTmpl);
      setDocTitle(newTmpl.title);

      const newVals: Record<string, string> = {};
      newTmpl.fields.forEach((f) => {
        newVals[f.id] = "";
      });
      setFormValues(newVals);
      setStatusText("Modelo gerado com sucesso pelo Gemini!");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao processar documento.");
    } finally {
      setIsAiLoading(false);
      setTimeout(() => setStatusText(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Gemini Auto-fill of form fields
  const handleAiAutoFill = async () => {
    if (!aiTopicPrompt.trim()) return;

    setIsAiLoading(true);
    setErrorMessage(null);
    setStatusText("Gemini preenchendo os campos do formulário...");

    try {
      const res = await fetch("/api/gemini/fill-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopicPrompt,
          fields: selectedTemplate.fields,
          templateName: selectedTemplate.title,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao se comunicar com a IA para preenchimento.");
      }

      const filledData = await res.json();
      setFormValues((prev) => ({ ...prev, ...filledData }));
      setStatusText("Campos preenchidos com sucesso!");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao preencher campos via IA.");
    } finally {
      setIsAiLoading(false);
      setTimeout(() => setStatusText(null), 4000);
    }
  };

  const handleSaveDoc = () => {
    const newNote: Note = {
      id: note ? note.id : "form_note_" + Date.now(),
      title: docTitle || selectedTemplate.title,
      content: generatedHtml,
      type: "form",
      color: "blue",
      tags: ["Formulário", selectedTemplate.category],
      pinned: note ? note.pinned : false,
      archived: false,
      trashed: false,
      createdAt: note ? note.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      formTemplateId: selectedTemplate.id,
      formValues,
    };
    onSaveAsNote(newNote);
    onClose();
  };

  const currentNoteForShare: Note = {
    id: note ? note.id : "temp_form",
    title: docTitle || selectedTemplate.title,
    content: generatedHtml,
    type: "form",
    color: "blue",
    tags: ["Formulário", selectedTemplate.category],
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060e12]/85 p-2 backdrop-blur-xs sm:p-6">
      <div className="relative flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.18)] bg-[#0e1b22] shadow-2xl">
        {/* Standardized Responsive Editor Header */}
        <EditorHeader
          icon={<ClipboardList className="h-5 w-5 text-[#268bd2]" />}
          title={docTitle || selectedTemplate.title}
          onTitleChange={setDocTitle}
          isTitleEditable={true}
          subtitle="Formulário Inteligente Auto-Preenchível com Gemini AI"
          actions={
            <>
              <GhostButton
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Importar modelo de PDF, DOCX ou TXT"
              >
                <Upload className="h-3.5 w-3.5 text-[#2aa198]" />
                <span>Importar Doc</span>
              </GhostButton>

              <GhostButton
                variant="ghost"
                onClick={() => setShowShareModal(true)}
                title="Compartilhar e Exportar Documento (PDF, DOCX, etc.)"
              >
                <Share2 className="h-3.5 w-3.5 text-[#268bd2]" />
                <span>Compartilhar</span>
              </GhostButton>

              <GhostButton
                variant="accent"
                onClick={handleSaveDoc}
                title="Salvar como nota no KeepDocs"
              >
                <Check className="h-4 w-4" />
                <span>Salvar Nota</span>
              </GhostButton>
            </>
          }
          onClose={onClose}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.json"
          onChange={handleDocumentUpload}
          className="hidden"
        />

        {/* Share Modal */}
        <ShareModal
          note={currentNoteForShare}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Template Selector Bar */}
        <div className="flex items-center gap-2 border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 px-4 py-2 sm:px-6 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-[#586e75] uppercase flex-shrink-0">Modelos:</span>
          {INITIAL_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl)}
              className={`rounded-[8px] px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedTemplate.id === tmpl.id
                  ? "bg-[#268bd2] text-[#002b36] font-bold shadow-xs"
                  : "bg-[#002b36] text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5]"
              }`}
            >
              {tmpl.title}
            </button>
          ))}
        </div>

        {/* Status / Error Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 border-b border-[#dc322f]/30 bg-[#dc322f]/15 px-6 py-2 text-xs font-semibold text-[#dc322f]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#dc322f]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusText && !errorMessage && (
          <div className="flex items-center gap-2 border-b border-[#2aa198]/30 bg-[#2aa198]/15 px-6 py-2 text-xs font-semibold text-[#2aa198]">
            <Sparkles className="h-4 w-4 shrink-0 text-[#2aa198] animate-pulse" />
            <span>{statusText}</span>
          </div>
        )}

        {/* Mobile View Switcher Tabs (Form vs Preview) */}
        <div className="flex border-b border-[rgba(147,161,161,0.12)] bg-[#002b36] md:hidden">
          <button
            onClick={() => setActiveMobileTab("form")}
            className={`flex-1 py-2 text-center text-xs font-bold transition-colors ${
              activeMobileTab === "form"
                ? "border-b-2 border-[#2aa198] text-[#2aa198]"
                : "text-[#586e75]"
            }`}
          >
            Formulário e Campos
          </button>
          <button
            onClick={() => setActiveMobileTab("preview")}
            className={`flex-1 py-2 text-center text-xs font-bold transition-colors ${
              activeMobileTab === "preview"
                ? "border-b-2 border-[#2aa198] text-[#2aa198]"
                : "text-[#586e75]"
            }`}
          >
            Pré-Visualização
          </button>
        </div>

        {/* Main Split Body: Left Inputs Form + Right Real-time Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Form Inputs */}
          <div
            className={`w-full md:w-1/2 overflow-y-auto border-r border-[rgba(147,161,161,0.12)] p-4 sm:p-6 bg-[#002b36]/20 ${
              activeMobileTab === "preview" ? "hidden md:block" : "block"
            }`}
          >
            {/* AI Auto-Fill Widget */}
            <div className="mb-5 rounded-xl border border-[#2aa198]/30 bg-[#002b36]/80 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#2aa198] text-xs">
                <Sparkles className="h-4 w-4 text-[#2aa198] animate-pulse" />
                <span>Auto-Preenchimento Gemini AI</span>
              </div>
              <p className="mt-1 text-[11px] text-[#93a1a1]">
                Descreva os dados ou instruções para preencher todos os campos automaticamente.
              </p>
              <div className="mt-2.5 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Ex: 'Contrato de R$ 12.000 para consultoria em tecnologia...'"
                  className="w-full rounded-[10px] border border-[rgba(147,161,161,0.15)] bg-[#091419] px-3 py-1.5 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                />
                <GhostButton
                  variant="accent"
                  disabled={isAiLoading}
                  onClick={handleAiAutoFill}
                  className="w-full sm:w-auto"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>{isAiLoading ? "Preenchendo..." : "Auto-Preencher"}</span>
                </GhostButton>
              </div>
            </div>

            {/* Form Fields Generator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#586e75]">
                  Campos do Formulário ({selectedTemplate.fields.length})
                </h3>
              </div>

              {selectedTemplate.fields.map((field) => (
                <div
                  key={field.id}
                  className="relative rounded-xl border border-[rgba(147,161,161,0.15)] bg-[#131e25] p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#eee8d5]">
                      {field.label} {field.required && <span className="text-[#dc322f]">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#586e75]">{"{{" + field.id + "}}"}</span>
                      <button
                        onClick={() => handleRemoveField(field.id)}
                        className="rounded-md p-1 text-[#586e75] hover:bg-[#dc322f]/20 hover:text-[#dc322f] transition-colors"
                        title="Remover este campo do modelo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {field.type === "text_area" ? (
                    <textarea
                      rows={3}
                      value={formValues[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-[8px] border border-[rgba(147,161,161,0.15)] bg-[#091419] p-2 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formValues[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full rounded-[8px] border border-[rgba(147,161,161,0.15)] bg-[#091419] px-3 py-1.5 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                    >
                      <option value="">Selecione uma opção...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={formValues[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-[8px] border border-[rgba(147,161,161,0.15)] bg-[#091419] px-3 py-1.5 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Live Document Preview */}
          <div
            className={`w-full md:w-1/2 flex-col overflow-y-auto bg-[#081216] p-4 sm:p-6 ${
              activeMobileTab === "form" ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="flex items-center justify-between pb-3 text-xs font-bold uppercase tracking-wider text-[#586e75]">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#268bd2]" />
                <span>Pré-Visualização do Documento</span>
              </span>
              <span className="text-[#2aa198] font-semibold text-[11px]">Tempo Real</span>
            </div>

            <div className="mx-auto my-1 w-full max-w-xl flex-1 rounded-xl border border-[rgba(147,161,161,0.18)] bg-[#131e25] p-5 sm:p-7 shadow-xl overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedHtml) }}
                className="prose prose-invert max-w-none text-xs text-[#eee8d5] leading-relaxed overflow-x-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
