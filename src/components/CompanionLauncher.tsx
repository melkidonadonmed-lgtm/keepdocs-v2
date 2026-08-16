import React from "react";
import { Cloud, Sidebar, Sparkles, Command } from "lucide-react";

interface CompanionLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const CompanionLauncher: React.FC<CompanionLauncherProps> = ({
  isOpen,
  onToggle,
}) => {
  if (isOpen) return null;

  return (
    <button
      onClick={onToggle}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 rounded-l-2xl border-y border-l border-[rgba(147,161,161,0.25)] bg-[#073642]/95 px-2.5 py-3 text-xs font-bold text-[#eee8d5] shadow-2xl backdrop-blur-md hover:bg-[#0a4553] hover:text-[#2aa198] hover:pr-3.5 transition-all group"
      title="Abrir Workspace Companion & Google Drive (Ctrl+B)"
      aria-label="Abrir Workspace Companion"
    >
      <div className="flex flex-col items-center gap-1">
        <Cloud className="h-4 w-4 text-[#2aa198] group-hover:scale-110 transition-transform" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] tracking-wider uppercase font-semibold text-[#93a1a1] group-hover:text-[#eee8d5]">
          Drive & Docs
        </span>
        <span className="text-[8px] font-mono text-[#586e75] bg-[#002b36] px-1 py-0.5 rounded border border-[rgba(147,161,161,0.12)]">
          ⌘B
        </span>
      </div>
    </button>
  );
};
