import React from "react";
import { motion } from "motion/react";
import { useDrag, useDrop } from "react-dnd";
import {
  Pin,
  Tag,
  Cloud,
  Copy,
  Trash2,
  FileText,
  ClipboardList,
  FileSpreadsheet,
  PenTool,
  CheckSquare,
  Palette,
  ExternalLink,
  MessageSquare,
  Folder as FolderIcon,
  FolderInput,
  GripVertical,
  RefreshCw,
  Sparkles,
  Share2,
} from "lucide-react";
import { Note, NoteColor, Folder, DND_ITEM_TYPES } from "../types";
import { getNoteColorClasses, getNoteColorDot, evaluateFormula, formatRelativeTime, stripHtml } from "../utils/helpers";
import { getAccessToken, getGoogleDocDrivePreview, extractGoogleDocId } from "../services/googleDriveService";
import { ShareModal } from "./ShareModal";

interface NoteCardProps {
  note: Note;
  folders: Folder[];
  onOpen: (note: Note) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onChangeColor: (id: string, color: NoteColor, e: React.MouseEvent) => void;
  onDuplicate: (note: Note, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onAssignFolder: (id: string, folderId: string | null, e: React.MouseEvent) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folders,
  onOpen,
  onTogglePin,
  onChangeColor,
  onDuplicate,
  onDelete,
  onAssignFolder,
  onReorder,
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showFolderPicker, setShowFolderPicker] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const colorStyle = getNoteColorClasses(note.color);
  const noteFolder = note.folderId ? folders.find((f) => f.id === note.folderId) : undefined;

  // Google Docs Live Preview State
  const docId = note.googleDocId || extractGoogleDocId(note.googleDocUrl) || extractGoogleDocId(note.driveSyncId);
  const isGoogleDocLinked = Boolean(docId || note.googleDocUrl);

  const [previewData, setPreviewData] = React.useState<{
    thumbnailLink?: string;
    snippet?: string;
    modifiedTime?: string;
    name?: string;
    webViewLink?: string;
  } | null>(() => {
    if (note.googleDocThumbnail || note.googleDocSnippet) {
      return {
        thumbnailLink: note.googleDocThumbnail,
        snippet: note.googleDocSnippet,
        modifiedTime: note.googleDocModifiedTime,
        webViewLink: note.googleDocUrl,
      };
    }
    return null;
  });

  const [isFetchingPreview, setIsFetchingPreview] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [imgError, setImgError] = React.useState(false);

  // Auto-fetch Live Preview from Drive API if access token is available and thumbnail is missing
  React.useEffect(() => {
    let isMounted = true;
    const loadDrivePreview = async () => {
      if (!docId) return;
      if (previewData?.thumbnailLink && !imgError) return;

      const token = await getAccessToken();
      if (!token) return;

      try {
        setIsFetchingPreview(true);
        const data = await getGoogleDocDrivePreview(token, docId);
        if (isMounted) {
          setPreviewData({
            thumbnailLink: data.thumbnailLink,
            snippet: data.description || (note.googleDocSnippet ? note.googleDocSnippet : undefined),
            modifiedTime: data.modifiedTime,
            name: data.name,
            webViewLink: data.webViewLink,
          });
          setImgError(false);
          setPreviewError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("Could not fetch Drive live preview for doc:", docId, err);
        }
      } finally {
        if (isMounted) {
          setIsFetchingPreview(false);
        }
      }
    };

    loadDrivePreview();
    return () => {
      isMounted = false;
    };
  }, [docId]);

