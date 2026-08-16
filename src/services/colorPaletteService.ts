import { NoteColor } from "../types";

export type CustomizableNoteColor = Exclude<NoteColor, "default">;

export interface ColorCategoryMeta {
  key: CustomizableNoteColor;
  label: string;
  description: string;
  defaultHex: string;
  cssVariable: string;
  aliasCssVariables?: string[];
}

export const COLOR_CATEGORIES: ColorCategoryMeta[] = [
  {
    key: "yellow",
    label: "Amarelo Solar",
    description: "Avisos, notas importantes e tarefas do dia a dia",
    defaultHex: "#b58900",
    cssVariable: "--dot-yellow",
    aliasCssVariables: ["--color-note-yellow"],
  },
  {
    key: "green",
    label: "Verde Musgo",
    description: "Finanças, tarefas concluídas e projetos aprovados",
    defaultHex: "#859900",
    cssVariable: "--dot-green",
    aliasCssVariables: ["--color-note-green"],
  },
  {
    key: "teal",
    label: "Teal Suave",
    description: "Design, código, arquitetura e notas de tecnologia",
    defaultHex: "#2aa198",
    cssVariable: "--dot-teal",
    aliasCssVariables: ["--color-note-teal"],
  },
  {
    key: "blue",
    label: "Azul Céu",
    description: "Documentos formais, contratos e assuntos jurídicos",
    defaultHex: "#268bd2",
    cssVariable: "--dot-cyan",
    aliasCssVariables: ["--dot-blue", "--color-note-blue"],
  },
  {
    key: "purple",
    label: "Violeta",
    description: "Brainstormings, atas de reunião e ideação criativa",
    defaultHex: "#6c71c4",
    cssVariable: "--dot-violet",
    aliasCssVariables: ["--dot-purple", "--color-note-purple"],
  },
  {
    key: "pink",
    label: "Magenta / Rosa",
    description: "Projetos pessoais, inspiração e tópicos de destaque",
    defaultHex: "#d33682",
    cssVariable: "--dot-magenta",
    aliasCssVariables: ["--dot-pink", "--color-note-pink"],
  },
  {
    key: "amber",
    label: "Laranja Queimado",
    description: "Prioridade média, prazos próximos e alertas",
    defaultHex: "#cb4b16",
    cssVariable: "--dot-orange",
    aliasCssVariables: ["--dot-amber", "--color-note-amber"],
  },
  {
    key: "red",
    label: "Vermelho Terracota",
    description: "Urgente, bloqueadores críticos e prazos fatais",
    defaultHex: "#dc322f",
    cssVariable: "--dot-red",
    aliasCssVariables: ["--color-note-red"],
  },
  {
    key: "gray",
    label: "Cinza Névoa",
    description: "Arquivos, referências passivas e rascunhos em estudo",
    defaultHex: "#93a1a1",
    cssVariable: "--dot-gray",
    aliasCssVariables: ["--color-note-gray"],
  },
];

export const DEFAULT_NOTE_COLORS: Record<CustomizableNoteColor, string> = {
  yellow: "#b58900",
  green: "#859900",
  teal: "#2aa198",
  blue: "#268bd2",
  purple: "#6c71c4",
  pink: "#d33682",
  amber: "#cb4b16",
  red: "#dc322f",
  gray: "#93a1a1",
};

export interface ColorPalettePreset {
  id: string;
  name: string;
  description: string;
  colors: Record<CustomizableNoteColor, string>;
}

