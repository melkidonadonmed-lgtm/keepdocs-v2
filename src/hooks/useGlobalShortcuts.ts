import { useEffect, useRef } from "react";

interface UseGlobalShortcutsOptions {
  /** Cmd/Ctrl+K — alterna a Command Palette */
  onToggleCommandPalette: () => void;
  /** Cmd/Ctrl+B (sem Shift) — alterna o Workspace Companion */
  onToggleCompanion: () => void;
}

/**
 * Atalhos de teclado globais do workspace (Cmd/Ctrl+K e Cmd/Ctrl+B).
 *
 * Usa refs para que o listener seja registrado uma única vez e sempre
 * chame a versão mais recente dos callbacks.
 */
export function useGlobalShortcuts({ onToggleCommandPalette, onToggleCompanion }: UseGlobalShortcutsOptions) {
  const paletteRef = useRef(onToggleCommandPalette);
  const companionRef = useRef(onToggleCompanion);
  paletteRef.current = onToggleCommandPalette;
  companionRef.current = onToggleCompanion;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        paletteRef.current();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !e.shiftKey) {
        e.preventDefault();
        companionRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
