import { NoteColor, SheetData } from "../types";
import { sanitizeHtml } from "./sanitizeHtml";

// Note Background Color Mapper — Paleta acolhedora, equilibrada e confortável (tons areia, linho, musgo e ardósia)
export function getNoteColorClasses(color: NoteColor): { bg: string; border: string; hover: string; tagBg: string } {
  switch (color) {
    case "yellow":
      return {
        bg: "bg-[#1c1a13] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#b58900]/35 border-t-[#b58900]/60",
        hover: "hover:border-[#b58900]/70 hover:shadow-[0_8px_25px_rgba(181,137,0,0.15)]",
        tagBg: "bg-[#282417] text-[#e0b838]",
      };
    case "green":
      return {
        bg: "bg-[#121c17] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#859900]/35 border-t-[#859900]/60",
        hover: "hover:border-[#859900]/70 hover:shadow-[0_8px_25px_rgba(133,153,0,0.15)]",
        tagBg: "bg-[#1c2921] text-[#a6c42a]",
      };
    case "teal":
      return {
        bg: "bg-[#0d1d20] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#2aa198]/35 border-t-[#2aa198]/60",
        hover: "hover:border-[#2aa198]/70 hover:shadow-[0_8px_25px_rgba(42,161,152,0.15)]",
        tagBg: "bg-[#162c30] text-[#52d1c7]",
      };
    case "blue":
      return {
        bg: "bg-[#111c26] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#268bd2]/35 border-t-[#268bd2]/60",
        hover: "hover:border-[#268bd2]/70 hover:shadow-[0_8px_25px_rgba(38,139,210,0.15)]",
        tagBg: "bg-[#1a2938] text-[#6cb5ec]",
      };
    case "purple":
      return {
        bg: "bg-[#181524] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#6c71c4]/35 border-t-[#6c71c4]/60",
        hover: "hover:border-[#6c71c4]/70 hover:shadow-[0_8px_25px_rgba(108,113,196,0.15)]",
        tagBg: "bg-[#232036] text-[#a2a6e6]",
      };
    case "pink":
      return {
        bg: "bg-[#20141b] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#d33682]/35 border-t-[#d33682]/60",
        hover: "hover:border-[#d33682]/70 hover:shadow-[0_8px_25px_rgba(211,54,130,0.15)]",
        tagBg: "bg-[#2e1d27] text-[#f06ba8]",
      };
    case "amber":
      return {
        bg: "bg-[#1f1510] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#cb4b16]/35 border-t-[#cb4b16]/60",
        hover: "hover:border-[#cb4b16]/70 hover:shadow-[0_8px_25px_rgba(203,75,22,0.15)]",
        tagBg: "bg-[#2e2017] text-[#e87545]",
      };
    case "red":
      return {
        bg: "bg-[#201112] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[#dc322f]/35 border-t-[#dc322f]/60",
        hover: "hover:border-[#dc322f]/70 hover:shadow-[0_8px_25px_rgba(220,50,47,0.15)]",
        tagBg: "bg-[#2f1719] text-[#f26360]",
      };
    case "gray":
      return {
        bg: "bg-[#171e22] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[rgba(238,232,213,0.15)] border-t-[rgba(238,232,213,0.3)]",
        hover: "hover:border-[rgba(238,232,213,0.35)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)]",
        tagBg: "bg-[#222a30] text-[#c4d0d0]",
      };
    default:
      // Tom Padrão Areia Suave / Warm Linen Neutral com elevação
      return {
        bg: "bg-[#0b242c] shadow-[0_4px_20px_rgba(0,0,0,0.35)]",
        border: "border-[rgba(147,161,161,0.18)] border-t-[rgba(238,232,213,0.18)]",
        hover: "hover:border-[rgba(147,161,161,0.35)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.45)]",
        tagBg: "bg-[#051a21] text-[#93a1a1]",
      };
  }
}

// Dot colorido discreto (estilo solarized / tons empoeirados elegantes)
export function getNoteColorDot(color: NoteColor): string {
  switch (color) {
    case "yellow": return "dot-yellow";
    case "green": return "dot-green";
    case "teal": return "dot-teal";
    case "blue": return "dot-blue";
    case "purple": return "dot-purple";
    case "pink": return "dot-pink";
    case "amber": return "dot-amber";
    case "red": return "dot-red";
    case "gray": return "dot-gray";
    default: return "bg-transparent";
  }
}