export const COLOR_PALETTE_PRESETS: ColorPalettePreset[] = [
  {
    id: "solarized_dark",
    name: "Solarized Classic (Padrão)",
    description: "A paleta de precisão ótica original desenhada por Ethan Schoonover.",
    colors: {
      yellow: "#b58900",
      green: "#859900",
      teal: "#2aa198",
      blue: "#268bd2",
      purple: "#6c71c4",
      pink: "#d33682",
      amber: "#cb4b16",
      red: "#dc322f",
      gray: "#93a1a1",
    },
  },
  {
    id: "pastel_breeze",
    name: "Pastel Macaron",
    description: "Tons suaves, relaxantes e de baixo contraste para um ambiente aconchegante.",
    colors: {
      yellow: "#f6d365",
      green: "#96e6a1",
      teal: "#48cae4",
      blue: "#70a1ff",
      purple: "#a29bfe",
      pink: "#ff9ff3",
      amber: "#ffbe76",
      red: "#ff7675",
      gray: "#b2bec3",
    },
  },
  {
    id: "cyberpunk_neon",
    name: "Cyberpunk & Neon",
    description: "Cores elétricas hipervibrantes para alta visibilidade no tema escuro.",
    colors: {
      yellow: "#ffe600",
      green: "#00ff88",
      teal: "#00e5ff",
      blue: "#0084ff",
      purple: "#bf00ff",
      pink: "#ff007f",
      amber: "#ff7700",
      red: "#ff003c",
      gray: "#a0a0c0",
    },
  },
  {
    id: "nord_aurora",
    name: "Nord Aurora & Frost",
    description: "Harmonia inspirada nas paisagens árticas escandinavas.",
    colors: {
      yellow: "#ebcb8b",
      green: "#a3be8c",
      teal: "#88c0d0",
      blue: "#81a1c1",
      purple: "#b48ead",
      pink: "#e5b3cc",
      amber: "#d08770",
      red: "#bf616a",
      gray: "#d8dee9",
    },
  },
  {
    id: "nature_botanical",
    name: "Natureza & Terra",
    description: "Matizes orgânicos de folhagens, musgos, terracota e argila natural.",
    colors: {
      yellow: "#d4a373",
      green: "#588157",
      teal: "#3a5a40",
      blue: "#457b9d",
      purple: "#6d597a",
      pink: "#b56576",
      amber: "#e76f51",
      red: "#c1121f",
      gray: "#8d99ae",
    },
  },
  {
    id: "monokai_pro",
    name: "Monokai Pro",
    description: "Paleta contemporânea refinada para desenvolvedores e escrita técnica.",
    colors: {
      yellow: "#ffd866",
      green: "#a9dc76",
      teal: "#78dce8",
      blue: "#72a1ff",
      purple: "#ab9df2",
      pink: "#ff6188",
      amber: "#fc9867",
      red: "#ff453a",
      gray: "#939293",
    },
  },
  {
    id: "sunset_warmth",
    name: "Pôr do Sol Dourado",
    description: "Tons cálidos e acolhedores com degradê de entardecer.",
    colors: {
      yellow: "#f4a261",
      green: "#2a9d8f",
      teal: "#52b788",
      blue: "#3d5a80",
      purple: "#8338ec",
      pink: "#ff006e",
      amber: "#fb5607",
      red: "#e63946",
      gray: "#9c8e80",
    },
  },
];

const STORAGE_KEY = "keepdocs_custom_color_palette";
const EVENT_NAME = "keepdocs:palette-updated";

/**
 * Validates a HEX color string (3 or 6 chars, with or without leading #)
 */
