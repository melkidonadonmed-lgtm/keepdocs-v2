import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Cloud,
  FileText,
  FileSpreadsheet,
  Presentation,
  Search,
  LogIn,
  LogOut,
  RefreshCw,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Sparkles,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  Move,
  Sidebar as SidebarIcon,
  Layers,
  List,
  Paperclip,
  Table as TableIcon,
  Send,
  Wand2,
  FileCode,
  Calendar,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Folder,
  Hash,
  Clock,
  FileQuestion,
  ChevronRight,
  ChevronDown,
  Quote,
  CheckSquare,
} from "lucide-react";
import { Note, DriveAttachment, NoteColor } from "../types";
import {
  GoogleDriveItem,
  listGoogleDriveFiles,
  getAccessToken,
  googleSignIn,
  googleSignOut,
  initGoogleAuth,
} from "../services/googleDriveService";
import {
  getGoogleDocument,
  createGoogleDocument,
  GoogleDocDetail,
} from "../services/googleDocsService";
import {
  getGoogleSpreadsheet,
  createGoogleSpreadsheet,
  GoogleSpreadsheetDetail,
  convert2DArrayToSheetData,
} from "../services/googleSheetsService";
import {
  getGooglePresentation,
  createGooglePresentation,
  GooglePresentationDetail,
} from "../services/googleSlidesService";
import { User } from "firebase/auth";

export type CompanionMode = "sidebar" | "window";
export type CompanionTab = "drive" | "docs" | "ai" | "snippets";

interface WorkspaceCompanionProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CompanionMode;
  onToggleMode: () => void;
  activeNote?: Note | null;
  allNotes: Note[];
  onSelectNote: (note: Note) => void;
  onNewNote: (type: "doc" | "form" | "sheet" | "canvas") => void;
  onInsertIntoDocument?: (textOrHtml: string, type?: "html" | "text" | "table" | "drive-card") => void;
  onAttachDriveFileToActiveNote?: (attachment: DriveAttachment) => void;
  onImportGoogleDoc?: (doc: GoogleDocDetail) => void;
  onImportGoogleSheet?: (sheet: GoogleSpreadsheetDetail) => void;
  onImportGoogleSlide?: (slide: GooglePresentationDetail) => void;
}

