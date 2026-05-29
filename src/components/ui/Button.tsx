"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "xl";

// Omit drag-related HTML events to avoid conflict with framer-motion's onDrag
type SafeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "onAnimationStart"
>;

interface ButtonProps extends SafeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-purple text-white hover:bg-purple-500 active:bg-purple-700 shadow-lg shadow-purple-500/20",
  secondary:
    "bg-surface-raised text-text-main hover:bg-[#263255] border border-white/10",
  ghost:
    "text-text-muted hover:text-text-main hover:bg-white/5",
  danger:
    "bg-danger-coral/20 text-danger-coral border border-danger-coral/30 hover:bg-danger-coral/30",
  success:
    "bg-success-green/20 text-success-green border border-success-green/30 hover:bg-success-green/30",
  outline:
    "border border-primary-purple/40 text-primary-purple hover:bg-primary-purple/10",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
  xl: "px-8 py-4 text-lg rounded-2xl gap-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      glow = false,
      fullWidth = false,
      children,
      className,
      disabled,
      onClick,
      type,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.div
        whileTap={{ scale: isDisabled ? 1 : 0.96 }}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={fullWidth ? "w-full" : "inline-flex"}
      >
        <button
          ref={ref}
          type={type ?? "button"}
          onClick={onClick}
          disabled={isDisabled}
          className={twMerge(
            clsx(
              "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none",
              variantStyles[variant],
              sizeStyles[size],
              fullWidth && "w-full",
              glow && variant === "primary" && "animate-glow-pulse",
              isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
              className
            )
          )}
          {...rest}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            leftIcon
          )}
          {children}
          {!isLoading && rightIcon}
        </button>
      </motion.div>
    );
  }
);

Button.displayName = "Button";
