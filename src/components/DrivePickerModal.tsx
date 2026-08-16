import React, { useState, useEffect } from "react";
import {
  X,
  Cloud,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  Link as LinkIcon,
  Upload,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  LogIn,
  LogOut,
  Trash2,
  Download,
  AlertCircle,
  File,
  HardDrive,
  Sparkles,
  BookOpen,
  FolderPlus,
} from "lucide-react";
import { DriveAttachment, Note, SheetData } from "../types";
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  initGoogleAuth,
  listGoogleDriveFiles,
  uploadNoteToGoogleDrive,
  deleteGoogleDriveFile,
  GoogleDriveItem,
} from "../services/googleDriveService";
import {
  createGoogleDocument,
  getGoogleDocument,
  listGoogleDocsFiles,
  GoogleDocDetail,
} from "../services/googleDocsService";
import {
  createGoogleSpreadsheet,
  getGoogleSpreadsheet,
  listGoogleSheetsFiles,
  convert2DArrayToSheetData,
  GoogleSpreadsheetDetail,
} from "../services/googleSheetsService";
import {
  createGooglePresentation,
  getGooglePresentation,
  listGoogleSlidesFiles,
  GooglePresentationDetail,
} from "../services/googleSlidesService";
import {
  parseGoogleKeepJson,
  exportNoteToKeepFormat,
} from "../services/googleKeepService";
import { User } from "firebase/auth";

interface DrivePickerModalProps {
  attachments: DriveAttachment[];
  notes: Note[];
  onAddAttachment: (att: DriveAttachment) => void;
  onImportDriveNote?: (driveItem: GoogleDriveItem) => void;
  onImportGoogleDoc?: (doc: GoogleDocDetail) => void;
  onImportGoogleSheet?: (sheet: GoogleSpreadsheetDetail) => void;
  onImportGoogleSlide?: (slide: GooglePresentationDetail) => void;
  onImportKeepNotes?: (notes: Partial<Note>[]) => void;
  onClose: () => void;
  driveSyncedAt: string | null;
  initialTab?: "docs" | "sheets" | "slides" | "keep" | "explorer" | "export";
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  attachments,
  notes,
  onAddAttachment,
  onImportDriveNote,
  onImportGoogleDoc,
  onImportGoogleSheet,
  onImportGoogleSlide,
  onImportKeepNotes,
  onClose,
  driveSyncedAt,
  initialTab = "docs",
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tabs: docs, sheets, slides, keep, explorer, export
  const [activeTab, setActiveTab] = useState<"docs" | "sheets" | "slides" | "keep" | "explorer" | "export">(initialTab);