export function isValidHex(hex: string): boolean {
  if (!hex) return false;
  const clean = hex.trim().replace(/^#/, "");
  return /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(clean);
}

/**
 * Normalizes HEX string to format `#RRGGBB` in lowercase
 */
export function normalizeHex(hex: string, fallback: string = "#93a1a1"): string {
  if (!isValidHex(hex)) return fallback;
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${clean.toLowerCase()}`;
}

/**
 * Applies color map directly to document CSS root variables dynamically
 */
export function applyCssVariables(colors: Record<CustomizableNoteColor, string>): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  COLOR_CATEGORIES.forEach((cat) => {
    const rawVal = colors[cat.key] || cat.defaultHex;
    const hex = normalizeHex(rawVal, cat.defaultHex);

    // Primary CSS Variable
    root.style.setProperty(cat.cssVariable, hex);

    // Aliases
    if (cat.aliasCssVariables) {
      cat.aliasCssVariables.forEach((alias) => {
        root.style.setProperty(alias, hex);
      });
    }

    // Dynamic tint / border highlight variable
    root.style.setProperty(`--color-note-${cat.key}-subtle`, `${hex}20`);
    root.style.setProperty(`--color-note-${cat.key}-border`, `${hex}45`);
  });
}

/**
 * Loads custom colors from localStorage, applies them to CSS variables, and returns the map
 */
export function loadCustomColorPalette(): Record<CustomizableNoteColor, string> {
  if (typeof window === "undefined") return { ...DEFAULT_NOTE_COLORS };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const result: Record<CustomizableNoteColor, string> = { ...DEFAULT_NOTE_COLORS };

      COLOR_CATEGORIES.forEach((cat) => {
        if (parsed[cat.key] && isValidHex(parsed[cat.key])) {
          result[cat.key] = normalizeHex(parsed[cat.key], cat.defaultHex);
        }
      });

      applyCssVariables(result);
      return result;
    }
  } catch (e) {
    console.warn("Failed to load custom color palette from localStorage:", e);
  }

  // Fallback to default
  applyCssVariables(DEFAULT_NOTE_COLORS);
  return { ...DEFAULT_NOTE_COLORS };
}

/**
 * Saves and updates colors to localStorage and CSS variables
 */
export function saveCustomColorPalette(colors: Record<CustomizableNoteColor, string>): void {
  if (typeof window === "undefined") return;

  const normalized: Record<CustomizableNoteColor, string> = { ...DEFAULT_NOTE_COLORS };
  COLOR_CATEGORIES.forEach((cat) => {
    normalized[cat.key] = normalizeHex(colors[cat.key] || cat.defaultHex, cat.defaultHex);
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.error("Failed to save color palette:", e);
  }

  applyCssVariables(normalized);

  // Dispatch custom event for reactive UI hooks
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: normalized,
    })
  );
}

/**
 * Resets a single color to its default value
 */
export function resetSingleColor(
  category: CustomizableNoteColor,
  current: Record<CustomizableNoteColor, string>
): Record<CustomizableNoteColor, string> {
  const updated = {
    ...current,
    [category]: DEFAULT_NOTE_COLORS[category],
  };
  saveCustomColorPalette(updated);
  return updated;
}

/**
 * Resets all colors to the default Solarized palette
 */
export function resetAllColors(): Record<CustomizableNoteColor, string> {
  saveCustomColorPalette(DEFAULT_NOTE_COLORS);
  return { ...DEFAULT_NOTE_COLORS };
}

/**
 * Exports current color configuration as JSON string
 */
export function exportPaletteToJson(colors: Record<CustomizableNoteColor, string>): string {
  return JSON.stringify(
    {
      app: "KeepDocs",
      version: "1.0",
      type: "color-palette",
      exportedAt: new Date().toISOString(),
      colors,
    },
    null,
    2
  );
}

/**
 * Imports color configuration from a JSON string
 */
export function importPaletteFromJson(jsonStr: string): Record<CustomizableNoteColor, string> {
  const parsed = JSON.parse(jsonStr);
  const candidateColors = parsed.colors || parsed;

  const result: Record<CustomizableNoteColor, string> = { ...DEFAULT_NOTE_COLORS };

  COLOR_CATEGORIES.forEach((cat) => {
    if (candidateColors[cat.key] && isValidHex(candidateColors[cat.key])) {
      result[cat.key] = normalizeHex(candidateColors[cat.key], cat.defaultHex);
    }
  });

  saveCustomColorPalette(result);
  return result;
}

/**
 * Helper to calculate perceived brightness (0-255) for contrast checking
 */
export function getPerceivedBrightness(hex: string): number {
  const clean = normalizeHex(hex).replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return Math.round((r * 299 + g * 587 + b * 114) / 1000);
}
