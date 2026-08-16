import { useState, useCallback } from "react";
import { Note } from "../types";
import type { CompanionMode } from "../components/WorkspaceCompanion";

/**
 * Gerencia o estado de todos os modais e painéis flutuantes do workspace:
 * editor de Docs, Formulário, Mini-Sheet, Canvas, Drive Picker,
 * Command Palette, Assistente Gemini e Workspace Companion.
 *
 * Inclui o roteador `openNote`, que abre a nota no editor correto
 * conforme o tipo dela.
 */
export function useModalManager() {
  const [activeNoteForDocs, setActiveNoteForDocs] = useState<Note | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeFormNote, setActiveFormNote] = useState<Note | null>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [activeSheetNote, setActiveSheetNote] = useState<Note | null>(null);
  const [showCanvasModal, setShowCanvasModal] = useState(false);
  const [activeCanvasNote, setActiveCanvasNote] = useState<Note | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [companionMode, setCompanionMode] = useState<CompanionMode>("window");

  // Abre a nota no editor correspondente ao tipo dela
  const openNote = useCallback((note: Note) => {
    if (note.type === "form") {
      setActiveFormNote(note);
      setShowFormModal(true);
    } else if (note.type === "sheet") {
      setActiveSheetNote(note);
      setShowSheetModal(true);
    } else if (note.type === "canvas") {
      setActiveCanvasNote(note);
      setShowCanvasModal(true);
    } else {
      setActiveNoteForDocs(note);
    }
  }, []);

  // Aberturas para criação (sem nota existente)
  const openNewFormModal = useCallback(() => {
    setActiveFormNote(null);
    setShowFormModal(true);
  }, []);

  const openNewSheetModal = useCallback(() => {
    setActiveSheetNote(null);
    setShowSheetModal(true);
  }, []);

  const openNewCanvasModal = useCallback(() => {
    setActiveCanvasNote(null);
    setShowCanvasModal(true);
  }, []);

  // Aberturas diretas com uma nota (usadas por importações)
  const openInDocsEditor = useCallback((note: Note) => {
    setActiveNoteForDocs(note);
  }, []);

  const openInSheetEditor = useCallback((note: Note) => {
    setActiveSheetNote(note);
    setShowSheetModal(true);
  }, []);

  // Fechamentos
  const closeDocsEditor = useCallback(() => setActiveNoteForDocs(null), []);
  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setActiveFormNote(null);
  }, []);
  const closeSheetModal = useCallback(() => {
    setShowSheetModal(false);
    setActiveSheetNote(null);
  }, []);
  const closeCanvasModal = useCallback(() => {
    setShowCanvasModal(false);
    setActiveCanvasNote(null);
  }, []);
  const closeDriveModal = useCallback(() => setShowDriveModal(false), []);
  const closeCommandPalette = useCallback(() => setShowCommandPalette(false), []);
  const closeAIAssistant = useCallback(() => setShowAIAssistant(false), []);
  const closeAnalyticsModal = useCallback(() => setShowAnalyticsModal(false), []);
  const closeCompanion = useCallback(() => setShowCompanion(false), []);

  // Toggles
  const toggleCommandPalette = useCallback(() => setShowCommandPalette((prev) => !prev), []);
  const toggleCompanion = useCallback(() => setShowCompanion((prev) => !prev), []);
  const toggleCompanionMode = useCallback(
    () => setCompanionMode((prev) => (prev === "sidebar" ? "window" : "sidebar")),
    []
  );

  return {
    // Docs editor
    activeNoteForDocs,
    openInDocsEditor,
    closeDocsEditor,
    // Form
    showFormModal,
    activeFormNote,
    openNewFormModal,
    closeFormModal,
    // Sheet
    showSheetModal,
    activeSheetNote,
    openNewSheetModal,
    openInSheetEditor,
    closeSheetModal,
    // Canvas
    showCanvasModal,
    activeCanvasNote,
    openNewCanvasModal,
    closeCanvasModal,
    // Drive picker
    showDriveModal,
    openDriveModal: () => setShowDriveModal(true),
    closeDriveModal,
    // Command palette
    showCommandPalette,
    openCommandPalette: () => setShowCommandPalette(true),
    closeCommandPalette,
    toggleCommandPalette,
    // AI assistant
    showAIAssistant,
    openAIAssistant: () => setShowAIAssistant(true),
    closeAIAssistant,
    // Workspace Analytics Dashboard
    showAnalyticsModal,
    openAnalyticsModal: () => setShowAnalyticsModal(true),
    closeAnalyticsModal,
    // Workspace Companion
    showCompanion,
    companionMode,
    openCompanion: () => setShowCompanion(true),
    closeCompanion,
    toggleCompanion,
    toggleCompanionMode,
    // Roteador principal
    openNote,
  };
}
