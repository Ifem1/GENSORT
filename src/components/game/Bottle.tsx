"use client";

import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { Bottle as BottleType } from "@/types";
import { BOTTLE_HEIGHT } from "@/types";
import { isBottleComplete } from "@/lib/gameLogic";

interface BottleProps {
  bottle: BottleType;
  index: number;
  isSelected: boolean;
  isPourSource: boolean;
  isPourTarget: boolean;
  onClick: (index: number) => void;
}

// Darken a hex colour slightly for bottom segments
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

// Segment brightness gradient from bottom (darker) to top (lighter)
const segmentBrightness = [0.75, 0.85, 0.95, 1.05];

export function Bottle({
  bottle,
  index,
  isSelected,
  isPourSource,
  isPourTarget,
  onClick,
}: BottleProps) {
  const completed = isBottleComplete(bottle) && bottle.length === BOTTLE_HEIGHT;
  const isEmpty = bottle.length === 0;

  return (
    <motion.button
      className={clsx(
        "relative flex flex-col items-center gap-0 focus:outline-none group",
        "transition-all duration-150"
      )}
      onClick={() => onClick(index)}
      animate={
        isSelected
          ? { y: -14, scale: 1.05 }
          : isPourSource
          ? { rotate: [-3, 3, -2, 0], y: -8 }
          : { y: 0, scale: 1 }
      }
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      aria-label={`Bottle ${index + 1}${completed ? " (complete)" : ""}`}
      aria-pressed={isSelected}
    >
      {/* Selection glow ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full blur-xl bg-primary-purple/40 -z-10 scale-125"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Target indicator */}
      {isPourTarget && (
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-2 h-2 bg-electric-cyan rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </motion.div>
      )}

      {/* Bottle neck */}
      <div
        className={clsx(
          "relative w-7 h-5 rounded-t-md border-t border-x transition-all duration-200",
          isSelected
            ? "border-primary-purple/80 bg-primary-purple/10"
            : completed
            ? "border-success-green/60 bg-success-green/10"
            : "border-white/20 bg-white/5"
        )}
      >
        {/* Neck highlight */}
        <div className="absolute inset-x-1 top-1 h-px bg-white/20 rounded-full" />
      </div>

      {/* Bottle body */}
      <div
        className={clsx(
          "relative w-14 overflow-hidden rounded-b-2xl border-x border-b transition-all duration-200",
          isSelected
            ? "border-primary-purple/60"
            : completed
            ? "border-success-green/50 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
            : isPourTarget
            ? "border-electric-cyan/50"
            : "border-white/15"
        )}
        style={{ height: `${BOTTLE_HEIGHT * 36}px` }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/3" />

        {/* Left glass reflection */}
        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/15 rounded-full" />

        {/* Liquid segments – rendered from bottom up */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
          <AnimatePresence>
            {bottle.map((color, segIdx) => (
              <motion.div
                key={`${segIdx}-${color}`}
                className="relative"
                style={{
                  height: 36,
                  backgroundColor: adjustBrightness(
                    color,
                    segmentBrightness[segIdx] ?? 1
                  ),
                }}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0, originY: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Segment separator */}
                {segIdx < bottle.length - 1 && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-black/15" />
                )}
                {/* Bubble effect on top segment */}
                {segIdx === bottle.length - 1 && (
                  <>
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-white/25" />
                    <div className="absolute top-3 left-5 w-1 h-1 rounded-full bg-white/15" />
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty label */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border border-dashed border-white/20" />
          </div>
        )}

        {/* Completed checkmark overlay */}
        <AnimatePresence>
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-7 h-7 rounded-full bg-success-green/20 border border-success-green/50 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-success-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Index label (dev/accessibility) */}
      <span className="mt-1.5 text-[10px] text-text-muted/40 font-mono">
        {index + 1}
      </span>
    </motion.button>
  );
}
