import * as XLSX from "xlsx";
import { Note, EmbeddedTableData, AttachedDocument } from "../types";
import { sanitizeHtml } from "../utils/sanitizeHtml";

// Tamanho máximo de anexo embutido na nota (data URL) — evita estourar a quota do IndexedDB
const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Parser CSV conforme RFC 4180: respeita campos entre aspas,
 * delimitadores e quebras de linha dentro de aspas, e aspas escapadas ("").
 */
function parseCsvText(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

// Converte arquivo para Data URL (sobrevive a reloads, ao contrário de URL.createObjectURL)
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export class DocumentIngestionService {
  /**
   * Extrai texto limpo de arquivos PDF, DOCX, TXT e MD para processamento por IA
   */
  static async extractTextFromDocument(file: File): Promise<string> {
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      throw new Error("O arquivo excede o tamanho máximo permitido de 10 MB.");
    }

    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["pdf", "docx", "txt", "md", "json"];

    if (!allowedExtensions.includes(fileExt)) {
      throw new Error(`Formato .${fileExt} não suportado. Por favor, envie um arquivo PDF, DOCX, TXT ou MD.`);
    }

    try {
      if (fileExt === "txt" || fileExt === "md" || fileExt === "json") {
        const text = await file.text();
        if (!text.trim()) {
          throw new Error("O arquivo fornecido está vazio.");
        }
        return text;
      }

      // Para arquivos PDF e DOCX, extrai os blocos de texto legíveis do binário/stream
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let extractedText = "";

      // Regex para encontrar sequências de texto legíveis (mínimo 3 caracteres)
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawString = decoder.decode(bytes);

      // Limpeza de metadados binários e extração de parágrafos legíveis
      const readableLines = rawString
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
        .split(/\n+|\r+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 3 && /[a-zA-Z0-9À-ÿ]/.test(line));

      extractedText = readableLines.join("\n");

      if (!extractedText.trim() || extractedText.length < 10) {
        throw new Error("Não foi possível extrair nenhum texto preenchível deste arquivo.");
      }

      return extractedText;
    } catch (err: any) {
      if (err.message && err.message.startsWith("O arquivo") || err.message.startsWith("Formato") || err.message.startsWith("Não foi")) {
        throw err;
      }
      throw new Error(`Falha ao ler o conteúdo do arquivo ${fileName}: ${err.message || err}`);
    }
  }

  /**
   * Converte arquivos CSV / XLSX em tabelas interativas da nota
   */
  static async parseSpreadsheetToTable(file: File): Promise<EmbeddedTableData> {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

    let grid: string[][];
    if (fileExt === "xlsx" || fileExt === "xls") {
      // XLSX é binário — parse real da primeira planilha do workbook
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("O arquivo XLSX não contém nenhuma planilha.");
      }
      const sheet = workbook.Sheets[firstSheetName];
      grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    } else {
      const text = await file.text();
      grid = parseCsvText(text);
    }

    grid = grid.filter((row) => row.some((cell) => String(cell).trim() !== ""));

    if (grid.length === 0) {
      throw new Error("O arquivo fornecido está vazio.");
    }

    const headers = grid[0].map((h) => String(h).trim());
    const rows = grid.slice(1).map((columns, rIdx) =>
      headers.map((_, cIdx) => {
        const val = columns[cIdx] !== undefined ? String(columns[cIdx]).trim() : "";
        return {
          id: `cell-${rIdx}-${cIdx}-${Date.now()}`,
          value: val,
          computedValue: val,
        };
      })
    );

    return {
      id: `tbl-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      headers: headers.length > 0 ? headers : ["Coluna 1", "Coluna 2"],
      rows,
      hasHeaderRow: true,
      hasSummaryRow: false,
    };
  }

  /**
   * Importa arquivos Markdown, TXT ou JSON direto para uma nova Nota Híbrida
   */
  static async parseTextFileToNote(file: File): Promise<Partial<Note>> {
    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase();
    const title = fileName.replace(/\.[^/.]+$/, "");
    const rawContent = await file.text();

    if (fileExt === "json") {
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed.title && (parsed.content || parsed.contentHtml)) {
          return {
            ...parsed,
            content: sanitizeHtml(parsed.content || parsed.contentHtml),
            id: `imported_json_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn("JSON não é uma estrutura de nota padrão, importando como texto puro.", err);
      }
    }

    // Converte parágrafos simples para tags HTML no editor Docs
    const htmlContent = rawContent
      .split(/\r?\n\r?\n/)
      .map((paragraph) => {
        const clean = paragraph.trim();
        if (clean.startsWith("# ")) return `<h1>${clean.slice(2)}</h1>`;
        if (clean.startsWith("## ")) return `<h2>${clean.slice(3)}</h2>`;
        if (clean.startsWith("### ")) return `<h3>${clean.slice(4)}</h3>`;
        if (clean.startsWith("- ") || clean.startsWith("* ")) {
          const items = clean.split(/\r?\n/).map((li) => `<li>${li.replace(/^[-*]\s*/, "")}</li>`).join("");
          return `<ul>${items}</ul>`;
        }
        return `<p>${clean.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");

    const fileTypeMap: Record<string, AttachedDocument["fileType"]> = {
      pdf: "pdf",
      docx: "docx",
      csv: "csv",
      xlsx: "xlsx",
      txt: "txt",
      md: "md",
      json: "json",
    };

    // Anexos são persistidos na nota — limite de 2 MB e Data URL para sobreviver a reloads
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(
        `O anexo "${fileName}" excede o limite de 2 MB por arquivo. Reduza o tamanho e tente novamente.`
      );
    }
    const dataUrl = await readFileAsDataUrl(file);

    const attachment: AttachedDocument = {
      id: `att-${Date.now()}`,
      fileName,
      fileType: fileTypeMap[fileExt || "txt"] || "txt",
      fileSize: file.size,
      url: dataUrl,
      extractedText: rawContent.slice(0, 500),
    };

    return {
      title: title || "Nota Importada",
      content: sanitizeHtml(htmlContent) || "<p>Conteúdo importado sem texto.</p>",
      type: "doc",
      color: "blue",
      tags: ["Importado", fileExt ? fileExt.toUpperCase() : "Documento"],
      attachments: [attachment],
      pinned: false,
      archived: false,
      trashed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