export const WorkspaceCompanion: React.FC<WorkspaceCompanionProps> = ({
  isOpen,
  onClose,
  mode,
  onToggleMode,
  activeNote,
  allNotes,
  onSelectNote,
  onNewNote,
  onInsertIntoDocument,
  onAttachDriveFileToActiveNote,
  onImportGoogleDoc,
  onImportGoogleSheet,
  onImportGoogleSlide,
}) => {
  const [activeTab, setActiveTab] = useState<CompanionTab>("drive");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveItem[]>([]);
  const [driveSearch, setDriveSearch] = useState("");
  const [driveFilterType, setDriveFilterType] = useState<"all" | "doc" | "sheet" | "slide">("all");
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isProcessingFileId, setIsProcessingFileId] = useState<string | null>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<string | null>(null);

  // New Drive File Form
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Local Notes search
  const [notesSearch, setNotesSearch] = useState("");

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Olá! Sou seu assistente Gemini integrado. Posso resumir documentos, extrair dados do Drive, sugerir melhorias de texto ou responder perguntas sobre seu workspace.",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Draggable Floating Window state
  const [windowPos, setWindowPos] = useState({ x: window.innerWidth - 440, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  // Initialize auth and fetch files
  useEffect(() => {
    const unsub = initGoogleAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessTokenState(token);
        fetchDrive(token);
      },
      () => {
        setCurrentUser(null);
        setAccessTokenState(null);
      }
    );

    getAccessToken().then((token) => {
      if (token) {
        setAccessTokenState(token);
        fetchDrive(token);
      }
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const fetchDrive = async (token?: string, search?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingDrive(true);
    setAuthError(null);
    try {
      const files = await listGoogleDriveFiles(t, search || driveSearch, 30);
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Drive fetch error:", err);
      setAuthError(err.message || "Erro ao listar arquivos do Google Drive.");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessTokenState(res.accessToken);
        fetchDrive(res.accessToken);
      }
    } catch (err: any) {
      if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("unauthorized-domain")) {
        setAuthError(
          "Domínio 'localhost' não autorizado no Firebase Auth. Adicione 'localhost' e '127.0.0.1' no Firebase Console (Authentication > Settings > Authorized Domains). Você também pode ativar o Modo Simulado abaixo para testar as importações."
        );
      } else {
        setAuthError(err?.message || "Falha na autenticação do Google Workspace.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLoadDemoDrive = () => {
    const demoFiles: GoogleDriveItem[] = [
      {
        id: "demo_doc_1",
        name: "Proposta Comercial & Arquitetura - KeepDocs.gdoc",
        mimeType: "application/vnd.google-apps.document",
        modifiedTime: new Date().toISOString(),
        webViewLink: "https://docs.google.com/document/d/demo",
      },
      {
        id: "demo_sheet_1",
        name: "Planejamento Financeiro Q3 - Mini-Sheet.gsheet",
        mimeType: "application/vnd.google-apps.spreadsheet",
        modifiedTime: new Date().toISOString(),
        webViewLink: "https://docs.google.com/spreadsheets/d/demo",
      },
      {
        id: "demo_slide_1",
        name: "Apresentação Pitch Executivo.gslides",
        mimeType: "application/vnd.google-apps.presentation",
        modifiedTime: new Date().toISOString(),
        webViewLink: "https://docs.google.com/presentation/d/demo",
      },
    ];
    setDriveFiles(demoFiles);
    setAccessTokenState("demo_token");
    setAuthError(null);
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setAccessTokenState(null);
      setDriveFiles([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Dragging handlers for Floating Window mode
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "window") return;
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: windowPos.x,
      startY: windowPos.y,
    };
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || mode !== "window") return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;
      
      const newX = Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.startX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.startY + deltaY));
      setWindowPos({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, mode]);

  // Insert Drive File directly into active document
  const handleInsertDriveFile = async (item: GoogleDriveItem) => {
    if (!onInsertIntoDocument) return;
    setIsProcessingFileId(item.id);
    try {
      const mime = item.mimeType;
      const token = accessToken;

      if (mime.includes("document") && token) {
        // Fetch document content
        const doc = await getGoogleDocument(token, item.id);
        const htmlToInsert = `
          <div class="my-3 p-3 rounded-xl border border-[#2aa198]/30 bg-[#2aa198]/10 text-xs">
            <div class="flex items-center gap-2 font-bold text-[#2aa198] mb-1">
              <span class="p-1 rounded bg-[#2aa198]/20">📄 Google Doc</span>
              <a href="${item.webViewLink || `https://docs.google.com/document/d/${item.id}/edit`}" target="_blank" rel="noopener noreferrer" class="underline hover:text-[#eee8d5]">${item.name}</a>
            </div>
            <div class="text-[#eee8d5] mt-1 line-clamp-4">${doc.plainText || doc.contentHtml || "Documento importado"}</div>
          </div>
        `;
        onInsertIntoDocument(htmlToInsert, "html");
      } else if (mime.includes("spreadsheet") && token) {
        // Fetch spreadsheet data
        const sheet = await getGoogleSpreadsheet(token, item.id);
        const rows = sheet.values || [];
        if (rows.length > 0) {
          const tableHtml = `
            <div class="my-3 overflow-x-auto rounded-xl border border-[#859900]/30 bg-[#002b36] p-2">
              <div class="text-xs font-bold text-[#859900] mb-1.5 flex items-center gap-1.5">
                <span>📊 Planilha: ${item.name}</span>
                <a href="${item.webViewLink || `https://docs.google.com/spreadsheets/d/${item.id}/edit`}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-[#93a1a1] hover:underline">(Abrir no Sheets)</a>
              </div>
              <table style="width:100%; border-collapse: collapse; font-size: 11px;">
                ${rows.slice(0, 10).map((r, rIdx) => `
                  <tr style="border-bottom: 1px solid rgba(147,161,161,0.15); ${rIdx === 0 ? 'font-weight: bold; background: rgba(133,153,0,0.15);' : ''}">
                    ${r.map(c => `<td style="padding: 4px 8px; border: 1px solid rgba(147,161,161,0.15);">${c || ""}</td>`).join("")}
                  </tr>
                `).join("")}
              </table>
            </div>
          `;
          onInsertIntoDocument(tableHtml, "html");
        } else {
          onInsertIntoDocument(`<p><a href="${item.webViewLink}" target="_blank" rel="noopener noreferrer">📊 <strong>${item.name}</strong></a> (Google Sheets)</p>`, "html");
        }
      } else if (mime.includes("presentation") && token) {
        const pres = await getGooglePresentation(token, item.id);
        const summary = pres.slidesText?.slice(0, 3).join(" • ") || "Apresentação de slides";
        const html = `
          <div class="my-3 p-3 rounded-xl border border-[#b58900]/30 bg-[#b58900]/10 text-xs">
            <div class="font-bold text-[#b58900]">📽️ Apresentação: <a href="${item.webViewLink}" target="_blank" rel="noopener noreferrer" class="underline">${item.name}</a> (${pres.slidesCount} slides)</div>
            <p class="text-[11px] text-[#eee8d5] mt-1">${summary}</p>
          </div>
        `;
        onInsertIntoDocument(html, "html");
      } else {
        // Link chip badge
        const chipHtml = `<span style="display:inline-flex; align-items:center; gap:4px; padding: 2px 8px; background: rgba(42,161,152,0.15); border: 1px solid rgba(42,161,152,0.3); border-radius: 8px; font-size: 11px; font-weight: 600;"><a href="${item.webViewLink || '#'}" target="_blank" rel="noopener noreferrer" style="color: #2aa198; text-decoration: none;">📎 ${item.name}</a></span>&nbsp;`;
        onInsertIntoDocument(chipHtml, "html");
      }
    } catch (err: any) {
      setAuthError(err.message || "Erro ao inserir arquivo do Drive.");
    } finally {
      setIsProcessingFileId(null);
    }
  };

  // Attach Drive file metadata to active note
  const handleAttachDriveFile = (item: GoogleDriveItem) => {
    if (!onAttachDriveFileToActiveNote) return;

    let fileType: "doc" | "sheet" | "slide" | "pdf" | "image" | "file" = "file";
    if (item.mimeType.includes("document")) fileType = "doc";
    else if (item.mimeType.includes("spreadsheet")) fileType = "sheet";
    else if (item.mimeType.includes("presentation")) fileType = "slide";
    else if (item.mimeType.includes("pdf")) fileType = "pdf";
    else if (item.mimeType.includes("image")) fileType = "image";

    const attachment: DriveAttachment = {
      id: item.id || "drive_att_" + Date.now(),
      name: item.name,
      mimeType: item.mimeType,
      size: item.size ? `${(parseInt(item.size, 10) / 1024).toFixed(1)} KB` : "Google Drive",
      driveUrl: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
      syncedAt: new Date().toISOString(),
      thumbnailUrl: item.thumbnailLink,
      fileType,
    };
    onAttachDriveFileToActiveNote(attachment);
  };

  // Create new Drive Document directly
  const handleCreateNewDriveFile = async (type: "doc" | "sheet" | "slide") => {
    if (!accessToken) {
      handleSignIn();
      return;
    }
    setIsCreatingFile(true);
    setShowCreateMenu(false);
    try {
      const timestamp = new Date().toLocaleDateString("pt-BR");
      if (type === "doc") {
        const title = `Documento KeepDocs (${timestamp})`;
        const res = await createGoogleDocument(accessToken, title, "Criado via KeepDocs Workspace Companion");
        fetchDrive(accessToken);
        if (onImportGoogleDoc) {
          onImportGoogleDoc({
            documentId: res.documentId,
            title: res.title,
            contentHtml: "<p>Criado via KeepDocs Workspace Companion</p>",
            plainText: "Criado via KeepDocs Workspace Companion",
            webViewLink: res.webViewLink,
          });
        }
      } else if (type === "sheet") {
        const title = `Planilha KeepDocs (${timestamp})`;
        const res = await createGoogleSpreadsheet(accessToken, title, [
          ["Item", "Categoria", "Valor (R$)", "Status"],
          ["Exemplo 1", "Geral", "100", "Concluído"],
        ]);
        fetchDrive(accessToken);
        if (onImportGoogleSheet) {
          onImportGoogleSheet({
            spreadsheetId: res.spreadsheetId,
            title: res.title,
            sheetNames: ["Página1"],
            values: [["Item", "Categoria", "Valor (R$)", "Status"], ["Exemplo 1", "Geral", "100", "Concluído"]],
            webViewLink: res.webViewLink,
          });
        }
      } else if (type === "slide") {
        const title = `Apresentação KeepDocs (${timestamp})`;
        const res = await createGooglePresentation(accessToken, title);
        fetchDrive(accessToken);
        if (onImportGoogleSlide) {
          onImportGoogleSlide({
            presentationId: res.presentationId,
            title: res.title,
            slidesCount: 1,
            webViewLink: res.webViewLink,
            slidesText: [title],
          });
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Erro ao criar arquivo no Drive.");
    } finally {
      setIsCreatingFile(false);
    }
  };

  // AI Document Assistant Chat
  const handleSendAi = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    const userText = aiPrompt.trim();
    setAiPrompt("");
    setAiMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsAiLoading(true);

    try {
      let docContext = "";
      if (activeNote) {
        docContext = `\nContexto do Documento Ativo:
Título: ${activeNote.title}
Tipo: ${activeNote.type}
Conteúdo atual (resumo): ${activeNote.content.replace(/<[^>]+>/g, " ").slice(0, 1500)}`;
      }

      let endpoint = "/api/gemini/generate";
      let requestBody: any = {
        prompt: `${userText}\n${docContext}`,
        systemInstruction: "Você é o assistente inteligente e analista do KeepDocs Workspace. Ajude o usuário a criar, resumir, formatar, organizar e analisar notas, tarefas e documentos. Responda em Markdown limpo, elegante e objetivo em Português.",
      };

      if (!activeNote && allNotes && allNotes.length > 0) {
        endpoint = "/api/gemini/analyze-workspace";
        requestBody = {
          prompt: userText,
          workspaceContext: {
            totalNotes: allNotes.length,
            notes: allNotes.filter((n) => !n.trashed).slice(0, 35).map((n) => ({
              id: n.id,
              title: n.title,
              type: n.type,
              tags: n.tags,
              pinned: n.pinned,
              checklistTotal: n.checklist?.length || 0,
              checklistCompleted: n.checklist?.filter((i) => i.completed).length || 0,
            })),
          },
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      const assistantResponse = data.text || "Não foi possível obter uma resposta do Gemini.";
      setAiMessages((prev) => [...prev, { role: "assistant", text: assistantResponse }]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Erro ao conectar com o serviço Gemini AI. Tente novamente." },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Fast snippet insertion into document
  const handleInsertSnippet = (type: string) => {
    if (!onInsertIntoDocument) return;
    if (type === "callout") {
      const html = `<div style="margin: 12px 0; padding: 12px; border-left: 4px solid #2aa198; background: rgba(42,161,152,0.12); border-radius: 8px; font-size: 13px; color: #eee8d5;"><strong>💡 Destaque:</strong> Insira seu comentário ou observação importante aqui...</div><p></p>`;
      onInsertIntoDocument(html, "html");
    } else if (type === "checklist") {
      const html = `<ul style="list-style: none; padding-left: 0; margin: 8px 0;"><li style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;"><input type="checkbox" /> <span>Tarefa 1</span></li><li style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;"><input type="checkbox" /> <span>Tarefa 2</span></li></ul><p></p>`;
      onInsertIntoDocument(html, "html");
    } else if (type === "timestamp") {
      const now = new Date().toLocaleString("pt-BR");
      const html = `<span style="font-size: 11px; padding: 2px 6px; background: rgba(147,161,161,0.15); border-radius: 4px; color: #93a1a1; font-family: monospace;">📅 ${now}</span>&nbsp;`;
      onInsertIntoDocument(html, "html");
    } else if (type === "code") {
      const html = `<pre style="background: #002b36; border: 1px solid rgba(147,161,161,0.2); border-radius: 8px; padding: 10px; font-family: monospace; font-size: 12px; color: #2aa198; overflow-x: auto;">// Insira seu código aqui\nfunction executar() {\n  console.log("KeepDocs");\n}</pre><p></p>`;
      onInsertIntoDocument(html, "html");
    } else if (type === "quote") {
      const html = `<blockquote style="margin: 12px 0; padding: 8px 16px; border-left: 3px solid #b58900; color: #93a1a1; font-style: italic; background: rgba(181,137,0,0.08); border-radius: 0 8px 8px 0;">"Citação ou referência relevante para este documento."</blockquote><p></p>`;
      onInsertIntoDocument(html, "html");
    } else if (type === "table") {
      const html = `
        <table style="width: 100%; margin: 12px 0; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background: #073642; border-bottom: 2px solid #2aa198;">
              <th style="padding: 8px; border: 1px solid rgba(147,161,161,0.15); color: #2aa198;">Coluna 1</th>
              <th style="padding: 8px; border: 1px solid rgba(147,161,161,0.15); color: #2aa198;">Coluna 2</th>
              <th style="padding: 8px; border: 1px solid rgba(147,161,161,0.15); color: #2aa198;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid rgba(147,161,161,0.15); color: #eee8d5;">Dado A</td>
              <td style="padding: 8px; border: 1px solid rgba(147,161,161,0.15); color: #eee8d5;">R$ 150,00</td>
              <td style="padding: 8px; border: 1px solid rgba(147,161,161,0.15); color: #859900; font-weight: bold;">R$ 150,00</td>
            </tr>
          </tbody>
        </table><p></p>
      `;
      onInsertIntoDocument(html, "html");
    }
  };

  // Filter Drive files
  const filteredDriveFiles = driveFiles.filter((f) => {
    if (driveFilterType === "doc") return f.mimeType.includes("document");
    if (driveFilterType === "sheet") return f.mimeType.includes("spreadsheet");
    if (driveFilterType === "slide") return f.mimeType.includes("presentation");
    return true;
  });

  // Filter Notes
  const filteredNotes = allNotes.filter((n) => {
    if (!notesSearch.trim()) return true;
    const q = notesSearch.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q)) ||
      n.content.toLowerCase().includes(q)
    );
  });

  // Extract Document Outline / Headings
  const outlineHeadings: Array<{ text: string; level: number }> = [];
  if (activeNote && activeNote.content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(activeNote.content, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3");
    headings.forEach((h) => {
      const level = parseInt(h.tagName.substring(1), 10);
      outlineHeadings.push({ text: h.textContent || "Seção", level });
    });
  }

  // Word & character stats
  const activeDocStats = activeNote
    ? {
        words: activeNote.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length,
        chars: activeNote.content.replace(/<[^>]+>/g, "").length,
        readingTime: Math.ceil(
          activeNote.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length / 200
        ),
      }
    : null;

  if (!isOpen) return null;

  // Window or Sidebar layout styles
  const isWindow = mode === "window";

  return (
    <div
      style={
        isWindow
          ? {
              left: `${windowPos.x}px`,
              top: `${windowPos.y}px`,
              width: "400px",
              height: isMinimized ? "48px" : "620px",
              maxHeight: "90vh",
              zIndex: 9999,
            }
          : undefined
      }
      className={`flex flex-col bg-[#073642] border border-[rgba(147,161,161,0.2)] shadow-2xl transition-all ${
        isWindow
          ? "fixed rounded-2xl overflow-hidden backdrop-blur-md"
          : "fixed top-0 right-0 z-50 h-screen w-80 sm:w-96 border-l shadow-2xl overflow-hidden"
      }`}
    >
      {/* Header Bar */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] bg-[#002b36] px-3.5 py-2.5 select-none ${
          isWindow ? "cursor-move" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2aa198]/20 text-[#2aa198] shrink-0">
            <Cloud className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#eee8d5] truncate flex items-center gap-1.5">
              <span>Workspace & Drive</span>
              {activeNote && (
                <span className="rounded bg-[#2aa198]/15 px-1.5 py-0.2 text-[9px] font-semibold text-[#2aa198] border border-[#2aa198]/30">
                  Doc Ativo
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#586e75] truncate">
              {isWindow ? "Janela Flutuante Interativa" : "Barra Lateral Integrada"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Switch Mode: Sidebar vs Floating Window */}
          <button
            onClick={onToggleMode}
            className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] transition-colors"
            title={isWindow ? "Acoplar na Barra Lateral" : "Transformar em Janela Flutuante"}
          >
            {isWindow ? <SidebarIcon className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Minimize toggle (window mode) */}
          {isWindow && (
            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] transition-colors"
              title={isMinimized ? "Expandir Janela" : "Minimizar Janela"}
            >
              {isMinimized ? <ChevronDown className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#dc322f]/20 hover:text-[#dc322f] transition-colors"
            title="Fechar Companion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Navigation Tabs */}
          <div className="flex border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 px-2 no-scrollbar overflow-x-auto">
            <button
              onClick={() => setActiveTab("drive")}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "drive"
                  ? "border-[#2aa198] text-[#2aa198]"
                  : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
              }`}
            >
              <Cloud className="h-3.5 w-3.5 text-[#2aa198]" />
              <span>Drive ({driveFiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "docs"
                  ? "border-[#2aa198] text-[#2aa198]"
                  : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#268bd2]" />
              <span>Documentos</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "ai"
                  ? "border-[#2aa198] text-[#2aa198]"
                  : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#b58900]" />
              <span>Gemini AI</span>
            </button>

            <button
              onClick={() => setActiveTab("snippets")}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "snippets"
                  ? "border-[#2aa198] text-[#2aa198]"
                  : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-[#859900]" />
              <span>Inserções</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* TAB: GOOGLE DRIVE */}
            {activeTab === "drive" && (
              <div className="space-y-3">
                {/* Account & Sync Bar */}
                <div className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2 text-xs">
                  {currentUser && accessToken ? (
                    <div className="flex items-center gap-2 min-w-0">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          className="h-5 w-5 rounded-full border border-[rgba(147,161,161,0.2)]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-[#2aa198] text-[10px] font-bold text-[#002b36] flex items-center justify-center">
                          {currentUser.email?.charAt(0).toUpperCase() || "G"}
                        </div>
                      )}
                      <span className="font-semibold text-[#eee8d5] truncate text-[11px]">
                        {currentUser.displayName || currentUser.email}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#93a1a1]">Google Workspace Desconectado</div>
                  )}

                  <div className="flex items-center gap-1">
                    {accessToken ? (
                      <>
                        <button
                          onClick={() => fetchDrive(accessToken)}
                          disabled={isLoadingDrive}
                          className="p-1 text-[#93a1a1] hover:text-[#eee8d5]"
                          title="Atualizar arquivos"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingDrive ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="text-[10px] text-[#dc322f] hover:underline p-1"
                        >
                          Sair
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleLoadDemoDrive}
                          className="rounded-lg border border-[rgba(147,161,161,0.2)] bg-[#073642] px-2 py-1 text-[10px] text-[#2aa198] hover:bg-[#0a4553] transition-colors"
                          title="Carregar arquivos de demonstração locais"
                        >
                          Modo Demo
                        </button>
                        <button
                          onClick={handleSignIn}
                          disabled={isAuthenticating}
                          className="rounded-lg bg-[#2aa198] px-2.5 py-1 text-[11px] font-bold text-[#002b36] hover:brightness-105"
                        >
                          {isAuthenticating ? "Conectando..." : "Conectar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Global Error Banner */}
                {authError && (
                  <div className="flex flex-col gap-2 rounded-xl bg-[#dc322f]/10 border border-[#dc322f]/30 p-2.5 text-xs text-[#f26360]">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#dc322f] mt-0.5" />
                      <p className="leading-relaxed text-[11px]">{authError}</p>
                    </div>
                    <button
                      onClick={handleLoadDemoDrive}
                      className="self-start rounded-lg bg-[#dc322f]/20 px-2.5 py-1 text-[10px] font-semibold text-[#eee8d5] hover:bg-[#dc322f]/30 transition-colors"
                    >
                      👉 Ativar Modo Demo / Arquivos Locais
                    </button>
                  </div>
                )}

                {/* Search & Type Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#586e75]" />
                    <input
                      type="text"
                      value={driveSearch}
                      onChange={(e) => {
                        setDriveSearch(e.target.value);
                        if (accessToken) fetchDrive(accessToken, e.target.value);
                      }}
                      placeholder="Pesquisar no Google Drive..."
                      className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] py-1.5 pl-8 pr-3 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 text-[10px] overflow-x-auto pb-1">
                    <button
                      onClick={() => setDriveFilterType("all")}
                      className={`px-2 py-0.5 rounded-md border transition-colors ${
                        driveFilterType === "all"
                          ? "bg-[#2aa198]/20 border-[#2aa198] text-[#2aa198]"
                          : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setDriveFilterType("doc")}
                      className={`px-2 py-0.5 rounded-md border transition-colors ${
                        driveFilterType === "doc"
                          ? "bg-[#268bd2]/20 border-[#268bd2] text-[#268bd2]"
                          : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
                      }`}
                    >
                      Docs
                    </button>
                    <button
                      onClick={() => setDriveFilterType("sheet")}
                      className={`px-2 py-0.5 rounded-md border transition-colors ${
                        driveFilterType === "sheet"
                          ? "bg-[#859900]/20 border-[#859900] text-[#859900]"
                          : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
                      }`}
                    >
                      Sheets
                    </button>
                    <button
                      onClick={() => setDriveFilterType("slide")}
                      className={`px-2 py-0.5 rounded-md border transition-colors ${
                        driveFilterType === "slide"
                          ? "bg-[#b58900]/20 border-[#b58900] text-[#b58900]"
                          : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
                      }`}
                    >
                      Slides
                    </button>
                  </div>
                </div>

                {/* Create Quick Actions */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <button
                      onClick={() => setShowCreateMenu((prev) => !prev)}
                      disabled={isCreatingFile}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(147,161,161,0.15)] bg-[#002b36] py-1.5 text-xs font-semibold text-[#eee8d5] hover:bg-[#0a4553]"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#2aa198]" />
                      <span>{isCreatingFile ? "Criando no Drive..." : "+ Novo Arquivo Drive"}</span>
                    </button>

                    {showCreateMenu && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] p-1.5 shadow-xl space-y-1">
                        <button
                          onClick={() => handleCreateNewDriveFile("doc")}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#268bd2] hover:bg-[#073642]"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Google Doc</span>
                        </button>
                        <button
                          onClick={() => handleCreateNewDriveFile("sheet")}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#859900] hover:bg-[#073642]"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Google Sheets</span>
                        </button>
                        <button
                          onClick={() => handleCreateNewDriveFile("slide")}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#b58900] hover:bg-[#073642]"
                        >
                          <Presentation className="h-3.5 w-3.5" />
                          <span>Google Slides</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drive Files List */}
                {isLoadingDrive ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#2aa198]" />
                  </div>
                ) : filteredDriveFiles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[rgba(147,161,161,0.15)] p-6 text-center text-xs text-[#93a1a1]">
                    {accessToken
                      ? "Nenhum arquivo encontrado no Drive."
                      : "Conecte sua conta Google para visualizar arquivos."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDriveFiles.map((file) => {
                      const isDoc = file.mimeType.includes("document");
                      const isSheet = file.mimeType.includes("spreadsheet");
                      const isSlide = file.mimeType.includes("presentation");

                      return (
                        <div
                          key={file.id}
                          className="group rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 hover:border-[rgba(147,161,161,0.25)] transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <span className="mt-0.5 shrink-0">
                                {isDoc && <FileText className="h-4 w-4 text-[#268bd2]" />}
                                {isSheet && <FileSpreadsheet className="h-4 w-4 text-[#859900]" />}
                                {isSlide && <Presentation className="h-4 w-4 text-[#b58900]" />}
                                {!isDoc && !isSheet && !isSlide && <Cloud className="h-4 w-4 text-[#93a1a1]" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#eee8d5] truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-[#586e75]">
                                  {file.modifiedTime
                                    ? new Date(file.modifiedTime).toLocaleDateString("pt-BR")
                                    : "Drive"}
                                </p>
                              </div>
                            </div>

                            <a
                              href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#93a1a1] hover:text-[#eee8d5] p-1"
                              title="Abrir no Google Drive"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          {/* Quick Actions Row */}
                          <div className="mt-2 flex items-center justify-between border-t border-[rgba(147,161,161,0.08)] pt-2 text-[10px]">
                            {/* Insert to active document */}
                            {activeNote && onInsertIntoDocument ? (
                              <button
                                onClick={() => handleInsertDriveFile(file)}
                                disabled={isProcessingFileId === file.id}
                                className="flex items-center gap-1 rounded bg-[#2aa198]/15 px-2 py-0.5 font-semibold text-[#2aa198] hover:bg-[#2aa198]/25"
                                title="Inserir conteúdo ou tabela no documento aberto"
                              >
                                <Plus className="h-2.5 w-2.5" />
                                <span>{isProcessingFileId === file.id ? "Inserindo..." : "Inserir no Doc"}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#586e75]">Abra um doc para inserir</span>
                            )}

                            <div className="flex items-center gap-1">
                              {/* Attach file to note */}
                              {activeNote && onAttachDriveFileToActiveNote && (
                                <button
                                  onClick={() => handleAttachDriveFile(file)}
                                  className="flex items-center gap-0.5 text-[#93a1a1] hover:text-[#2aa198] px-1"
                                  title="Vincular como anexo desta nota"
                                >
                                  <Paperclip className="h-2.5 w-2.5" />
                                  <span>Anexar</span>
                                </button>
                              )}

                              {/* Copy Link */}
                              <button
                                onClick={() => {
                                  if (file.webViewLink) {
                                    navigator.clipboard.writeText(file.webViewLink);
                                    setCopiedLinkIndex(file.id);
                                    setTimeout(() => setCopiedLinkIndex(null), 1500);
                                  }
                                }}
                                className="flex items-center gap-0.5 text-[#93a1a1] hover:text-[#eee8d5] px-1"
                                title="Copiar link"
                              >
                                {copiedLinkIndex === file.id ? (
                                  <Check className="h-2.5 w-2.5 text-[#859900]" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: DOCUMENTOS & ÍNDICE */}
            {activeTab === "docs" && (
              <div className="space-y-3">
                {/* Active Document Info Card */}
                {activeNote ? (
                  <div className="rounded-xl border border-[#2aa198]/30 bg-[#2aa198]/10 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2aa198] flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Documento Atual</span>
                      </span>
                      <span className="text-[10px] text-[#93a1a1]">
                        {activeNote.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-[#eee8d5] truncate">{activeNote.title}</p>
                    
                    {activeDocStats && (
                      <div className="flex items-center gap-3 text-[10px] text-[#93a1a1] border-t border-[#2aa198]/20 pt-1.5">
                        <span>{activeDocStats.words} palavras</span>
                        <span>{activeDocStats.chars} caracteres</span>
                        <span>~{activeDocStats.readingTime} min leitura</span>
                      </div>
                    )}

                    {/* Document Outline (Headings) */}
                    {outlineHeadings.length > 0 && (
                      <div className="border-t border-[#2aa198]/20 pt-2">
                        <p className="text-[10px] font-bold uppercase text-[#2aa198] mb-1">
                          Sumário do Documento
                        </p>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {outlineHeadings.map((h, idx) => (
                            <div
                              key={idx}
                              style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                              className="text-[11px] text-[#eee8d5] truncate hover:text-[#2aa198] cursor-pointer flex items-center gap-1"
                            >
                              <span className="text-[9px] text-[#586e75]">H{h.level}</span>
                              <span className="truncate">{h.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-3 text-xs text-[#93a1a1]">
                    Nenhum documento aberto no momento. Selecione uma nota abaixo para abrir.
                  </div>
                )}

                {/* Quick Create Note */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => onNewNote("doc")}
                    className="flex items-center justify-center gap-1 rounded-xl bg-[#268bd2]/15 border border-[#268bd2]/30 p-2 text-[#268bd2] font-semibold hover:bg-[#268bd2]/25"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Novo Doc</span>
                  </button>
                  <button
                    onClick={() => onNewNote("sheet")}
                    className="flex items-center justify-center gap-1 rounded-xl bg-[#859900]/15 border border-[#859900]/30 p-2 text-[#859900] font-semibold hover:bg-[#859900]/25"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nova Planilha</span>
                  </button>
                </div>

                {/* Search Notes */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#586e75]" />
                  <input
                    type="text"
                    value={notesSearch}
                    onChange={(e) => setNotesSearch(e.target.value)}
                    placeholder="Pesquisar todas as notas..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] py-1.5 pl-8 pr-3 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                  />
                </div>

                {/* Notes List */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-[#586e75] px-1">
                    Alternar Documento ({filteredNotes.length})
                  </p>
                  {filteredNotes.slice(0, 15).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onSelectNote(n)}
                      className={`w-full text-left rounded-xl p-2 text-xs flex items-center justify-between border transition-all ${
                        activeNote?.id === n.id
                          ? "bg-[#002b36] border-[#2aa198] text-[#2aa198]"
                          : "bg-[#002b36]/60 border-[rgba(147,161,161,0.12)] text-[#eee8d5] hover:bg-[#002b36]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {n.type === "sheet" && <FileSpreadsheet className="h-3.5 w-3.5 text-[#859900] shrink-0" />}
                        {n.type === "doc" && <FileText className="h-3.5 w-3.5 text-[#268bd2] shrink-0" />}
                        {n.type === "form" && <Layers className="h-3.5 w-3.5 text-[#b58900] shrink-0" />}
                        {n.type === "canvas" && <Sparkles className="h-3.5 w-3.5 text-[#6c71c4] shrink-0" />}
                        <span className="truncate font-medium">{n.title || "Sem título"}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-[#586e75] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GEMINI AI ASSISTANT */}
            {activeTab === "ai" && (
              <div className="flex flex-col h-full space-y-3">
                {/* AI Document Quick Prompts */}
                {activeNote && (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <button
                      onClick={() => {
                        setAiPrompt(`Por favor, faça um resumo executivo em 3 tópicos do seguinte documento: "${activeNote.title}"\n${activeNote.content.replace(/<[^>]+>/g, " ")}`);
                      }}
                      className="rounded-lg bg-[#b58900]/15 border border-[#b58900]/30 px-2 py-1 text-[#b58900] hover:bg-[#b58900]/25"
                    >
                      ✨ Resumir Doc
                    </button>
                    <button
                      onClick={() => {
                        setAiPrompt(`Revise e melhore a redação e gramática do seguinte texto, mantendo tom profissional:\n${activeNote.content.replace(/<[^>]+>/g, " ")}`);
                      }}
                      className="rounded-lg bg-[#2aa198]/15 border border-[#2aa198]/30 px-2 py-1 text-[#2aa198] hover:bg-[#2aa198]/25"
                    >
                      🖋️ Polir Redação
                    </button>
                    <button
                      onClick={() => {
                        setAiPrompt(`Extraia uma lista de tarefas (checklist) a partir das ideias do documento "${activeNote.title}":\n${activeNote.content.replace(/<[^>]+>/g, " ")}`);
                      }}
                      className="rounded-lg bg-[#859900]/15 border border-[#859900]/30 px-2 py-1 text-[#859900] hover:bg-[#859900]/25"
                    >
                      📋 Extrair Tarefas
                    </button>
                  </div>
                )}

                {/* AI Chat History */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-1">
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#2aa198]/15 text-[#eee8d5] ml-4 border border-[#2aa198]/30"
                          : "bg-[#002b36] text-[#eee8d5] mr-2 border border-[rgba(147,161,161,0.12)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] font-bold">
                        <span className={msg.role === "user" ? "text-[#2aa198]" : "text-[#b58900]"}>
                          {msg.role === "user" ? "Você" : "Gemini AI"}
                        </span>
                        {msg.role === "assistant" && activeNote && onInsertIntoDocument && i > 0 && (
                          <button
                            onClick={() => {
                              const html = `<div style="margin:10px 0; padding: 10px; border-left: 3px solid #b58900; background: rgba(181,137,0,0.1); border-radius: 6px; font-size: 12px; color: #eee8d5;"><strong>✨ IA Gemini:</strong><br/>${msg.text.replace(/\n/g, "<br/>")}</div><p></p>`;
                              onInsertIntoDocument(html, "html");
                            }}
                            className="text-[#2aa198] hover:underline flex items-center gap-0.5"
                            title="Inserir resposta no documento ativo"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            <span>Inserir no Doc</span>
                          </button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#002b36] p-2.5 text-xs text-[#93a1a1]">
                      <Sparkles className="h-3.5 w-3.5 animate-spin text-[#b58900]" />
                      <span>Gemini pensando...</span>
                    </div>
                  )}
                </div>

                {/* Prompt Input */}
                <div className="flex items-center gap-1.5 border-t border-[rgba(147,161,161,0.12)] pt-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendAi()}
                    placeholder="Pergunte ao Gemini sobre seus documentos..."
                    className="flex-1 rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] px-3 py-2 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                  />
                  <button
                    onClick={handleSendAi}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="rounded-xl bg-[#2aa198] p-2 text-[#002b36] hover:brightness-105 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: INSERÇÕES RÁPIDAS */}
            {activeTab === "snippets" && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-[#93a1a1]">
                  Clique em um bloco para inseri-lo diretamente no documento em edição:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleInsertSnippet("callout")}
                    className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 text-left hover:border-[#2aa198] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-[#2aa198]/15 p-1.5 text-[#2aa198]"><AlertCircle className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-semibold text-[#eee8d5]">Caixa de Destaque (Callout)</p>
                        <p className="text-[10px] text-[#586e75]">Alerta visual com borda colorida</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#2aa198]" />
                  </button>

                  <button
                    onClick={() => handleInsertSnippet("table")}
                    className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 text-left hover:border-[#859900] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-[#859900]/15 p-1.5 text-[#859900]"><TableIcon className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-semibold text-[#eee8d5]">Tabela Formatada</p>
                        <p className="text-[10px] text-[#586e75]">Tabela de dados com cabeçalhos</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#859900]" />
                  </button>

                  <button
                    onClick={() => handleInsertSnippet("checklist")}
                    className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 text-left hover:border-[#b58900] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-[#b58900]/15 p-1.5 text-[#b58900]"><CheckSquare className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-semibold text-[#eee8d5]">Lista de Tarefas (Checklist)</p>
                        <p className="text-[10px] text-[#586e75]">Caixas de marcação interativas</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#b58900]" />
                  </button>

                  <button
                    onClick={() => handleInsertSnippet("quote")}
                    className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 text-left hover:border-[#b58900] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-[#b58900]/15 p-1.5 text-[#b58900]"><Quote className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-semibold text-[#eee8d5]">Bloco de Citação</p>
                        <p className="text-[10px] text-[#586e75]">Citação estilizada para referências</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#b58900]" />
                  </button>

                  <button
                    onClick={() => handleInsertSnippet("code")}
                    className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 text-left hover:border-[#6c71c4] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-[#6c71c4]/15 p-1.5 text-[#6c71c4]"><FileCode className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-semibold text-[#eee8d5]">Bloco de Código</p>
                        <p className="text-[10px] text-[#586e75]">Área pré-formatada monoespaçada</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#6c71c4]" />
                  </button>

                  <button
                    onClick={() => handleInsertSnippet("timestamp")}
                    className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-2.5 text-left hover:border-[#2aa198] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-[#2aa198]/15 p-1.5 text-[#2aa198]"><Calendar className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-semibold text-[#eee8d5]">Carimbo de Data & Hora</p>
                        <p className="text-[10px] text-[#586e75]">Insere a data e hora atual</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#2aa198]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
