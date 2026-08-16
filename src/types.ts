export const DND_ITEM_TYPES = {
  NOTE: "NOTE",
} as const;

export type NoteColor =
  | "default"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink"
  | "amber"
  | "red"
  | "gray";

export type NoteType = "standard" | "doc" | "form" | "sheet" | "canvas" | "checklist";

// --- ESTRUTURA DE TABELA INTERATIVA (SHEETS EMBUTIDO) ---
export interface CellData {
  id: string;
  value: string;         // Valor bruto ou fórmula (ex: "=SUM(A1:A5)")
  computedValue?: string;// Valor calculado
  format?: "text" | "number" | "currency" | "date";
  isHeader?: boolean;
}

export interface EmbeddedTableData {
  id: string;
  title: string;
  headers: string[];
  rows: CellData[][];
  hasHeaderRow: boolean;
  hasSummaryRow: boolean;
}

// --- FORMULÁRIOS DINÂMICOS ---
export interface FormFieldSchema {
  id: string;
  key: string; // Ex: "NOME_PACIENTE" -> {{NOME_PACIENTE}}
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox";
  options?: string[];
  defaultValue?: string;
  required?: boolean;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "text_area" | "date" | "number" | "select" | "boolean";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface FormTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  templateContent: string;
  fields: FormField[];
}

export interface SheetCell {
  value: string;
  formula?: string;
  formatted?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
  type?: "text" | "number" | "currency";
}

export interface SheetData {
  rows: number;
  cols: number;
  data: Record<string, SheetCell>; // e.g. "A1": { value: "100" }
}

export interface ImageAnnotationLayer {
  id: string;
  type: "pen" | "highlighter" | "rect" | "circle" | "arrow" | "text";
  points?: { x: number; y: number }[];
  color: string;
  width: number;
  text?: string;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
}

export interface ImageAnnotation {
  base64Image: string;
  layers: ImageAnnotationLayer[];
  width?: number;
  height?: number;
  editedAt?: string;
}

export interface CanvasAnnotation {
  id: string;
  baseImageUrl: string;
  vectorJson: string; // Exportação de vetor em JSON
  renderedImageUrl: string;
}

export interface AttachedDocument {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx" | "csv" | "xlsx" | "image" | "drive" | "txt" | "json" | "md";
  fileSize: number;
  url: string;
  driveFileId?: string;
  extractedText?: string;
}

export interface DriveAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  driveUrl: string;
  syncedAt: string;
  thumbnailUrl?: string;
  fileType: "doc" | "sheet" | "slide" | "pdf" | "image" | "file";
}

export interface Comment {
  id: string;
  author: string;
  avatarUrl?: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Conteúdo HTML do Docs Editor
  plainTextContent?: string;
  type: NoteType;
  color: NoteColor;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  createdAt: string;
  updatedAt: string;
  folderId?: string; // Pasta à qual a nota pertence (opcional)
  
  // Módulos integrados
  tables?: EmbeddedTableData[];
  formTemplateId?: string;
  formValues?: Record<string, any>;
  sheetData?: SheetData;
  annotations?: CanvasAnnotation[];
  imageAnnotation?: ImageAnnotation;
  attachments?: AttachedDocument[];
  driveAttachments?: DriveAttachment[];
  checklist?: ChecklistItem[];
  comments?: Comment[];
  coverImage?: string;
  driveSyncId?: string;
  googleDocId?: string;
  googleDocUrl?: string;
  googleDocThumbnail?: string;
  googleDocSnippet?: string;
  googleDocModifiedTime?: string;
}

// Alias para compatibilidade com especificações do ecossistema híbrido
export type HybridNote = Note;

export type ViewFilter = "all" | "pinned" | "docs" | "forms" | "sheets" | "canvas" | "drive" | "trash" | "archive";
export type LayoutMode = "masonry" | "grid" | "list";