  // Manual Live Preview Refresh via Drive API
  const handleRefreshLivePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!docId) return;
    setIsFetchingPreview(true);
    setPreviewError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setPreviewError("Conecte-se ao Google Drive para atualizar.");
        return;
      }
      const data = await getGoogleDocDrivePreview(token, docId);
      setPreviewData({
        thumbnailLink: data.thumbnailLink,
        snippet: data.description || previewData?.snippet,
        modifiedTime: data.modifiedTime,
        name: data.name,
        webViewLink: data.webViewLink,
      });
      setImgError(false);
    } catch (err: any) {
      console.error("Erro ao atualizar preview do Drive:", err);
      setPreviewError(err.message || "Erro ao conectar com o Drive API");
    } finally {
      setIsFetchingPreview(false);
      setTimeout(() => setPreviewError(null), 4000);
    }
  };

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: DND_ITEM_TYPES.NOTE,
      item: { id: note.id, title: note.title, folderId: note.folderId, type: note.type, pinned: note.pinned },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [note.id, note.title, note.folderId, note.type, note.pinned]
  );

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_ITEM_TYPES.NOTE,
      canDrop: (item: { id: string }) => item.id !== note.id,
      drop: (item: { id: string }) => {
        if (item.id !== note.id && onReorder) {
          onReorder(item.id, note.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [note.id, onReorder]
  );

  const colors: { name: NoteColor; bgClass: string }[] = [
    { name: "default", bgClass: "bg-white border-zinc-300 dark:bg-zinc-800" },
    { name: "yellow", bgClass: "dot-yellow" },
    { name: "green", bgClass: "dot-green" },
    { name: "teal", bgClass: "dot-teal" },
    { name: "blue", bgClass: "dot-blue" },
    { name: "purple", bgClass: "dot-purple" },
    { name: "pink", bgClass: "dot-pink" },
    { name: "amber", bgClass: "dot-amber" },
  ];

  const getTypeIcon = () => {
    switch (note.type) {
      case "form":
        return <ClipboardList className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />;
      case "sheet":
        return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "canvas":
        return <PenTool className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      case "checklist":
        return <CheckSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div
      ref={(node) => {
        dragRef(node);
        dropRef(node);
      }}
      className={`relative transition-all duration-150 ${isDragging ? "opacity-35 cursor-grabbing" : ""}`}
    >
      {/* Drop Insertion Target Highlight Indicator */}
      {isOver && canDrop && (
        <div className="pointer-events-none absolute -inset-1 z-30 rounded-2xl border-2 border-teal-500 bg-teal-500/10 backdrop-blur-2xs shadow-lg animate-pulse" />
      )}

      <motion.div
        whileHover={isDragging ? undefined : { y: -2, scale: 1.004 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={() => onOpen(note)}
        className={`solarized-card group relative flex flex-col justify-between p-4 transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden ${
          isDragging ? "ring-2 ring-[#2aa198]/60 border-dashed border-[#2aa198] shadow-lg scale-[0.98] opacity-40" : ""
        }`}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className="flex-shrink-0 rounded-lg bg-[#002b36] p-1.5 text-[#93a1a1] group-hover:text-[#eee8d5] transition-colors"
              title="Tipo de nota"
            >
              {getTypeIcon()}
            </span>
            {note.color !== "default" && (
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${getNoteColorDot(note.color)}`}
                title={`Cor: ${note.color}`}
              />
            )}
            <h3 className="card-title line-clamp-2 flex-1">
              {note.title || "Nota Sem Título"}
            </h3>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className="opacity-0 group-hover:opacity-60 text-[#586e75] transition-opacity p-0.5 cursor-grab active:cursor-grabbing hidden sm:inline-block"
              title="Arraste para reordenar"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
            <div className="relative flex items-center justify-center">
              {note.pinned && <div className="pin-glow" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id, e);
                }}
                className={`relative z-10 rounded-lg p-1.5 transition-colors ${
                  note.pinned
                    ? "text-[#b58900] hover:text-[#b58900]/80 opacity-100"
                    : "btn-ghost opacity-80 sm:opacity-0 group-hover:opacity-100"
                }`}
                title={note.pinned ? "Desafixar nota" : "Fixar nota no topo"}
              >
                <Pin className={`h-3.5 w-3.5 ${note.pinned ? "fill-[#b58900] text-[#b58900]" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Preview Area */}
        <div className="my-2.5 flex-1 text-xs text-[#93a1a1] z-10">
          {/* Module 1: Mini-Sheet Preview */}
          {note.type === "sheet" && note.sheetData ? (
            <div className="my-1.5 overflow-x-auto rounded-lg border border-[rgba(147,161,161,0.12)] bg-[#002b36]/60 p-1">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr>
                    {Array.from({ length: Math.min(note.sheetData?.cols || 3, 3) }).map((_, cIdx) => (
                      <th
                        key={cIdx}
                        className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#586e75] border-b border-[rgba(147,161,161,0.12)]"
                      >
                        {String.fromCharCode(65 + cIdx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.min(note.sheetData.rows, 4) }).map((_, rIdx) => (
                    <tr key={rIdx} className="border-t border-[rgba(147,161,161,0.08)] first:border-0">
                      {Array.from({ length: Math.min(note.sheetData?.cols || 3, 3) }).map((_, cIdx) => {
                        const key = `${String.fromCharCode(65 + cIdx)}${rIdx + 1}`;
                        const cell = note.sheetData?.data[key];
                        const evaluated = cell?.formula ? evaluateFormula(cell.formula, note.sheetData!) : cell?.value || "";
                        return (
                          <td
                            key={key}
                            className={`px-2 py-1 font-mono text-xs tabular-nums text-[#eee8d5] ${
                              cell?.bold ? "font-bold text-[#2aa198]" : ""
                            } ${cell?.align === "right" ? "text-right" : ""}`}
                          >
                            <span className="truncate block max-w-[120px]">{evaluated}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Module 2: Image Canvas Preview */}
          {note.type === "canvas" && note.imageAnnotation ? (
            <div className="relative my-1.5 overflow-hidden rounded-lg border border-[rgba(147,161,161,0.12)] bg-[#002b36] h-28 flex items-center justify-center">
              {note.imageAnnotation.base64Image ? (
                <img
                  src={note.imageAnnotation.base64Image}
                  alt="Canvas Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center text-[#586e75]">
                  <PenTool className="h-5 w-5 text-[#6c71c4]/70 mb-1" />
                  <span className="text-[10px]">Canvas Vetorial ({note.imageAnnotation.layers.length} camadas)</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Module 3: Checklist Items Preview */}
          {note.type === "checklist" && note.checklist ? (
            <div className="my-1.5 space-y-1">
              {note.checklist.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                      item.completed
                        ? "border-[#2aa198] bg-[#2aa198] text-[#002b36] font-bold"
                        : "border-[rgba(147,161,161,0.25)] bg-[#002b36]"
                    }`}
                  >
                    {item.completed && "✓"}
                  </span>
                  <span className={`truncate ${item.completed ? "line-through text-[#586e75]" : "text-[#eee8d5]"}`}>
                    {item.text}
                  </span>
                </div>
              ))}
              {note.checklist.length > 4 && (
                <div className="text-[10px] font-medium text-[#586e75] pl-5">
                  +{note.checklist.length - 4} mais itens
                </div>
              )}
            </div>
          ) : null}

          {/* Module 4: Google Docs Live Preview (Drive API Thumbnail & Snippet) */}
          {isGoogleDocLinked && (
            <div className="my-2 space-y-2 rounded-xl border border-[#268bd2]/30 bg-[#002b36]/80 p-2.5 shadow-sm group/preview transition-all duration-200 hover:border-[#268bd2]/50">
              {/* Live Preview Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-[rgba(147,161,161,0.1)] pb-1.5 text-[10px]">
                <div className="flex items-center gap-1.5 text-[#268bd2] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2aa198] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2aa198]"></span>
                  </span>
                  <FileText className="h-3.5 w-3.5" />
                  <span>Google Docs Live Preview</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRefreshLivePreview}
                    disabled={isFetchingPreview}
                    className="rounded-md p-1 text-[#93a1a1] hover:bg-[#073642] hover:text-[#eee8d5] transition-colors disabled:opacity-50"
                    title="Atualizar thumbnail e snippet via Drive API"
                  >
                    <RefreshCw className={`h-3 w-3 ${isFetchingPreview ? "animate-spin text-[#2aa198]" : ""}`} />
                  </button>

                  {(note.googleDocUrl || previewData?.webViewLink) && (
                    <a
                      href={note.googleDocUrl || previewData?.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-md bg-[#268bd2]/20 px-1.5 py-0.5 font-medium text-[#268bd2] hover:bg-[#268bd2]/30 transition-colors"
                      title="Abrir no Google Docs"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Document Thumbnail Preview Area */}
              <div className="relative overflow-hidden rounded-lg border border-[rgba(147,161,161,0.15)] bg-[#073642] aspect-[16/10] flex items-center justify-center group-hover/preview:shadow-md transition-shadow">
                {previewData?.thumbnailLink && !imgError ? (
                  <img
                    src={previewData.thumbnailLink}
                    alt={note.title || "Google Docs Thumbnail"}
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover/preview:scale-[1.03]"
                  />
                ) : (
                  /* Elegant Visual Google Docs Canvas Page Mockup */
                  <div className="flex h-full w-full flex-col justify-between p-3 bg-gradient-to-b from-[#073642] to-[#002b36]">
                    <div className="flex items-center justify-between border-b border-[#268bd2]/20 pb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-sm bg-[#268bd2] flex-shrink-0" />
                        <span className="text-[10px] font-bold text-[#eee8d5] truncate">
                          {note.title || "Documento Google Docs"}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-[#586e75] flex-shrink-0">Drive v3</span>
                    </div>

                    {/* Stylized Document Lines */}
                    <div className="space-y-1.5 my-auto py-1">
                      <div className="h-2 w-3/4 rounded bg-[rgba(147,161,161,0.2)]" />
                      <div className="h-2 w-full rounded bg-[rgba(147,161,161,0.12)]" />
                      <div className="h-2 w-5/6 rounded bg-[rgba(147,161,161,0.15)]" />
                      <div className="h-2 w-2/3 rounded bg-[rgba(147,161,161,0.1)]" />
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-[#586e75]">
                      <span>Página 1</span>
                      <span>
                        {previewData?.modifiedTime
                          ? `Modificado ${formatRelativeTime(previewData.modifiedTime)}`
                          : "Drive Sync Conectado"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Loading state indicator */}
                {isFetchingPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#002b36]/70 backdrop-blur-2xs">
                    <div className="flex items-center gap-1.5 rounded-full bg-[#073642] border border-[#2aa198]/40 px-2.5 py-1 text-[10px] text-[#2aa198] shadow-lg">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Consultando Drive API...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Snippet / Excerpt Callout */}
              <div className="rounded-lg bg-[#073642]/90 border border-[rgba(147,161,161,0.08)] p-2">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#586e75] mb-1">
                  <span>Snippet do Documento</span>
                  <span className="text-[#268bd2] font-mono">Google Docs API</span>
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-[#eee8d5] font-normal italic">
                  "{previewData?.snippet || note.googleDocSnippet || stripHtml(note.content) || "Conteúdo do documento vinculado."}"
                </p>
              </div>

              {previewError && (
                <div className="text-[10px] text-[#cb4b16] italic px-1">
                  {previewError}
                </div>
              )}
            </div>
          )}

          {/* Default / Non-Google Doc Text Snippet */}
          {!isGoogleDocLinked && note.type !== "sheet" && note.type !== "canvas" && note.type !== "checklist" && (
            <p className="line-clamp-3 leading-relaxed font-normal text-[#93a1a1] text-xs">
              {stripHtml(note.content) || "Sem conteúdo em texto."}
            </p>
          )}
        </div>

        {/* Tags, Folder and Attachments Bar */}
        <div className="flex flex-wrap items-center gap-1.5 my-1">
          {noteFolder && (
            <span className="flex items-center gap-1 rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#93a1a1]">
              <FolderIcon className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{noteFolder.name}</span>
            </span>
          )}

          {note.googleDocUrl && (
            <a
              href={note.googleDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md bg-[#268bd2]/15 border border-[#268bd2]/30 px-2 py-0.5 text-[10px] font-semibold text-[#268bd2] hover:bg-[#268bd2]/25 transition-colors"
              title="Abrir no Google Docs"
            >
              <FileText className="h-3 w-3" />
              <span>Google Docs</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}

          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#93a1a1]"
            >
              #{tag}
            </span>
          ))}

          {note.driveAttachments && note.driveAttachments.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#93a1a1]">
              <Cloud className="h-3 w-3" />
              <span>{note.driveAttachments.length} Drive</span>
            </span>
          )}

          {note.tables && note.tables.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#93a1a1]">
              <FileSpreadsheet className="h-3 w-3" />
              <span>{note.tables.length} Sheets</span>
            </span>
          )}

          {note.attachments && note.attachments.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#93a1a1]">
              <Tag className="h-3 w-3" />
              <span>{note.attachments.length} Anexos</span>
            </span>
          )}

          {note.comments && note.comments.length > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-[#002b36] border border-[rgba(147,161,161,0.12)] px-2 py-0.5 text-[10px] font-medium text-[#93a1a1]">
              <MessageSquare className="h-3 w-3" />
              <span>{note.comments.length}</span>
            </span>
          )}
        </div>

        {/* Footer Controls & Timestamp */}
        <div className="mt-2 flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] pt-2 text-[11px] text-[#586e75]">
          <span>{formatRelativeTime(note.updatedAt)}</span>

          {/* Quick Hover Actions Toolbar */}
          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {/* Color Picker Toggle */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="btn-ghost rounded-lg p-1.5"
                title="Mudar cor da etiqueta"
              >
                <Palette className="h-3.5 w-3.5" />
              </button>

              {showColorPicker && (
                <div
                  className="absolute bottom-full left-0 z-50 mb-1 flex items-center gap-1 rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] p-1.5 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={(e) => {
                        onChangeColor(note.id, c.name, e);
                        setShowColorPicker(false);
                      }}
                      className={`h-4 w-4 rounded-full border border-black/20 ${c.bgClass}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              className="btn-ghost rounded-lg p-1.5"
              title="Compartilhar e exportar nota"
            >
              <Share2 className="h-3.5 w-3.5 text-[#268bd2]" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(note, e);
              }}
              className="btn-ghost rounded-lg p-1.5"
              title="Duplicar nota"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            {/* Folder Picker Toggle */}
            {folders.length > 0 && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderPicker(!showFolderPicker);
                  }}
                  className="btn-ghost rounded-lg p-1.5"
                  title="Mover para pasta"
                >
                  <FolderInput className="h-3.5 w-3.5" />
                </button>

                {showFolderPicker && (
                  <div
                    className="absolute bottom-full right-0 z-50 mb-1 w-44 rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642] p-1.5 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        onAssignFolder(note.id, null, e);
                        setShowFolderPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors ${
                        !note.folderId
                          ? "bg-[#0a4553] text-[#eee8d5]"
                          : "text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5]"
                      }`}
                    >
                      Sem pasta
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={(e) => {
                          onAssignFolder(note.id, folder.id, e);
                          setShowFolderPicker(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors ${
                          note.folderId === folder.id
                            ? "bg-[#0a4553] text-[#eee8d5]"
                            : "text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5]"
                        }`}
                      >
                        <FolderIcon className="h-3 w-3 text-[#2aa198]" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id, e);
              }}
              className="btn-ghost rounded-lg p-1.5 hover:text-[#dc322f] hover:bg-[#dc322f]/15"
              title="Mover para lixeira"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onOpen(note)}
              className="btn-ghost rounded-lg p-1.5"
              title="Expandir nota"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Share & Export Modal */}
        <ShareModal
          note={note}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      </motion.div>
    </div>
  );
};
