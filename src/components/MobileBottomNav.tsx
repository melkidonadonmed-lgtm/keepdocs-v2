import React from "react";
import {
  Layers,
  Pin,
  Plus,
  BarChart3,
  Menu,
  FileText,
  FileSpreadsheet,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { ViewFilter } from "../types";

interface MobileBottomNavProps {
  currentFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  onOpenNewNote: () => void;
  onOpenAnalytics: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentFilter,
  onSelectFilter,
  onOpenNewNote,
  onOpenAnalytics,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <nav
      aria-label="Navegação Móvel"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-[rgba(147,161,161,0.15)] bg-[#002b36] px-2 py-1 shadow-2xl md:hidden"
    >
      {/* 1. Todas as Notas */}
      <button
        onClick={() => onSelectFilter("all")}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
          currentFilter === "all" && !isSidebarOpen
            ? "text-[#2aa198]"
            : "text-[#93a1a1] hover:text-[#eee8d5]"
        }`}
      >
        <Layers className="h-5 w-5 mb-0.5" />
        <span>Notas</span>
      </button>

      {/* 2. Fixadas */}
      <button
        onClick={() => onSelectFilter("pinned")}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
          currentFilter === "pinned" && !isSidebarOpen
            ? "text-[#2aa198]"
            : "text-[#93a1a1] hover:text-[#eee8d5]"
        }`}
      >
        <Pin className="h-5 w-5 mb-0.5" />
        <span>Fixadas</span>
      </button>

      {/* 3. Botão Central de Criação Rápida */}
      <button
        onClick={onOpenNewNote}
        className="flex h-11 w-11 -mt-4 items-center justify-center rounded-full bg-[#2aa198] text-[#002b36] shadow-lg active:scale-95 transition-transform"
        title="Criar Nova Nota"
        aria-label="Criar Nova Nota"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* 4. Analytics / Dashboard */}
      <button
        onClick={onOpenAnalytics}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium text-[#93a1a1] hover:text-[#2aa198] transition-colors"
        title="Ver Métricas e Análises"
      >
        <BarChart3 className="h-5 w-5 mb-0.5" />
        <span>Métricas</span>
      </button>

      {/* 5. Menu / Pastas / Drawer */}
      <button
        onClick={onToggleSidebar}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
          isSidebarOpen
            ? "text-[#2aa198]"
            : "text-[#93a1a1] hover:text-[#eee8d5]"
        }`}
        title="Abrir Menu Completo"
        aria-label="Abrir Menu Completo"
      >
        <Menu className="h-5 w-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
