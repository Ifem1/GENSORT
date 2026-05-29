"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  raised?: boolean;
  hover?: boolean;
  glow?: boolean;
  glowColor?: "purple" | "cyan" | "green";
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
  animate?: boolean;
}

const glowColors: Record<string, string> = {
  purple: "shadow-[0_0_20px_rgba(139,92,246,0.25)]",
  cyan: "shadow-[0_0_20px_rgba(34,211,238,0.25)]",
  green: "shadow-[0_0_20px_rgba(34,197,94,0.25)]",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function GlassCard({
  children,
  className,
  raised = false,
  hover = false,
  glow = false,
  glowColor = "purple",
  onClick,
  padding = "md",
  animate = false,
}: GlassCardProps) {
  const base = twMerge(
    clsx(
      "rounded-2xl border transition-all duration-300",
      raised
        ? "bg-surface-raised/70 border-white/10"
        : "bg-surface/70 border-white/8",
      "backdrop-blur-md",
      paddingStyles[padding],
      glow && glowColors[glowColor],
      hover &&
        "hover:border-primary-purple/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer",
      onClick && "cursor-pointer",
      className
    )
  );

  if (animate) {
    return (
      <motion.div
        className={base}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        whileHover={hover ? { scale: 1.01, y: -1 } : undefined}
        whileTap={onClick ? { scale: 0.99 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  );
}
