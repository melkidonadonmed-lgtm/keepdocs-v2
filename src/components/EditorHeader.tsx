import React from "react";
import { X } from "lucide-react";
import { GhostButton } from "./GhostButton";

interface EditorHeaderProps {
  icon: React.ReactNode;
  title: string;
  onTitleChange?: (val: string) => void;
  isTitleEditable?: boolean;
  subtitle?: string;
  syncBadge?: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  icon,
  title,
  onTitleChange,
  isTitleEditable = false,
  subtitle,
  syncBadge,
  actions,
  onClose,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-[rgba(147,161,161,0.12)] bg-[#002b36] px-4 py-2.5 sm:px-6 sm:py-3 transition-colors ${className}`}
    >
      {/* Desktop Layout: Single Row */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* Left Side: Icon, Title & Sync Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#073642] text-[#2aa198] border border-[rgba(147,161,161,0.12)] shadow-xs">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isTitleEditable ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onTitleChange?.(e.target.value)}
                  placeholder="Título da Nota..."
                  className="bg-transparent text-sm sm:text-base font-bold text-[#eee8d5] outline-none border-b border-transparent hover:border-[rgba(147,161,161,0.3)] focus:border-[#2aa198] transition-colors max-w-md"
                />
              ) : (
                <span className="text-sm sm:text-base font-bold text-[#eee8d5] truncate">
                  {title}
                </span>
              )}
              {syncBadge}
            </div>
            {subtitle && (
              <p className="text-[11px] text-[#586e75] truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side: Action Pills & Close */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {actions}
          <GhostButton
            size="icon"
            onClick={onClose}
            title="Fechar"
            className="hover:text-[#dc322f]"
          >
            <X className="h-4 w-4" />
          </GhostButton>
        </div>
      </div>

      {/* Mobile Layout: 2-Row Stack (<768px) */}
      <div className="flex flex-col gap-2 md:hidden">
        {/* Row 1: Icon, Title and Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#073642] text-[#2aa198] border border-[rgba(147,161,161,0.12)]">
              {icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isTitleEditable ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    placeholder="Título..."
                    className="bg-transparent text-xs font-bold text-[#eee8d5] outline-none border-b border-transparent focus:border-[#2aa198] w-full max-w-[160px]"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#eee8d5] truncate">
                    {title}
                  </span>
                )}
                {syncBadge}
              </div>
            </div>
          </div>

          <GhostButton
            size="icon"
            onClick={onClose}
            title="Fechar"
            className="h-8 w-8 rounded-[8px]"
          >
            <X className="h-4 w-4" />
          </GhostButton>
        </div>

        {/* Row 2: Actions Bar with Horizontal Scroll and Uniform Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {actions}
        </div>
      </div>
    </div>
  );
};
