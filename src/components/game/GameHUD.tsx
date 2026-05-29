"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Difficulty } from "@/types";

interface GameHUDProps {
  moves: number;
  timerFormatted: string;
  difficulty: Difficulty;
  level: number;
  historyLength: number;
  isSyncing: boolean;
  isDaily: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onPause?: () => void;
}

const difficultyBadge: Record<Difficulty, React.ReactNode> = {
  easy:   <Badge variant="green">Easy</Badge>,
  medium: <Badge variant="amber">Medium</Badge>,
  hard:   <Badge variant="red">Hard</Badge>,
};

export function GameHUD({
  moves,
  timerFormatted,
  difficulty,
  level,
  historyLength,
  isSyncing,
  isDaily,
  onUndo,
  onRestart,
  onPause,
}: GameHUDProps) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      {/* Top stat bar */}
      <GlassCard raised padding="sm">
        <div className="flex items-center justify-between gap-4">
          {/* Level + difficulty */}
          <div className="flex items-center gap-2 min-w-0">
            {isDaily ? (
              <Badge variant="cyan">Daily</Badge>
            ) : (
              difficultyBadge[difficulty]
            )}
            {!isDaily && (
              <span className="text-text-muted text-sm truncate">
                Level {level}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <motion.div
              className="flex items-center gap-1.5"
              animate={isSyncing ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <svg className="w-4 h-4 text-electric-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-sm font-semibold text-text-main tabular-nums">
                {timerFormatted}
              </span>
            </motion.div>

            {/* Moves */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-glow-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="font-mono text-sm font-semibold text-text-main tabular-nums">
                {moves}
              </span>
            </div>

            {/* Sync indicator */}
            {isSyncing && (
              <motion.div
                className="w-2 h-2 rounded-full bg-electric-cyan"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                title="Syncing to GenLayer"
              />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          }
          onClick={onUndo}
          disabled={historyLength === 0}
          fullWidth
          className="flex-1"
        >
          Undo
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          onClick={onRestart}
          fullWidth
          className="flex-1"
        >
          Restart
        </Button>

        {onPause && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            className="px-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