// Format Relative Date
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Agora mesmo";
    if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 86400 * 7) return `Há ${Math.floor(diffInSeconds / 86400)} d`;

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return dateString;
  }
}

// Mini-Sheet Formula Engine
export function evaluateFormula(formula: string, sheetData: SheetData, visited: Set<string> = new Set()): string {
  if (!formula || !formula.startsWith("=")) return formula;

  const rawFormula = formula.trim().substring(1).toUpperCase();

  const getCellValue = (key: string): number => {
    const cell = sheetData.data[key];
    if (!cell) return 0;
    const val = cell.value?.toString().trim() || "0";
    if (val.startsWith("=")) {
      // Detecção de ciclos: célula já visitada nesta cadeia de recursão
      if (visited.has(key)) {
        throw new Error("#CICLO!");
      }
      const nextVisited = new Set(visited);
      nextVisited.add(key);
      const evaled = evaluateFormula(val, sheetData, nextVisited);
      if (evaled === "#CICLO!") {
        throw new Error("#CICLO!");
      }
      return parseFloat(evaled.replace(/[^0-9.-]+/g, "")) || 0;
    }
    const cleanVal = val.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanVal) || 0;
  };

  const parseRangeKeys = (rangeStr: string): string[] => {
    if (!rangeStr.includes(":")) return [rangeStr.trim()];
    const [start, end] = rangeStr.split(":").map((s) => s.trim());
    const startCol = start.charAt(0);
    const startRow = parseInt(start.substring(1));
    const endCol = end.charAt(0);
    const endRow = parseInt(end.substring(1));

    const keys: string[] = [];
    const colStartCharCode = startCol.charCodeAt(0);
    const colEndCharCode = endCol.charCodeAt(0);

    for (let c = colStartCharCode; c <= colEndCharCode; c++) {
      const col = String.fromCharCode(c);
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        keys.push(`${col}${r}`);
      }
    }
    return keys;
  };

  try {
    // 1. Check for SUM(A1:A5)
    if (rawFormula.startsWith("SUM(")) {
      const arg = rawFormula.slice(4, -1);
      const keys = parseRangeKeys(arg);
      const total = keys.reduce((acc, k) => acc + getCellValue(k), 0);
      return total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 2. Check for AVERAGE(A1:A5)
    if (rawFormula.startsWith("AVERAGE(")) {
      const arg = rawFormula.slice(8, -1);
      const keys = parseRangeKeys(arg);
      if (keys.length === 0) return "0.00";
      const total = keys.reduce((acc, k) => acc + getCellValue(k), 0);
      return (total / keys.length).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 3. Check for COUNT(A1:A5)
    if (rawFormula.startsWith("COUNT(")) {
      const arg = rawFormula.slice(6, -1);
      const keys = parseRangeKeys(arg);
      return keys.length.toString();
    }

    // 4. Check for MIN or MAX
    if (rawFormula.startsWith("MIN(")) {
      const arg = rawFormula.slice(4, -1);
      const keys = parseRangeKeys(arg);
      const nums = keys.map((k) => getCellValue(k));
      return Math.min(...nums).toString();
    }
    if (rawFormula.startsWith("MAX(")) {
      const arg = rawFormula.slice(4, -1);
      const keys = parseRangeKeys(arg);
      const nums = keys.map((k) => getCellValue(k));
      return Math.max(...nums).toString();
    }

    // 5. Basic Arithmetic (A1+B1, A1-B1, A1*B1, A1/B1)
    const expressionWithValues = rawFormula.replace(/([A-Z][0-9]+)/g, (match) => {
      return getCellValue(match).toString();
    });

    // Safe eval for arithmetic
    if (/^[0-9.+\-*/()\s]+$/.test(expressionWithValues)) {
      // eslint-disable-next-line no-eval
      const result = eval(expressionWithValues);
      return typeof result === "number" && !isNaN(result)
        ? result.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : "0";
    }

    return formula;
  } catch (err: any) {
    if (err?.message === "#CICLO!") {
      return "#CICLO!";
    }
    console.warn("Formula eval error:", err);
    return "#ERRO!";
  }
}

// Convert HTML to Plain Text for search indexing & snippet previews
export function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = sanitizeHtml(html);
  return tmp.textContent || tmp.innerText || "";
}

// Column Letter Helper (0 -> A, 25 -> Z, 26 -> AA, 27 -> AB, etc)
export function getColumnLetter(colIndex: number): string {
  let letter = "";
  let index = colIndex;
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}
