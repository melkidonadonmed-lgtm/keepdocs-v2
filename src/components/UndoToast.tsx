import React, { useEffect, useState } from "react";
import { Undo2, X, CheckCircle2 } from "lucide-react";

export interface UndoAction {
  id: string;
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoToastProps {
  action: UndoAction | null;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ action, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!action) return;

    setProgress(100);
    const duration = action.durationMs || 5000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [action, onDismiss]);

  if (!action) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex w-[90vw] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#073642] shadow-2xl transition-all duration-300 md:bottom-6"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-[#eee8d5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2aa198]" />
          <span className="truncate text-xs sm:text-sm font-medium">{action.message}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              action.onUndo();
              onDismiss();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#2aa198] px-3 py-1.5 text-xs font-semibold text-[#002b36] shadow hover:bg-[#2aa198]/90 transition-colors"
            title="Desfazer alteração"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Desfazer</span>
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-[#93a1a1] hover:bg-[#002b36] hover:text-[#eee8d5] transition-colors"
            title="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Progress bar countdown */}
      <div className="h-1 w-full bg-[#002b36]">
        <div
          className="h-full bg-[#2aa198] transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