  // Google Docs state
  const [googleDocs, setGoogleDocs] = useState<GoogleDriveItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docsSearchQuery, setDocsSearchQuery] = useState("");
  const [isImportingDocId, setIsImportingDocId] = useState<string | null>(null);

  // Google Sheets state
  const [googleSheets, setGoogleSheets] = useState<GoogleDriveItem[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [sheetsSearchQuery, setSheetsSearchQuery] = useState("");
  const [isImportingSheetId, setIsImportingSheetId] = useState<string | null>(null);

  // Google Slides state
  const [googleSlides, setGoogleSlides] = useState<GoogleDriveItem[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [slidesSearchQuery, setSlidesSearchQuery] = useState("");
  const [isImportingSlideId, setIsImportingSlideId] = useState<string | null>(null);

  // Google Keep state
  const [keepJsonInput, setKeepJsonInput] = useState("");
  const [keepImportSuccess, setKeepImportSuccess] = useState<string | null>(null);

  // New Creation State
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocInitialText, setNewDocInitialText] = useState("");
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const [showNewSheetForm, setShowNewSheetForm] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState("");
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  const [showNewSlideForm, setShowNewSlideForm] = useState(false);
  const [newSlideTitle, setNewSlideTitle] = useState("");
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);

  // Drive explorer state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Export note state
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"googledoc" | "sheet" | "slide" | "keep" | "markdown">("googledoc");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize Auth on mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessTokenState(token);
        fetchAllServices(token);
      },
      () => {
        setCurrentUser(null);
        setAccessTokenState(null);
      }
    );

    getAccessToken().then((token) => {
      if (token) {
        setAccessTokenState(token);
        fetchAllServices(token);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const fetchAllServices = (token: string) => {
    fetchGoogleDocs(token);
    fetchGoogleSheets(token);
    fetchGoogleSlides(token);
    fetchDriveFiles(token);
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessTokenState(res.accessToken);
        fetchAllServices(res.accessToken);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Não foi possível autenticar com o Google Workspace.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setAccessTokenState(null);
      setGoogleDocs([]);
      setGoogleSheets([]);
      setGoogleSlides([]);
      setDriveFiles([]);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  const fetchGoogleDocs = async (token?: string, search?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingDocs(true);
    try {
      const docs = await listGoogleDocsFiles(t, search || docsSearchQuery);
      setGoogleDocs(docs);
    } catch (err: any) {
      console.error("Failed to load Google Docs:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchGoogleSheets = async (token?: string, search?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingSheets(true);
    try {
      const sheets = await listGoogleSheetsFiles(t, search || sheetsSearchQuery);
      setGoogleSheets(sheets);
    } catch (err: any) {
      console.error("Failed to load Google Sheets:", err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const fetchGoogleSlides = async (token?: string, search?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingSlides(true);
    try {
      const slides = await listGoogleSlidesFiles(t, search || slidesSearchQuery);
      setGoogleSlides(slides);
    } catch (err: any) {
      console.error("Failed to load Google Slides:", err);
    } finally {
      setIsLoadingSlides(false);
    }
  };

  const fetchDriveFiles = async (token?: string, search?: string) => {
    const t = token || accessToken;
    if (!t) return;
    setIsLoadingFiles(true);
    try {
      const files = await listGoogleDriveFiles(t, search || searchQuery);
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Failed to load drive files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Import Google Doc
  const handleImportDocContent = async (item: GoogleDriveItem) => {
    if (!accessToken) return;
    setIsImportingDocId(item.id);
    setAuthError(null);
    try {
      const docDetail = await getGoogleDocument(accessToken, item.id);
      if (onImportGoogleDoc) {
        onImportGoogleDoc(docDetail);
      }
      onClose();
    } catch (err: any) {
      console.error("Erro ao importar Google Doc:", err);
      setAuthError(err.message || "Erro ao carregar o conteúdo do Google Doc.");
    } finally {
      setIsImportingDocId(null);
    }
  };

  // Import Google Sheet
  const handleImportSheetContent = async (item: GoogleDriveItem) => {
    if (!accessToken) return;
    setIsImportingSheetId(item.id);
    setAuthError(null);
    try {
      const sheetDetail = await getGoogleSpreadsheet(accessToken, item.id);
      if (onImportGoogleSheet) {
        onImportGoogleSheet(sheetDetail);
      }
      onClose();
    } catch (err: any) {
      console.error("Erro ao importar Google Sheet:", err);
      setAuthError(err.message || "Erro ao carregar os dados da Planilha.");
    } finally {
      setIsImportingSheetId(null);
    }
  };

  // Import Google Slide
  const handleImportSlideContent = async (item: GoogleDriveItem) => {
    if (!accessToken) return;
    setIsImportingSlideId(item.id);
    setAuthError(null);
    try {
      const slideDetail = await getGooglePresentation(accessToken, item.id);
      if (onImportGoogleSlide) {
        onImportGoogleSlide(slideDetail);
      }
      onClose();
    } catch (err: any) {
      console.error("Erro ao importar Google Slide:", err);
      setAuthError(err.message || "Erro ao carregar os slides da apresentação.");
    } finally {
      setIsImportingSlideId(null);
    }
  };

  // Create Google Doc
  const handleCreateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newDocTitle.trim()) return;
    setIsCreatingDoc(true);
    try {
      const result = await createGoogleDocument(accessToken, newDocTitle.trim(), newDocInitialText);
      if (onImportGoogleDoc) {
        onImportGoogleDoc({
          documentId: result.documentId,
          title: result.title,
          contentHtml: newDocInitialText ? `<p>${newDocInitialText}</p>` : "<p>Documento criado no Google Docs.</p>",
          plainText: newDocInitialText || "",
          webViewLink: result.webViewLink,
        });
      }
      setNewDocTitle("");
      setNewDocInitialText("");
      setShowNewDocForm(false);
      fetchGoogleDocs(accessToken);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Erro ao criar Google Doc.");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Create Google Sheet
  const handleCreateGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newSheetTitle.trim()) return;
    setIsCreatingSheet(true);
    try {
      const initialSample = [
        ["Item / Descrição", "Valor (R$)", "Quantidade", "Total"],
        ["Serviço A", "150", "2", "300"],
        ["Serviço B", "450", "1", "450"],
      ];
      const result = await createGoogleSpreadsheet(accessToken, newSheetTitle.trim(), initialSample);
      if (onImportGoogleSheet) {
        onImportGoogleSheet({
          spreadsheetId: result.spreadsheetId,
          title: result.title,
          sheetNames: ["Página1"],
          values: initialSample,
          webViewLink: result.webViewLink,
        });
      }
      setNewSheetTitle("");
      setShowNewSheetForm(false);
      fetchGoogleSheets(accessToken);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Erro ao criar Planilha do Google.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Create Google Slide
  const handleCreateGoogleSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newSlideTitle.trim()) return;
    setIsCreatingSlide(true);
    try {
      const result = await createGooglePresentation(accessToken, newSlideTitle.trim());
      if (onImportGoogleSlide) {
        onImportGoogleSlide({
          presentationId: result.presentationId,
          title: result.title,
          slidesCount: 1,
          webViewLink: result.webViewLink,
          slidesText: [result.title],
        });
      }
      setNewSlideTitle("");
      setShowNewSlideForm(false);
      fetchGoogleSlides(accessToken);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Erro ao criar Apresentação do Google.");
    } finally {
      setIsCreatingSlide(false);
    }
  };

  // Import Keep JSON
  const handleImportKeepJson = () => {
    if (!keepJsonInput.trim()) return;
    try {
      const imported = parseGoogleKeepJson(keepJsonInput.trim());
      if (onImportKeepNotes) {
        onImportKeepNotes(imported);
      }
      setKeepImportSuccess(`Sucesso! ${imported.length} nota(s) importada(s) do Google Keep.`);
      setKeepJsonInput("");
    } catch (err: any) {
      setAuthError(err.message || "Erro ao importar JSON do Google Keep.");
    }
  };

  // Export Note
  const handleExportNote = async () => {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note) return;

    setIsExporting(true);
    setExportSuccess(null);
    setAuthError(null);

    try {
      if (exportFormat === "keep") {
        const keepExport = exportNoteToKeepFormat(note);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(keepExport, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${note.title || "nota"}_keep_export.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setExportSuccess(`Nota "${note.title}" exportada para formato compatível com Google Keep!`);
      } else if (exportFormat === "sheet" && accessToken) {
        let sampleRows: string[][] = [
          ["Título", note.title],
          ["Conteúdo", note.content.replace(/<[^>]+>/g, " ")],
        ];
        if (note.sheetData) {
          const rows: string[][] = [];
          for (let r = 1; r <= (note.sheetData.rows || 5); r++) {
            const row: string[] = [];
            for (let c = 0; c < (note.sheetData.cols || 4); c++) {
              const colLetter = String.fromCharCode(65 + c);
              row.push(note.sheetData.data[`${colLetter}${r}`]?.value || "");
            }
            rows.push(row);
          }
          sampleRows = rows;
        }
        await createGoogleSpreadsheet(accessToken, note.title || "Planilha KeepDocs", sampleRows);
        setExportSuccess(`Nota "${note.title}" exportada com sucesso para Google Sheets!`);
        fetchGoogleSheets(accessToken);
      } else if (exportFormat === "slide" && accessToken) {
        await createGooglePresentation(accessToken, note.title || "Apresentação KeepDocs");
        setExportSuccess(`Apresentação "${note.title}" criada no Google Slides!`);
        fetchGoogleSlides(accessToken);
      } else if (exportFormat === "googledoc" && accessToken) {
        await createGoogleDocument(accessToken, note.title || "Nota KeepDocs", note.content);
        setExportSuccess(`Nota "${note.title}" exportada como Google Doc nativo!`);
        fetchGoogleDocs(accessToken);
      } else if (accessToken) {
        const plainContent = note.content.replace(/<[^>]+>/g, "\n");
        const title = `${note.title || "Nota KeepDocs"}.md`;
        await uploadNoteToGoogleDrive(accessToken, title, plainContent);
        setExportSuccess(`Nota "${note.title}" exportada como Markdown para o Drive!`);
        fetchDriveFiles(accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || "Erro ao exportar nota.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#002b36]/85 p-2 backdrop-blur-sm sm:p-6">
      <div className="relative flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.15)] bg-[#073642] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-[#2aa198]/15 p-2 text-[#2aa198]">
              <Cloud className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#eee8d5]">
                  Google Workspace Central
                </h2>
                {accessToken ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#859900]/15 px-2 py-0.5 text-[10px] font-semibold text-[#859900] border border-[#859900]/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#002b36] px-2 py-0.5 text-[10px] font-semibold text-[#93a1a1] border border-[rgba(147,161,161,0.12)]">
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#93a1a1]">
                Google Docs • Google Sheets • Google Slides • Google Keep • Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Bar */}
        <div className="border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          {currentUser && accessToken ? (
            <div className="flex items-center gap-2.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "Google User"}
                  className="h-7 w-7 rounded-full border border-[rgba(147,161,161,0.2)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#268bd2] text-xs font-bold text-[#002b36]">
                  {currentUser.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="text-xs">
                <span className="font-semibold text-[#eee8d5]">{currentUser.displayName || currentUser.email}</span>
                <span className="hidden sm:inline text-[11px] text-[#93a1a1]"> (Escopos ativos do Workspace)</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#93a1a1]">
              Conecte sua conta Google para sincronizar Docs, Planilhas, Slides e Keep
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentUser && accessToken ? (
              <>
                <button
                  onClick={() => fetchAllServices(accessToken)}
                  disabled={isLoadingDocs || isLoadingSheets || isLoadingSlides || isLoadingFiles}
                  className="flex items-center gap-1.5 rounded-lg border border-[rgba(147,161,161,0.12)] bg-[#073642] px-2.5 py-1 text-xs font-medium text-[#eee8d5] hover:bg-[#0a4553] transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingDocs ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 rounded-lg bg-[#073642] px-2.5 py-1 text-xs font-medium text-[#dc322f] hover:bg-[#dc322f]/15 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="flex items-center gap-2 rounded-xl bg-[#2aa198] px-4 py-1.5 text-xs font-bold text-[#002b36] shadow-sm hover:brightness-105 active:scale-95 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>{isAuthenticating ? "Conectando..." : "Conectar com Google"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="flex items-center gap-2 bg-[#dc322f]/15 border-b border-[#dc322f]/30 px-6 py-2 text-xs text-[#dc322f]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/30 px-3 sm:px-6 no-scrollbar">
          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "docs" ? "border-[#2aa198] text-[#2aa198]" : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#268bd2]" />
            <span>Google Docs ({googleDocs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("sheets")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "sheets" ? "border-[#2aa198] text-[#2aa198]" : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#859900]" />
            <span>Google Sheets ({googleSheets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("slides")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "slides" ? "border-[#2aa198] text-[#2aa198]" : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
            }`}
          >
            <Presentation className="h-3.5 w-3.5 text-[#b58900]" />
            <span>Google Slides ({googleSlides.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("keep")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "keep" ? "border-[#2aa198] text-[#2aa198]" : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5 text-[#b58900]" />
            <span>Google Keep</span>
          </button>
          <button
            onClick={() => setActiveTab("explorer")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "explorer" ? "border-[#2aa198] text-[#2aa198]" : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Drive Explorer ({driveFiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === "export" ? "border-[#2aa198] text-[#2aa198]" : "border-transparent text-[#93a1a1] hover:text-[#eee8d5]"
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-[#6c71c4]" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB: GOOGLE DOCS */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (accessToken) fetchGoogleDocs(accessToken, docsSearchQuery);
                  }}
                  className="relative w-full sm:w-72"
                >
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#586e75]" />
                  <input
                    type="text"
                    value={docsSearchQuery}
                    onChange={(e) => setDocsSearchQuery(e.target.value)}
                    placeholder="Buscar Google Docs..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] py-1.5 pl-9 pr-4 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                  />
                </form>

                <button
                  onClick={() => setShowNewDocForm(true)}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#2aa198] px-4 py-2 text-xs font-bold text-[#002b36] shadow-sm hover:brightness-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Google Doc</span>
                </button>
              </div>

              {showNewDocForm && (
                <form onSubmit={handleCreateGoogleDoc} className="rounded-2xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-[#2aa198]">Criar Documento Google Docs</h4>
                    <button type="button" onClick={() => setShowNewDocForm(false)} className="text-[#93a1a1]">✕</button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Título do Documento..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-2 text-xs text-[#eee8d5] outline-none"
                  />
                  <textarea
                    rows={2}
                    value={newDocInitialText}
                    onChange={(e) => setNewDocInitialText(e.target.value)}
                    placeholder="Texto inicial opcional..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-2 text-xs text-[#eee8d5] outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowNewDocForm(false)} className="px-3 py-1 text-xs text-[#93a1a1]">Cancelar</button>
                    <button type="submit" disabled={isCreatingDoc} className="rounded-xl bg-[#2aa198] px-4 py-1.5 text-xs font-bold text-[#002b36]">
                      {isCreatingDoc ? "Criando..." : "Criar no Google Docs"}
                    </button>
                  </div>
                </form>
              )}

              {isLoadingDocs ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-[#2aa198]" /></div>
              ) : googleDocs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[rgba(147,161,161,0.2)] bg-[#002b36]/40 p-8 text-center text-xs text-[#93a1a1]">
                  Nenhum Google Doc encontrado. Clique em "+ Novo Google Doc" para criar.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {googleDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-3 hover:border-[rgba(147,161,161,0.3)]">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="rounded-lg bg-[#268bd2]/15 p-2 text-[#268bd2] shrink-0"><FileText className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#eee8d5]">{doc.name}</p>
                          <p className="text-[10px] text-[#586e75]">{doc.modifiedTime ? `Modificado em ${new Date(doc.modifiedTime).toLocaleDateString("pt-BR")}` : "Google Docs"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleImportDocContent(doc)}
                          disabled={isImportingDocId === doc.id}
                          className="flex items-center gap-1 rounded-lg bg-[#2aa198]/15 px-2.5 py-1.5 text-xs font-semibold text-[#2aa198] hover:bg-[#2aa198]/25"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Abrir no Editor</span>
                        </button>
                        <a href={doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#93a1a1] hover:text-[#eee8d5]">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: GOOGLE SHEETS */}
          {activeTab === "sheets" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (accessToken) fetchGoogleSheets(accessToken, sheetsSearchQuery);
                  }}
                  className="relative w-full sm:w-72"
                >
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#586e75]" />
                  <input
                    type="text"
                    value={sheetsSearchQuery}
                    onChange={(e) => setSheetsSearchQuery(e.target.value)}
                    placeholder="Buscar Planilhas Google Sheets..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] py-1.5 pl-9 pr-4 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                  />
                </form>

                <button
                  onClick={() => setShowNewSheetForm(true)}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#859900] px-4 py-2 text-xs font-bold text-[#002b36] shadow-sm hover:brightness-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Planilha Google</span>
                </button>
              </div>

              {showNewSheetForm && (
                <form onSubmit={handleCreateGoogleSheet} className="rounded-2xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-[#859900]">Criar Planilha no Google Sheets</h4>
                    <button type="button" onClick={() => setShowNewSheetForm(false)} className="text-[#93a1a1]">✕</button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="Título da Planilha..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-2 text-xs text-[#eee8d5] outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowNewSheetForm(false)} className="px-3 py-1 text-xs text-[#93a1a1]">Cancelar</button>
                    <button type="submit" disabled={isCreatingSheet} className="rounded-xl bg-[#859900] px-4 py-1.5 text-xs font-bold text-[#002b36]">
                      {isCreatingSheet ? "Criando..." : "Criar no Google Sheets"}
                    </button>
                  </div>
                </form>
              )}

              {isLoadingSheets ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-[#859900]" /></div>
              ) : googleSheets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[rgba(147,161,161,0.2)] bg-[#002b36]/40 p-8 text-center text-xs text-[#93a1a1]">
                  Nenhuma Planilha Google Sheets encontrada.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {googleSheets.map((sheet) => (
                    <div key={sheet.id} className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-3 hover:border-[rgba(147,161,161,0.3)]">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="rounded-lg bg-[#859900]/15 p-2 text-[#859900] shrink-0"><FileSpreadsheet className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#eee8d5]">{sheet.name}</p>
                          <p className="text-[10px] text-[#586e75]">Planilha do Google</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleImportSheetContent(sheet)}
                          disabled={isImportingSheetId === sheet.id}
                          className="flex items-center gap-1 rounded-lg bg-[#859900]/15 px-2.5 py-1.5 text-xs font-semibold text-[#859900] hover:bg-[#859900]/25"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Abrir no MiniSheet</span>
                        </button>
                        <a href={sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#93a1a1] hover:text-[#eee8d5]">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: GOOGLE SLIDES */}
          {activeTab === "slides" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (accessToken) fetchGoogleSlides(accessToken, slidesSearchQuery);
                  }}
                  className="relative w-full sm:w-72"
                >
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#586e75]" />
                  <input
                    type="text"
                    value={slidesSearchQuery}
                    onChange={(e) => setSlidesSearchQuery(e.target.value)}
                    placeholder="Buscar Apresentações Google Slides..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] py-1.5 pl-9 pr-4 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                  />
                </form>

                <button
                  onClick={() => setShowNewSlideForm(true)}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#b58900] px-4 py-2 text-xs font-bold text-[#002b36] shadow-sm hover:brightness-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novos Slides</span>
                </button>
              </div>

              {showNewSlideForm && (
                <form onSubmit={handleCreateGoogleSlide} className="rounded-2xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-[#b58900]">Criar Apresentação no Google Slides</h4>
                    <button type="button" onClick={() => setShowNewSlideForm(false)} className="text-[#93a1a1]">✕</button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newSlideTitle}
                    onChange={(e) => setNewSlideTitle(e.target.value)}
                    placeholder="Título da Apresentação..."
                    className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-2 text-xs text-[#eee8d5] outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowNewSlideForm(false)} className="px-3 py-1 text-xs text-[#93a1a1]">Cancelar</button>
                    <button type="submit" disabled={isCreatingSlide} className="rounded-xl bg-[#b58900] px-4 py-1.5 text-xs font-bold text-[#002b36]">
                      {isCreatingSlide ? "Criando..." : "Criar no Google Slides"}
                    </button>
                  </div>
                </form>
              )}

              {isLoadingSlides ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-[#b58900]" /></div>
              ) : googleSlides.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[rgba(147,161,161,0.2)] bg-[#002b36]/40 p-8 text-center text-xs text-[#93a1a1]">
                  Nenhuma Apresentação Google Slides encontrada.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {googleSlides.map((slide) => (
                    <div key={slide.id} className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-3 hover:border-[rgba(147,161,161,0.3)]">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="rounded-lg bg-[#b58900]/15 p-2 text-[#b58900] shrink-0"><Presentation className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#eee8d5]">{slide.name}</p>
                          <p className="text-[10px] text-[#586e75]">Google Slides</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleImportSlideContent(slide)}
                          disabled={isImportingSlideId === slide.id}
                          className="flex items-center gap-1 rounded-lg bg-[#b58900]/15 px-2.5 py-1.5 text-xs font-semibold text-[#b58900] hover:bg-[#b58900]/25"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Importar Slides</span>
                        </button>
                        <a href={slide.webViewLink || `https://docs.google.com/presentation/d/${slide.id}/edit`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#93a1a1] hover:text-[#eee8d5]">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: GOOGLE KEEP */}
          {activeTab === "keep" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#b58900]">
                  <CheckSquare className="h-4 w-4" />
                  <span>Importação de Notas e Checklists do Google Keep</span>
                </div>
                <p className="text-xs text-[#93a1a1]">
                  Cole aqui o JSON de uma nota ou backup do Google Takeout Keep para importar listas de verificação, notas e etiquetas instantaneamente.
                </p>

                <textarea
                  rows={6}
                  value={keepJsonInput}
                  onChange={(e) => setKeepJsonInput(e.target.value)}
                  placeholder={`Cole o JSON do Google Keep aqui...\nExemplo:\n{\n  "title": "Minha Lista de Compras",\n  "listContent": [\n    { "text": "Leite", "isChecked": false },\n    { "text": "Café", "isChecked": true }\n  ]\n}`}
                  className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] p-3 text-xs font-mono text-[#eee8d5] outline-none focus:border-[#2aa198]"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#586e75]">Suporta notas de texto e listas de verificação com marcação</span>
                  <button
                    onClick={handleImportKeepJson}
                    disabled={!keepJsonInput.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#b58900] px-4 py-2 text-xs font-bold text-[#002b36] hover:brightness-105 disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importar Notas Keep</span>
                  </button>
                </div>

                {keepImportSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#859900]/30 bg-[#859900]/15 p-3 text-xs text-[#859900]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{keepImportSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DRIVE EXPLORER */}
          {activeTab === "explorer" && (
            <div className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (accessToken) fetchDriveFiles(accessToken, searchQuery);
                }}
                className="relative"
              >
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#586e75]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar arquivos no Google Drive..."
                  className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] py-1.5 pl-9 pr-4 text-xs text-[#eee8d5] outline-none focus:border-[#2aa198]"
                />
              </form>

              {isLoadingFiles ? (
                <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-[#2aa198]" /></div>
              ) : driveFiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#93a1a1]">Nenhum arquivo encontrado no Drive.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {file.mimeType.includes("spreadsheet") && <FileSpreadsheet className="h-4 w-4 text-[#859900]" />}
                        {file.mimeType.includes("presentation") && <Presentation className="h-4 w-4 text-[#b58900]" />}
                        {file.mimeType.includes("document") && <FileText className="h-4 w-4 text-[#268bd2]" />}
                        {!file.mimeType.includes("spreadsheet") && !file.mimeType.includes("presentation") && !file.mimeType.includes("document") && <File className="h-4 w-4 text-[#93a1a1]" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#eee8d5]">{file.name}</p>
                          <p className="text-[10px] text-[#586e75]">{file.size ? `${(parseInt(file.size, 10) / 1024 / 1024).toFixed(1)} MB` : "Nuvem"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {file.mimeType.includes("spreadsheet") ? (
                          <button onClick={() => handleImportSheetContent(file)} className="rounded-lg bg-[#859900]/15 px-2.5 py-1 text-xs font-semibold text-[#859900]">Abrir Sheet</button>
                        ) : file.mimeType.includes("presentation") ? (
                          <button onClick={() => handleImportSlideContent(file)} className="rounded-lg bg-[#b58900]/15 px-2.5 py-1 text-xs font-semibold text-[#b58900]">Abrir Slides</button>
                        ) : (
                          <button onClick={() => handleImportDocContent(file)} className="rounded-lg bg-[#2aa198]/15 px-2.5 py-1 text-xs font-semibold text-[#2aa198]">Abrir Doc</button>
                        )}
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#93a1a1] hover:text-[#eee8d5]"><ExternalLink className="h-3.5 w-3.5" /></a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPORT NOTES */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgba(147,161,161,0.12)] bg-[#002b36] p-4 sm:p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2aa198]">
                  Exportar Nota para Google Docs, Sheets, Slides ou Keep
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#93a1a1] mb-1">Selecione a Nota</label>
                    <select
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] px-3 py-2 text-xs text-[#eee8d5] outline-none"
                    >
                      <option value="">-- Selecione uma nota --</option>
                      {notes.filter((n) => !n.trashed).map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title || "Nota sem título"} ({n.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#93a1a1] mb-1">Destino Workspace</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportFormat("googledoc")}
                        className={`rounded-xl border p-2.5 text-xs text-left transition-colors ${
                          exportFormat === "googledoc" ? "border-[#268bd2] bg-[#268bd2]/15 text-[#268bd2]" : "border-[rgba(147,161,161,0.12)] bg-[#073642] text-[#93a1a1]"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Google Docs</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat("sheet")}
                        className={`rounded-xl border p-2.5 text-xs text-left transition-colors ${
                          exportFormat === "sheet" ? "border-[#859900] bg-[#859900]/15 text-[#859900]" : "border-[rgba(147,161,161,0.12)] bg-[#073642] text-[#93a1a1]"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" /> Google Sheets</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat("slide")}
                        className={`rounded-xl border p-2.5 text-xs text-left transition-colors ${
                          exportFormat === "slide" ? "border-[#b58900] bg-[#b58900]/15 text-[#b58900]" : "border-[rgba(147,161,161,0.12)] bg-[#073642] text-[#93a1a1]"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5"><Presentation className="h-3.5 w-3.5" /> Google Slides</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExportFormat("keep")}
                        className={`rounded-xl border p-2.5 text-xs text-left transition-colors ${
                          exportFormat === "keep" ? "border-[#b58900] bg-[#b58900]/15 text-[#b58900]" : "border-[rgba(147,161,161,0.12)] bg-[#073642] text-[#93a1a1]"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> Google Keep JSON</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleExportNote}
                    disabled={!selectedNoteId || isExporting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2aa198] px-5 py-2.5 text-xs font-bold text-[#002b36] hover:brightness-105 disabled:opacity-50"
                  >
                    <Upload className={`h-4 w-4 ${isExporting ? "animate-spin" : ""}`} />
                    <span>{isExporting ? "Exportando..." : "Exportar Agora"}</span>
                  </button>
                </div>

                {exportSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#859900]/30 bg-[#859900]/15 p-3 text-xs text-[#859900]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{exportSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
