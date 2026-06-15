"use client";

import { type LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 " +
    "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
    "disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants: Record<string, string> = {
    primary:
      "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-sm",
    secondary:
      "bg-surface-overlay text-text-primary border border-border hover:bg-border-subtle " +
      "active:scale-[0.98]",
    ghost:
      "text-text-secondary hover:text-text-primary hover:bg-surface-overlay",
    danger:
      "bg-error text-white hover:opacity-90 active:scale-[0.98]",
  };

  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-6 text-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
      {!loading && Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : 16} />}
    </button>
  );
}
