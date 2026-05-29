"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GameBoard } from "@/components/game/GameBoard";
import { GameHUD } from "@/components/game/GameHUD";
import { VictoryModal } from "@/components/game/VictoryModal";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGame } from "@/hooks/useGame";
import { useGameStore } from "@/store/gameStore";
import { getDailyChallengePuzzle, getPuzzleForLevel } from "@/lib/puzzles";

export default function GamePage() {
  const router = useRouter();
  const { session, startedAt } = useGameStore();
  const {
    puzzle,
    bottles,
    selectedBottle,
    moves,
    isCompleted,
    isStuck,
    pourFrom,
    pourTo,
    history,
    isPaused,
    isSyncing,
    timer,
    startPuzzle,
    selectBottle,
    undo,
    restart,
    setPaused,
  } = useGame();

  const [showVictory, setShowVictory] = useState(false);
  // Track elapsed seconds in state so it doesn't call Date.now() during render
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef(0);

  // Auth guard
  useEffect(() => {
    if (!session) router.push("/signin");
  }, [session, router]);

  // Auto-load default puzzle on first visit
  useEffect(() => {
    if (!puzzle && session) {
      const p = getDailyChallengePuzzle();
      startPuzzle(p);
    }
  }, [puzzle, session, startPuzzle]);

  // Update elapsed seconds via interval (avoids impure Date.now in render)
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => {
      const secs = Math.round((Date.now() - startedAt) / 1000);
      elapsedRef.current = secs;
      setElapsedSeconds(secs);
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Show/hide victory modal
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (isCompleted) {
      timerId = setTimeout(() => setShowVictory(true), 600);
    } else {
      timerId = setTimeout(() => setShowVictory(false), 0);
    }
    return () => clearTimeout(timerId);
  }, [isCompleted]);

  const handleNextLevel = () => {
    if (!puzzle) return;
    setShowVictory(false);
    const next = getPuzzleForLevel(puzzle.level + 1, puzzle.difficulty);
    startPuzzle(next);
  };

  const handleReplay = () => {
    setShowVictory(false);
    restart();
  };

  const handleMenu = () => {
    setShowVictory(false);
    router.push("/puzzles");
  };

  if (!session || !puzzle) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header area */}
      <div className="pt-4 px-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/puzzles")}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 19l-7-7 7-7" />
              </svg>
            }
          >
            Puzzles
          </Button>
          <span className="text-xs text-text-muted">
            {session.username}
          </span>
        </div>

        <GameHUD
          moves={moves}
          timerFormatted={timer.formatted}
          difficulty={puzzle.difficulty}
          level={puzzle.level}
          historyLength={history.length}
          isSyncing={isSyncing}
          isDaily={puzzle.isDaily}
          onUndo={undo}
          onRestart={restart}
          onPause={() => setPaused(!isPaused)}
        />
      </div>

      {/* Game board */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          {isPaused ? (
            <motion.div
              key="paused"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard raised padding="lg" glow className="text-center space-y-4">
                <div className="text-4xl">⏸️</div>
                <h2 className="text-xl font-bold text-text-main">Game Paused</h2>
                <p className="text-text-muted text-sm">
                  {timer.formatted} elapsed · {moves} moves
                </p>
                <Button variant="primary" size="lg" onClick={() => setPaused(false)} glow>
                  Resume
                </Button>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GameBoard
                bottles={bottles}
                selectedBottle={selectedBottle}
                pourFrom={pourFrom}
                pourTo={pourTo}
                onBottleClick={selectBottle}
                isCompleted={isCompleted}
                isStuck={isStuck}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Victory modal */}
      <VictoryModal
        isOpen={showVictory}
        moves={moves}
        timeSeconds={elapsedSeconds}
        difficulty={puzzle.difficulty}
        level={puzzle.level}
        isDaily={puzzle.isDaily}
        isSyncing={isSyncing}
        onNextLevel={handleNextLevel}
        onReplay={handleReplay}
        onMenu={handleMenu}
      />
    </div>
  );
}
