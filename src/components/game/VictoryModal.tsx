"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { Difficulty } from "@/types";

interface VictoryModalProps {
  isOpen: boolean;
  moves: number;
  timeSeconds: number;
  difficulty: Difficulty;
  level: number;
  isDaily: boolean;
  isSyncing: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onMenu: () => void;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  dx: number;
  dy: number;
  duration: number;
}

const CONFETTI_COLORS = [
  "#8B5CF6", "#C4B5FD", "#22D3EE", "#22C55E",
  "#F59E0B", "#F87171", "#EC4899", "#3B82F6",
];

// Pre-generated static confetti shapes (seeded to be deterministic)
function makeSeedRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function generateParticles(seed = 42, count = 40): Particle[] {
  const rng = makeSeedRng(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rng() * 100,
    y: -10,
    color: CONFETTI_COLORS[Math.floor(rng() * CONFETTI_COLORS.length)],
    rotation: rng() * 360,
    scale: 0.5 + rng() * 0.5,
    dx: (rng() - 0.5) * 30,
    dy: 60 + rng() * 60,
    duration: 2 + rng(),
  }));
}

// Pre-compute a set of particles for each "batch" based on a rotating seed
const PARTICLE_BATCHES = [0, 1, 2, 3, 4].map((s) => generateParticles(s * 37 + 13));

export function VictoryModal({
  isOpen,
  moves,
  timeSeconds,
  difficulty,
  level,
  isDaily,
  isSyncing,
  onNextLevel,
  onReplay,
  onMenu,
}: VictoryModalProps) {
  // Pick a particle batch on each open, tracked in state (not ref or render-time random)
  const [batchIndex, setBatchIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => {
        setBatchIndex((prev) => (prev + 1) % PARTICLE_BATCHES.length);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  const particles = PARTICLE_BATCHES[batchIndex];
  const stars = timeSeconds < 60 ? 3 : timeSeconds < 120 ? 2 : 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  left: `${p.x}%`,
                  backgroundColor: p.color,
                  scale: p.scale,
                }}
                initial={{ y: "-10%", x: "0%", rotate: p.rotation, opacity: 1 }}
                animate={{
                  y: `${p.dy}vh`,
                  x: `${p.dx}vw`,
                  rotate: p.rotation + 360,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: p.duration, ease: "easeIn" }}
              />
            ))}
          </div>

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-surface/95 backdrop-blur-2xl shadow-2xl shadow-primary-purple/20 overflow-hidden"
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
          >
            {/* Gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary-purple via-electric-cyan to-success-green" />

            <div className="p-8 flex flex-col items-center gap-5">
              {/* Trophy */}
              <motion.div
                animate={{ rotate: [-5, 5, -3, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl"
              >
                🏆
              </motion.div>

              {/* Stars */}
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[1, 2, 3].map((n) => (
                  <motion.span
                    key={n}
                    className="text-3xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: n <= stars ? 1 : 0.5, opacity: n <= stars ? 1 : 0.3 }}
                    transition={{ delay: 0.5 + n * 0.1, type: "spring" }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </motion.div>

              {/* Title */}
              <div className="text-center">
                <motion.h2
                  className="text-2xl font-bold bg-gradient-to-r from-primary-purple to-electric-cyan bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Puzzle Solved!
                </motion.h2>
                <p className="text-text-muted text-sm mt-1">
                  {isDaily
                    ? "Daily Challenge"
                    : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · Level ${level}`}
                </p>
              </div>

              {/* Stats */}
              <motion.div
                className="w-full grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-surface-raised rounded-xl p-3 text-center border border-white/8">
                  <div className="text-2xl font-bold text-glow-lavender">{moves}</div>
                  <div className="text-xs text-text-muted mt-0.5">Moves</div>
                </div>
                <div className="bg-surface-raised rounded-xl p-3 text-center border border-white/8">
                  <div className="text-2xl font-bold text-electric-cyan font-mono">
                    {formatTime(timeSeconds)}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">Time</div>
                </div>
              </motion.div>

              {/* Sync status */}
              {isSyncing && (
                <motion.div
                  className="flex items-center gap-2 text-xs text-text-muted"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-electric-cyan" />
                  Syncing to GenLayer…
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                className="w-full flex flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  glow
                  onClick={onNextLevel}
                  rightIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  }
                >
                  Next Level
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="md" onClick={onReplay}>
                    Replay
                  </Button>
                  <Button variant="ghost" size="md" onClick={onMenu}>
                    Menu
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
