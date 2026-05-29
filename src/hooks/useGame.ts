"use client";

import { useCallback, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useGenLayer } from "@/hooks/useGenLayer";
import { useTimer } from "@/hooks/useTimer";
import type { Puzzle } from "@/types";

export function useGame() {
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
    startedAt,
    completedAt,
    loadPuzzle,
    selectBottle,
    clearSelection,
    undo,
    restart,
    setPaused,
  } = useGameStore();

  const {
    syncStartPuzzle,
    syncCompleteLevel,
    syncSubmitMove,
    syncUndo,
    syncRestart,
    isSyncing,
  } = useGenLayer();
  const timer = useTimer();

  // Sync timer with game state
  useEffect(() => {
    if (startedAt && !isCompleted && !isPaused) {
      timer.resume();
    } else if (isPaused || isCompleted) {
      timer.pause();
    }
  }, [startedAt, isCompleted, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load a puzzle into local state AND start the on-chain session.
   * start_puzzle must be called before any submit_move, and it auto-stores
   * the puzzle on-chain if it doesn't exist yet (preventing "Puzzle not found").
   */
  const startPuzzle = useCallback(
    (p: Puzzle) => {
      loadPuzzle(p);
      timer.start();
      // Fire-and-forget: start the on-chain session for this puzzle.
      // Sends puzzleId + full layout so the contract can store it if needed.
      void syncStartPuzzle(
        p.id,
        p.bottles,
        p.difficulty,
        p.seed,
        p.level
      );
    },
    [loadPuzzle, timer, syncStartPuzzle]
  );

  // Handle completion — fires after local isCompleted flips to true
  useEffect(() => {
    if (isCompleted && puzzle && completedAt && startedAt) {
      timer.pause();
      const secs = Math.round((completedAt - startedAt) / 1000);
      // complete_level no longer takes moves or final_state —
      // the contract reads both from its session.
      void syncCompleteLevel(puzzle.id, secs, puzzle.difficulty);
    }
  }, [isCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUndo = useCallback(() => {
    undo();
    if (puzzle) void syncUndo(puzzle.id);
  }, [undo, puzzle, syncUndo]);

  const handleRestart = useCallback(() => {
    restart();
    timer.reset();
    timer.start();
    if (puzzle) void syncRestart(puzzle.id);
  }, [restart, timer, puzzle, syncRestart]);

  const handleSelectBottle = useCallback(
    (idx: number) => {
      const prevSelected = useGameStore.getState().selectedBottle;
      selectBottle(idx);
      // If a pour happened (selectedBottle was set and now cleared), sync the move.
      // submit_move no longer takes current_state — the contract owns session state.
      const newState = useGameStore.getState();
      if (prevSelected !== null && newState.selectedBottle === null && puzzle) {
        void syncSubmitMove(puzzle.id, prevSelected, idx);
      }
    },
    [selectBottle, puzzle, syncSubmitMove]
  );

  return {
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
    selectBottle: handleSelectBottle,
    clearSelection,
    undo: handleUndo,
    restart: handleRestart,
    setPaused,
  };
}
