import React from "react";
import { Filter, X, ChevronDown, Check } from "lucide-react";

interface TagFilterBarProps {
  allTags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  allTags,
  selectedTag,
  setSelectedTag,
}) => {
  // Session persistence for filter expansion state
  const [isOpen, setIsOpen] = React.useState<boolean>(() => {
    try {
      return sessionStorage.getItem("keepdocs_filters_expanded") === "true";
    } catch {
      return false;
    }
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem("keepdocs_filters_expanded", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (allTags.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-[rgba(147,161,161,0.12)] bg-[#073642]/40 backdrop-blur-sm transition-all">
      {/* Compact Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          {/* "Todas" button */}
          <button
            onClick={() => setSelectedTag(null)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              selectedTag === null
                ? "bg-[#2aa198]/20 text-[#2aa198] border border-[#2aa198]/40 font-semibold"
                : "btn-ghost"
            }`}
          >
            Todas
          </button>

          {/* Active Tag Pill (remains visible even when accordion is collapsed) */}
          {selectedTag && (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#2aa198]/40 bg-[#2aa198]/15 px-2.5 py-1 text-xs font-medium text-[#2aa198] animate-in fade-in duration-150">
              <span>#{selectedTag}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTag(null);
                }}
                className="rounded p-0.5 hover:bg-[#2aa198]/30 transition-colors text-[#2aa198]"
                title="Limpar filtro"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Filter Toggle Button */}
        <button
          onClick={toggleOpen}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
            isOpen
              ? "border-[#2aa198]/40 bg-[#073642] text-[#2aa198]"
              : "border-[rgba(147,161,161,0.12)] bg-[#073642]/60 text-[#93a1a1] hover:text-[#eee8d5] hover:bg-[#0a4553]"
          }`}
          title="Expandir/Recolher catálogo de tags"
        >
          <Filter className="h-3.5 w-3.5 text-[#2aa198]" />
          <span>Filtros</span>
          {selectedTag && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2aa198] text-[10px] font-bold text-[#002b36]">
              1
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#2aa198]" : "text-[#586e75]"
            }`}
          />
        </button>
      </div>

      {/* Pure CSS Accordion Grid Transition (Zero Layout Shift) */}
      <div className={`accordion-wrapper ${isOpen ? "is-open" : ""}`}>
        <div className="accordion-inner">
          <div className="border-t border-[rgba(147,161,161,0.08)] bg-[#073642]/40 px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between pb-2">
              <span className="section-label">Filtrar por etiqueta</span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[11px] font-medium text-[#2aa198] hover:underline"
                >
                  Limpar seleção
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {allTags.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(isActive ? null : tag);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? "border-[#2aa198] bg-[#2aa198] text-[#002b36] font-semibold shadow-xs"
                        : "border-[rgba(147,161,161,0.12)] bg-[#073642] text-[#93a1a1] hover:border-[rgba(147,161,161,0.3)] hover:text-[#eee8d5] hover:bg-[#0a4553]"
                    }`}
                  >
                    {isActive && <Check className="h-3 w-3 text-[#002b36]" />}
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
