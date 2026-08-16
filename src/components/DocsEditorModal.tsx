import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Download,
  Copy,
  Check,
  MessageSquare,
  Send,
  Cloud,
  FileSpreadsheet,
  PenTool,
  ClipboardList,
  Pin,
  Palette,
  Share2,
  Plus,
  Table as TableIcon,
  FileText,
  Code,
  Quote,
  Minus,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Note, Comment, NoteColor, EmbeddedTableData } from "../types";
import { getNoteColorClasses } from "../utils/helpers";
import { sanitizeHtml } from "../utils/sanitizeHtml";
import { NoteExportEngine } from "../services/NoteExportEngine";
import { getAccessToken, googleSignIn } from "../services/googleDriveService";
import { createGoogleDocument, appendTextToGoogleDoc } from "../services/googleDocsService";
import { EditorHeader } from "./EditorHeader";
import { GhostButton } from "./GhostButton";
import { ShareModal } from "./ShareModal";
import { WorkspaceCompanion, CompanionMode } from "./WorkspaceCompanion";

interface DocsEditorModalProps {
  note: Note | null;
  onClose: () => void;
  onSaveNote: (updatedNote: Note) => void;
  allNotes?: Note[];
  onSelectNote?: (note: Note) => void;
  onNewNote?: (type: "doc" | "form" | "sheet" | "canvas") => void;
}

