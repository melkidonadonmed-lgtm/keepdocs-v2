import React from "react";

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "active" | "accent" | "danger";
  size?: "default" | "icon";
  children: React.ReactNode;
  className?: string;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  variant = "ghost",
  size = "default",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-[#2aa198]/40 h-9 rounded-[10px] whitespace-nowrap";

  const sizeClasses =
    size === "icon" ? "w-9 h-9 p-0 flex-shrink-0" : "px-3 py-1.5 flex-shrink-0";

  let variantClasses = "bg-transparent text-[#93a1a1] hover:bg-[#0a4553] hover:text-[#eee8d5]";

  if (variant === "active") {
    variantClasses = "bg-[#0a4553] text-[#2aa198] font-semibold border border-[#2aa198]/30";
  } else if (variant === "accent") {
    variantClasses = "bg-[#2aa198] text-[#002b36] font-bold hover:brightness-105 active:scale-95 shadow-sm";
  } else if (variant === "danger") {
    variantClasses = "bg-transparent text-[#dc322f] hover:bg-[#dc322f]/15 hover:text-[#dc322f]";
  }

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
