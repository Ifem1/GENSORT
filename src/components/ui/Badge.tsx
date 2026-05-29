"use client";

import { clsx } from "clsx";

type BadgeVariant = "purple" | "cyan" | "green" | "amber" | "red" | "gray";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  purple: "bg-primary-purple/20 text-glow-lavender border-primary-purple/30",
  cyan:   "bg-electric-cyan/15 text-electric-cyan border-electric-cyan/30",
  green:  "bg-success-green/15 text-success-green border-success-green/30",
  amber:  "bg-warning-amber/15 text-warning-amber border-warning-amber/30",
  red:    "bg-danger-coral/15 text-danger-coral border-danger-coral/30",
  gray:   "bg-text-muted/10 text-text-muted border-text-muted/20",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "purple",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      )}
      {children}
    </span>
  );
}