export const DocsEditorModal: React.FC<DocsEditorModalProps> = ({
  note,
  onClose,
  onSaveNote,
  allNotes = [],
  onSelectNote,
  onNewNote,
}) => {
  if (!note) return null;

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState<NoteColor>(note.color);
  const [pinned, setPinned] = useState(note.pinned);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTagInput, setNewTagInput] = useState("");
  const [comments, setComments] = useState<Comment[]>(note.comments || []);
  const [newCommentText, setNewCommentText] = useState("");
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [companionMode, setCompanionMode] = useState<CompanionMode>("sidebar");
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Google Docs Link & Sync state
  const [googleDocId, setGoogleDocId] = useState<string | undefined>(note.googleDocId);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | undefined>(note.googleDocUrl);
  const [isSyncingDocs, setIsSyncingDocs] = useState(false);
  const [googleDocsMsg, setGoogleDocsMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Real auto-save state (footer indicator)
  const [saveState, setSaveState] = useState<"clean" | "saving" | "saved">("clean");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const skipNextAutoSave = useRef(true);

  // Paper & Canvas Theme (Dark Sand, Warm Sepia, Light Paper)
  const [paperTheme, setPaperTheme] = useState<"sand-dark" | "linen-sepia" | "sand-light">("sand-dark");

  // Embedded Tables in Docs
  const [tables, setTables] = useState<EmbeddedTableData[]>(note.tables || []);

  const editorRef = useRef<HTMLDivElement>(null);

  // Global Shortcut Ctrl+B / Cmd+B inside the editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !e.shiftKey) {
        // Prevent default only if not in an input/editable with selected text for bold
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          e.preventDefault();
          setShowCompanion((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInsertIntoDocument = (textOrHtml: string, type?: "html" | "text" | "table" | "drive-card") => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        const success = document.execCommand("insertHTML", false, textOrHtml);
        if (!success) {
          editorRef.current.innerHTML += "<br/>" + textOrHtml;
          setContent(editorRef.current.innerHTML);
        } else {
          handleContentChange();
        }
      } catch (err) {
        editorRef.current.innerHTML += "<br/>" + textOrHtml;
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleAttachDriveFile = (attachment: any) => {
    const existing = note.driveAttachments || [];
    const updatedNote: Note = {
      ...note,
      title,
      content,
      driveAttachments: [...existing, attachment],
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updatedNote);
  };

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setPinned(note.pinned);
    setTags(note.tags);
    setComments(note.comments || []);
    setTables(note.tables || []);
    setGoogleDocId(note.googleDocId);
    setGoogleDocUrl(note.googleDocUrl);

    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(note.content);
    }

    skipNextAutoSave.current = true;
    setSaveState("clean");
  }, [note.id]);

  // Real auto-save: persists the note ~1s after the user stops editing
  useEffect(() => {
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      triggerSave();
      setSaveState("saved");
      setLastSavedAt(new Date().toISOString());
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [title, content, color, pinned, tags, comments, tables, googleDocId, googleDocUrl]);

  // Sync content back to state on edit
  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Execute Rich Text Command
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleContentChange();
  };

  // Inline Markdown Keyboard Handler
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;

      if (node && node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const cursorOffset = range.startOffset;
        const textBeforeCursor = text.slice(0, cursorOffset);

        if (e.key === " ") {
          if (textBeforeCursor === "#") {
            e.preventDefault();
            node.textContent = text.slice(cursorOffset);
            execCmd("formatBlock", "<h1>");
            return;
          }
          if (textBeforeCursor === "##") {
            e.preventDefault();
            node.textContent = text.slice(cursorOffset);
            execCmd("formatBlock", "<h2>");
            return;
          }
          if (textBeforeCursor === "###") {
            e.preventDefault();
            node.textContent = text.slice(cursorOffset);
            execCmd("formatBlock", "<h3>");
            return;
          }
          if (textBeforeCursor === "-" || textBeforeCursor === "*") {
            e.preventDefault();
            node.textContent = text.slice(cursorOffset);
            execCmd("insertUnorderedList");
            return;
          }
          if (textBeforeCursor === "1.") {
            e.preventDefault();
            node.textContent = text.slice(cursorOffset);
            execCmd("insertOrderedList");
            return;
          }
          if (textBeforeCursor === ">") {
            e.preventDefault();
            node.textContent = text.slice(cursorOffset);
            execCmd("formatBlock", "<blockquote>");
            return;
          }

          // Inline formatting shortcuts: **bold**, *italic*, `code`
          const doubleAsteriskMatch = textBeforeCursor.match(/\*\*([^*]+)\*\*$/);
          if (doubleAsteriskMatch) {
            e.preventDefault();
            const fullMatch = doubleAsteriskMatch[0];
            const innerWord = doubleAsteriskMatch[1];
            const startIdx = cursorOffset - fullMatch.length;
            node.textContent = text.slice(0, startIdx) + text.slice(cursorOffset);
            execCmd("bold");
            document.execCommand("insertText", false, innerWord + " ");
            execCmd("bold");
            return;
          }

          const asteriskMatch = textBeforeCursor.match(/\*([^*]+)\*$/);
          if (asteriskMatch) {
            e.preventDefault();
            const fullMatch = asteriskMatch[0];
            const innerWord = asteriskMatch[1];
            const startIdx = cursorOffset - fullMatch.length;
            node.textContent = text.slice(0, startIdx) + text.slice(cursorOffset);
            execCmd("italic");
            document.execCommand("insertText", false, innerWord + " ");
            execCmd("italic");
            return;
          }

          const backtickMatch = textBeforeCursor.match(/`([^`]+)`$/);
          if (backtickMatch) {
            e.preventDefault();
            const fullMatch = backtickMatch[0];
            const innerWord = backtickMatch[1];
            const startIdx = cursorOffset - fullMatch.length;
            node.textContent = text.slice(0, startIdx) + text.slice(cursorOffset);
            execCmd("formatBlock", "<pre>");
            document.execCommand("insertText", false, innerWord + " ");
            execCmd("formatBlock", "<p>");
            return;
          }
        } else if (e.key === "Enter") {
          if (textBeforeCursor.trim() === "---" || text.trim() === "---") {
            e.preventDefault();
            node.textContent = "";
            execCmd("insertHorizontalRule");
            return;
          }
        }
      }
    }
  };

  // Auto-Save Note
  const triggerSave = () => {
    const updated: Note = {
      ...note,
      title: title || "Nota Sem Título",
      content,
      color,
      pinned,
      tags,
      comments,
      tables,
      googleDocId,
      googleDocUrl,
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updated);
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      const updatedTags = [...tags, newTagInput.trim()];
      setTags(updatedTags);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: Comment = {
      id: "comment_" + Date.now(),
      author: "Você (Usuário)",
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText("");
  };

  const handleInsertTable = () => {
    const newTable: EmbeddedTableData = {
      id: `tbl_${Date.now()}`,
      title: "Nova Tabela Interativa",
      headers: ["Descrição", "Valor (R$)", "Quantidade", "Total"],
      hasHeaderRow: true,
      hasSummaryRow: true,
      rows: [
        [
          { id: `c_0_0_${Date.now()}`, value: "Consultoria Técnica" },
          { id: `c_0_1_${Date.now()}`, value: "250" },
          { id: `c_0_2_${Date.now()}`, value: "4" },
          { id: `c_0_3_${Date.now()}`, value: "=B1*C1" },
        ],
        [
          { id: `c_1_0_${Date.now()}`, value: "Licença de Software" },
          { id: `c_1_1_${Date.now()}`, value: "1200" },
          { id: `c_1_2_${Date.now()}`, value: "1" },
          { id: `c_1_3_${Date.now()}`, value: "=B2*C2" },
        ],
      ],
    };
    setTables((prev) => [...prev, newTable]);
  };

  // Google Docs Save / Export Handler
  const handleSaveToGoogleDocs = async () => {
    setIsSyncingDocs(true);
    setGoogleDocsMsg(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        if (!authRes?.accessToken) {
          throw new Error("Faça login com sua conta Google para salvar no Google Docs.");
        }
        token = authRes.accessToken;
      }

      if (googleDocId) {
        // Append text to existing doc
        const plainText = editorRef.current?.innerText || content.replace(/<[^>]+>/g, "\n");
        await appendTextToGoogleDoc(token, googleDocId, plainText);
        setGoogleDocsMsg({ text: "Texto adicionado ao Google Doc existente!" });
      } else {
        // Create new Google Doc
        const result = await createGoogleDocument(token, title || "Novo Documento KeepDocs", content);
        setGoogleDocId(result.documentId);
        setGoogleDocUrl(result.webViewLink);

        const updatedTags = Array.from(new Set([...tags, "Google Docs"]));
        setTags(updatedTags);

        const plainSnippet = (editorRef.current?.innerText || content.replace(/<[^>]+>/g, " ")).trim().slice(0, 200);

        const updatedNote: Note = {
          ...note,
          title: title || "Novo Documento KeepDocs",
          content,
          color,
          pinned,
          tags: updatedTags,
          comments,
          tables,
          googleDocId: result.documentId,
          googleDocUrl: result.webViewLink,
          googleDocSnippet: plainSnippet,
          googleDocModifiedTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onSaveNote(updatedNote);
        setGoogleDocsMsg({ text: "Documento salvo e vinculado no Google Docs!" });
      }
    } catch (err: any) {
      console.error("Erro no Google Docs:", err);
      setGoogleDocsMsg({ text: err.message || "Erro ao salvar no Google Docs.", isError: true });
    } finally {
      setIsSyncingDocs(false);
      setTimeout(() => setGoogleDocsMsg(null), 5000);
    }
  };

  // Gemini AI Writing Assistant Call
  const handleGeminiAssist = async (actionPrompt: string) => {
    setIsAiLoading(true);
    try {
      const promptText = `Atue como um editor e redator sênior do Google Docs.
Ação solicitada: ${actionPrompt}
Texto/Conteúdo atual do documento:
${content}

Retorne APENAS o conteúdo em HTML formatado pronto para ser inserido no editor.`;

      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();

      if (data.text) {
        let cleanText = data.text.replace(/```html|```/g, "").trim();
        cleanText = sanitizeHtml(cleanText);
        setContent(cleanText);
        if (editorRef.current) {
          editorRef.current.innerHTML = cleanText;
        }
        setShowAIPanel(false);
      }
    } catch (err) {
      console.error("Erro na assistência da IA:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export functions
  const handleCopyText = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentFullNote: Note = {
    ...note,
    title,
    content,
    color,
    pinned,
    tags,
    comments,
    tables,
    googleDocId,
    googleDocUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060e12]/85 p-2 backdrop-blur-xs sm:p-6">
      <div className="relative flex h-full max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.18)] bg-[#0e1b22] shadow-2xl">
        {/* Standardized Responsive Editor Header */}
        <EditorHeader
          icon={
            <span className="text-[#2aa198]">
              {note.type === "form" && <ClipboardList className="h-5 w-5" />}
              {note.type === "sheet" && <FileSpreadsheet className="h-5 w-5" />}
              {note.type === "canvas" && <PenTool className="h-5 w-5" />}
              {note.type !== "form" && note.type !== "sheet" && note.type !== "canvas" && <FileText className="h-5 w-5" />}
            </span>
          }
          title="Google Docs Editor"
          syncBadge={
            googleDocUrl ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#2aa198]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2aa198] border border-[#2aa198]/30">
                <CheckCircle2 className="h-3 w-3" />
                <span className="hidden sm:inline">Sincronizado no Google Docs</span>
                <span className="sm:hidden">Sincronizado</span>
              </span>
            ) : null
          }
          actions={
            <>
              {googleDocUrl ? (
                <a
                  href={googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold h-9 rounded-[10px] px-3 py-1.5 bg-[#268bd2]/15 border border-[#268bd2]/30 text-[#268bd2] hover:bg-[#268bd2]/25 transition-colors flex-shrink-0"
                  title="Abrir no Google Docs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Abrir no Docs</span>
                </a>
              ) : (
                <GhostButton
                  variant="accent"
                  onClick={handleSaveToGoogleDocs}
                  disabled={isSyncingDocs}
                  title="Salvar como documento nativo no Google Docs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingDocs ? "animate-spin" : ""}`} />
                  <span>{isSyncingDocs ? "Salvando..." : "Salvar no Docs"}</span>
                </GhostButton>
              )}

              <GhostButton
                variant={showCompanion ? "active" : "ghost"}
                onClick={() => setShowCompanion(!showCompanion)}
                title="Workspace Companion & Google Drive (Ctrl+B)"
              >
                <Cloud className="h-3.5 w-3.5 text-[#2aa198]" />
                <span>Companion & Drive</span>
              </GhostButton>

              <GhostButton
                variant={showAIPanel ? "active" : "ghost"}
                onClick={() => setShowAIPanel(!showAIPanel)}
                title="Assistente Gemini AI"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#2aa198]" />
                <span>Gemini AI</span>
              </GhostButton>

              <GhostButton
                variant={showCommentsSidebar ? "active" : "ghost"}
                onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                title="Comentários"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#b58900]" />
                <span>Comentários ({comments.length})</span>
              </GhostButton>

              <GhostButton
                variant="ghost"
                onClick={() => setShowShareModal(true)}
                title="Compartilhar e Exportar"
              >
                <Share2 className="h-3.5 w-3.5 text-[#268bd2]" />
                <span>Compartilhar</span>
              </GhostButton>

              <GhostButton
                size="icon"
                variant={pinned ? "active" : "ghost"}
                onClick={() => setPinned(!pinned)}
                title={pinned ? "Desafixar do topo" : "Fixar no topo"}
              >
                <Pin className={`h-4 w-4 ${pinned ? "fill-[#b58900] text-[#b58900]" : ""}`} />
              </GhostButton>
            </>
          }
          onClose={() => {
            triggerSave();
            onClose();
          }}
        />

        {/* Share & Multi-Format Export Modal */}
        <ShareModal
          note={currentFullNote}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onSaveToGoogleDocs={handleSaveToGoogleDocs}
        />

        {/* Google Docs Notification Banner */}
        {googleDocsMsg && (
          <div
            className={`flex items-center justify-between px-6 py-2 text-xs border-b ${
              googleDocsMsg.isError
                ? "bg-[#dc322f]/15 border-[#dc322f]/30 text-[#dc322f]"
                : "bg-[#859900]/15 border-[#859900]/30 text-[#859900]"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{googleDocsMsg.text}</span>
            </div>
            {googleDocUrl && (
              <a
                href={googleDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-bold underline"
              >
                <span>Ver no Google Docs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Gemini AI Floating Toolbar Panel */}
        {showAIPanel && (
          <div className="border-b border-[rgba(147,161,161,0.12)] bg-[#002b36] p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#2aa198]">Comandos Gemini:</span>
              <button
                disabled={isAiLoading}
                onClick={() => handleGeminiAssist("Resuma o documento em tópicos executivos.")}
                className="rounded-lg bg-[#073642] px-2.5 py-1 font-medium text-[#eee8d5] hover:bg-[#0a4553]"
              >
                Resumir Documento
              </button>
              <button
                disabled={isAiLoading}
                onClick={() => handleGeminiAssist("Melhore a gramática, tom profissional e clareza do texto.")}
                className="rounded-lg bg-[#073642] px-2.5 py-1 font-medium text-[#eee8d5] hover:bg-[#0a4553]"
              >
                Melhorar Tom & Clareza
              </button>
              <button
                disabled={isAiLoading}
                onClick={() => handleGeminiAssist("Expanda este conteúdo com detalhes e exemplos práticos.")}
                className="rounded-lg bg-[#073642] px-2.5 py-1 font-medium text-[#eee8d5] hover:bg-[#0a4553]"
              >
                Expandir Tópicos
              </button>
              <button
                disabled={isAiLoading}
                onClick={() => handleGeminiAssist("Traduza todo o texto para o Inglês.")}
                className="rounded-lg bg-[#073642] px-2.5 py-1 font-medium text-[#eee8d5] hover:bg-[#0a4553]"
              >
                Traduzir para Inglês
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="Ex: 'Adicione uma introdução formal...' ou 'Crie tópicos detalhados...'"
                className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-1.5 text-xs text-[#eee8d5] placeholder-[#586e75] outline-none focus:border-[#2aa198]"
              />
              <button
                disabled={isAiLoading || !aiPromptInput.trim()}
                onClick={() => {
                  handleGeminiAssist(aiPromptInput);
                  setAiPromptInput("");
                }}
                className="flex items-center gap-1 rounded-xl bg-[#2aa198] px-3 py-1.5 text-xs font-bold text-[#002b36] hover:brightness-105 disabled:opacity-50"
              >
                {isAiLoading ? "Processando..." : "Executar"}
              </button>
            </div>
          </div>
        )}

        {/* Google Docs Rich Toolbar - Fixed Top Toolbar */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-1 border-b border-[rgba(147,161,161,0.15)] bg-[#0e1b22]/95 px-4 py-2 backdrop-blur-md sm:px-6">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => execCmd("formatBlock", "<h1>")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Título 1 (H1 ou '# ')"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("formatBlock", "<h2>")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Título 2 (H2 ou '## ')"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("formatBlock", "<h3>")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Título 3 (H3 ou '### ')"
            >
              <Heading3 className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-1" />

            <button
              onClick={() => execCmd("bold")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5] font-bold"
              title="Negrito (**texto**)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("italic")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5] italic"
              title="Itálico (*texto*)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("underline")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5] underline"
              title="Sublinhado"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("strikeThrough")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5] line-through"
              title="Tachado"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("formatBlock", "<pre>")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Bloco de Código (`código`)"
            >
              <Code className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-1" />

            <button
              onClick={() => execCmd("insertUnorderedList")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Lista com Marcadores (- )"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("insertOrderedList")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Lista Numerada (1. )"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("formatBlock", "<blockquote>")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Citação (> )"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCmd("insertHorizontalRule")}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#182730] hover:text-[#eee8d5]"
              title="Linha Divisória (---)"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-[rgba(147,161,161,0.2)] mx-1" />

            {/* Insert Table Button */}
            <button
              onClick={handleInsertTable}
              className="flex items-center gap-1 rounded-lg bg-[#859900]/15 px-2.5 py-1 text-xs font-semibold text-[#859900] hover:bg-[#859900]/25"
              title="Inserir Tabela Interativa (Sheets inside Docs)"
            >
              <TableIcon className="h-4 w-4" />
              <span>+ Tabela</span>
            </button>
          </div>

          {/* Paper Texture / Lighting Selector & Companion Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-[#081318] p-0.5 border border-[rgba(147,161,161,0.15)] text-[10px]">
              <button
                onClick={() => setPaperTheme("sand-dark")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  paperTheme === "sand-dark" ? "bg-[#182730] text-[#2aa198] font-bold" : "text-[#93a1a1]"
                }`}
                title="Folha Areia Noturna (Suave aos Olhos)"
              >
                🌙 Areia
              </button>
              <button
                onClick={() => setPaperTheme("linen-sepia")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  paperTheme === "linen-sepia" ? "bg-[#282218] text-[#e0b838] font-bold" : "text-[#93a1a1]"
                }`}
                title="Folha Sépia Linho (Tons Quentes)"
              >
                📜 Sépia
              </button>
              <button
                onClick={() => setPaperTheme("sand-light")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  paperTheme === "sand-light" ? "bg-[#fbf8f1] text-[#1e293b] font-bold" : "text-[#93a1a1]"
                }`}
                title="Folha Papel Real Claro (Papiro)"
              >
                ☀️ Papel
              </button>
            </div>

            {/* Workspace Companion & Drive Toolbar Button */}
            <button
              onClick={() => setShowCompanion(!showCompanion)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                showCompanion
                  ? "bg-[#2aa198]/25 text-[#2aa198] border border-[#2aa198]/40"
                  : "bg-[#122129] text-[#eee8d5] hover:bg-[#182730]"
              }`}
              title="Abrir Companion do Workspace & Drive (Ctrl+B)"
            >
              <Cloud className="h-3.5 w-3.5 text-[#2aa198]" />
              <span className="hidden sm:inline">Drive & Companion</span>
            </button>
          </div>
        </div>

        {/* Main Split Area: Editor Canvas + Comments Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Docs Page / Paper Canvas Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#081216]">
            <div
              className={`mx-auto max-w-3xl min-h-[580px] rounded-2xl border p-6 sm:p-12 shadow-2xl transition-all duration-200 ${
                paperTheme === "sand-light"
                  ? "bg-[#fbf8f1] border-[#e5e0d3] text-[#1e293b] shadow-[0_15px_45px_rgba(0,0,0,0.35)]"
                  : paperTheme === "linen-sepia"
                  ? "bg-[#201a14] border-[#b58900]/30 text-[#f5eedf] shadow-[0_15px_45px_rgba(0,0,0,0.5)]"
                  : "bg-[#131e25] border-[rgba(147,161,161,0.18)] text-[#eee8d5] shadow-[0_15px_45px_rgba(0,0,0,0.5)]"
              }`}
            >
              {/* Document Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Documento..."
                className={`w-full border-b pb-3 text-2xl font-bold outline-none placeholder-[#8899a6] focus:border-[#2aa198] bg-transparent ${
                  paperTheme === "sand-light"
                    ? "border-[#d8d0c2] text-[#0f172a]"
                    : "border-[rgba(147,161,161,0.18)] text-[#eee8d5]"
                }`}
              />

              {/* Tags Editor */}
              <div className="my-3 flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                      paperTheme === "sand-light"
                        ? "bg-[#ede7db] border-[#d8d0c2] text-[#475569]"
                        : "bg-[#091419] border-[rgba(147,161,161,0.15)] text-[#93a1a1]"
                    }`}
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-[#64748b] hover:text-[#dc322f]"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="+ Adicionar tag"
                    className={`w-28 border-b bg-transparent text-[11px] placeholder-[#8899a6] outline-none focus:border-[#2aa198] ${
                      paperTheme === "sand-light"
                        ? "border-[#d8d0c2] text-[#1e293b]"
                        : "border-[rgba(147,161,161,0.15)] text-[#eee8d5]"
                    }`}
                  />
                </div>
              </div>

              {/* Editable Content Area */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                onKeyDown={handleEditorKeyDown}
                className={`prose max-w-none mt-6 min-h-[350px] outline-none leading-relaxed text-sm ${
                  paperTheme === "sand-light"
                    ? "prose-slate text-[#1e293b]"
                    : "prose-invert text-[#eee8d5]"
                }`}
              />

              {/* Embedded Tables (Sheets inside Docs) */}
              {tables.length > 0 && (
                <div className="mt-8 space-y-6 border-t border-[rgba(147,161,161,0.12)] pt-6">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#859900]">
                    <TableIcon className="h-4 w-4" />
                    <span>Tabelas Interativas Embutidas ({tables.length})</span>
                  </h4>

                  {tables.map((table, tIdx) => (
                    <div key={table.id} className="relative rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={table.title}
                          onChange={(e) => {
                            const updated = tables.map((tbl, i) => (i === tIdx ? { ...tbl, title: e.target.value } : tbl));
                            setTables(updated);
                          }}
                          className="font-bold text-sm text-[#eee8d5] bg-transparent outline-none border-b border-transparent hover:border-[#2aa198]"
                        />
                        <button
                          onClick={() => setTables(tables.filter((_, i) => i !== tIdx))}
                          className="text-xs text-[#dc322f] hover:underline"
                        >
                          Remover Tabela
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse border border-[rgba(147,161,161,0.12)]">
                          <thead>
                            <tr className="bg-[#073642]">
                              {table.headers.map((h, cIdx) => (
                                <th key={cIdx} className="p-2 border border-[rgba(147,161,161,0.12)] font-bold text-[#93a1a1]">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#073642]/60">
                                {row.map((cell, cIdx) => (
                                  <td key={cell.id} className="p-0 border border-[rgba(147,161,161,0.12)]">
                                    <input
                                      type="text"
                                      value={cell.value}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        const updatedRows = table.rows.map((r, rI) => {
                                          if (rI !== rIdx) return r;
                                          return r.map((c, cI) => (cI === cIdx ? { ...c, value: newVal, computedValue: newVal } : c));
                                        });
                                        const updatedTbls = tables.map((tbl, i) => (i === tIdx ? { ...tbl, rows: updatedRows } : tbl));
                                        setTables(updatedTbls);
                                      }}
                                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none font-mono text-xs text-[#eee8d5]"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Comments & Collaboration */}
          {showCommentsSidebar && (
            <div className="w-80 flex-shrink-0 border-l border-[rgba(147,161,161,0.12)] bg-[#002b36] p-4 flex flex-col justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#93a1a1]">
                  <MessageSquare className="h-4 w-4 text-[#b58900]" />
                  <span>Comentários ({comments.length})</span>
                </h4>

                <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh]">
                  {comments.length === 0 ? (
                    <p className="text-xs text-[#586e75] italic">Nenhum comentário cadastrado ainda.</p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] p-3 text-xs shadow-sm"
                      >
                        <div className="flex items-center justify-between font-semibold text-[#eee8d5]">
                          <span>{c.author}</span>
                          <span className="text-[10px] text-[#586e75]">
                            {new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="mt-1 text-[#93a1a1]">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* New Comment Input */}
              <div className="mt-4 border-t border-[rgba(147,161,161,0.12)] pt-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Adicionar um comentário..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-2 text-xs text-[#eee8d5] placeholder-[#586e75] outline-none focus:border-[#2aa198]"
                  />
                  <button
                    onClick={handleAddComment}
                    className="rounded-xl bg-[#2aa198] p-2 text-[#002b36] hover:brightness-105"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#002b36]/80 px-6 py-3.5">
          <div className="text-xs text-[#586e75]">
            {saveState === "saving"
              ? "Salvando..."
              : lastSavedAt
                ? `Salvo às ${new Date(lastSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : "As alterações são salvas automaticamente"}
          </div>

          <button
            onClick={() => {
              triggerSave();
              onClose();
            }}
            className="rounded-xl bg-[#2aa198] px-5 py-2 text-xs font-bold text-[#002b36] shadow-md shadow-[#2aa198]/20 hover:brightness-105"
          >
            Concluir & Salvar
          </button>
        </div>

        {/* Workspace Companion: Docked Sidebar or Floating Window within Document */}
        {showCompanion && (
          <WorkspaceCompanion
            isOpen={showCompanion}
            onClose={() => setShowCompanion(false)}
            mode={companionMode}
            onToggleMode={() =>
              setCompanionMode((prev) => (prev === "sidebar" ? "window" : "sidebar"))
            }
            activeNote={currentFullNote}
            allNotes={allNotes}
            onSelectNote={(selected) => {
              triggerSave();
              if (onSelectNote) onSelectNote(selected);
            }}
            onNewNote={onNewNote || (() => {})}
            onInsertIntoDocument={handleInsertIntoDocument}
            onAttachDriveFileToActiveNote={handleAttachDriveFile}
          />
        )}
      </div>
    </div>
  );
};
