"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useGameStore } from "@/store/gameStore";
import { useGame } from "@/hooks/useGame";
import { getPuzzleForLevel, getDailyChallengePuzzle } from "@/lib/puzzles";
import { getAllScores } from "@/lib/db";
import type { Difficulty, LevelScore, Puzzle } from "@/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const LEVELS_PER_PAGE = 20;

export default function PuzzlesPage() {
  const router = useRouter();
  const { session, selectedDifficulty, setDifficulty } = useGameStore();
  const { startPuzzle } = useGame();
  const [scores, setScores] = useState<Record<string, LevelScore>>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session) { router.push("/signin"); return; }
    void getAllScores().then((s) => {
      const map: Record<string, LevelScore> = {};
      s.forEach((sc) => { map[sc.levelId] = sc; });
      setScores(map);
    });
  }, [session, router]);

  const handlePlay = (p: Puzzle) => {
    startPuzzle(p);
    router.push("/game");
  };

  const daily = getDailyChallengePuzzle();
  const levelStart = (page - 1) * LEVELS_PER_PAGE + 1;
  const levelEnd = page * LEVELS_PER_PAGE;

  const levels = Array.from({ length: LEVELS_PER_PAGE }, (_, i) =>
    getPuzzleForLevel(levelStart + i, selectedDifficulty)
  );

  const diffBadge: Record<Difficulty, React.ReactNode> = {
    easy:   <Badge variant="green">Easy</Badge>,
    medium: <Badge variant="amber">Medium</Badge>,
    hard:   <Badge variant="red">Hard</Badge>,
  };

  if (!session) return null;

  return (
    <div className="min-h-dvh px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-main">Puzzle Select</h1>
        <p className="text-text-muted text-sm mt-1">Choose a challenge to start solving</p>
      </motion.div>

      {/* Daily challenge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard
          raised
          hover
          glow
          glowColor="cyan"
          padding="md"
          onClick={() => handlePlay(daily)}
          animate
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-electric-cyan/15 border border-electric-cyan/30 flex items-center justify-center text-2xl flex-shrink-0">
              🌅
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-main">Daily Challenge</span>
                <Badge variant="cyan" size="sm">Today</Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {daily.difficulty.charAt(0).toUpperCase() + daily.difficulty.slice(1)} difficulty ·
                Same for all players today
              </p>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              Play
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Difficulty tabs */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => { setDifficulty(d); setPage(1); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedDifficulty === d
                ? "bg-primary-purple/20 border-primary-purple/40 text-glow-lavender"
                : "bg-transparent border-white/10 text-text-muted hover:border-white/20 hover:text-text-main"
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Level grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {levels.map((puzzle, i) => {
          const score = scores[puzzle.id];
          const completed = !!score;

          return (
            <motion.button
              key={puzzle.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePlay(puzzle)}
              className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                completed
                  ? "bg-success-green/10 border-success-green/30 text-success-green"
                  : "bg-surface-raised/60 border-white/10 text-text-muted hover:border-primary-purple/30 hover:text-text-main"
              }`}
            >
              <span className="text-lg font-bold">{puzzle.level}</span>
              {completed && (
                <span className="text-[9px] opacity-70">
                  {score.moves}m
                </span>
              )}
              {completed && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-success-green" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Previous
        </Button>
        <span className="text-sm text-text-muted">
          Levels {levelStart}–{levelEnd}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </Button>
      </div>

      {/* Difficulty info */}
      <GlassCard padding="md" className="flex items-center gap-3">
        {diffBadge[selectedDifficulty]}
        <p className="text-xs text-text-muted">
          {selectedDifficulty === "easy" && "4 colours, 6 bottles. Perfect for beginners."}
          {selectedDifficulty === "medium" && "6 colours, 8 bottles. A satisfying challenge."}
          {selectedDifficulty === "hard" && "9 colours, 11 bottles. Only for true masters."}
        </p>
      </GlassCard>
    </div>
  );
}
