"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import * as GL from "@/lib/genlayer";
import type { Difficulty, Bottle } from "@/types";

interface UseGenLayerReturn {
  isSyncing: boolean;
  lastError: string | null;
  /**
   * Must be called when a puzzle is loaded, before any submit_move call.
   * Sends start_puzzle(puzzleId, layout, difficulty, seed, level).
   * If the puzzle doesn't exist on-chain yet, the contract auto-stores it.
   */
  syncStartPuzzle: (
    puzzleId: string,
    layout: Bottle[],
    difficulty: Difficulty,
    seed: string,
    level: number
  ) => Promise<void>;
  /**
   * Submits a move: submit_move(puzzleId, fromBottle, toBottle).
   * No current_state is sent — the contract owns the session state.
   */
  syncSubmitMove: (
    puzzleId: string,
    fromBottle: number,
    toBottle: number
  ) => Promise<void>;
  /**
   * Records completion: complete_level(puzzleId, timeSeconds, difficulty).
   * moves and final_state are NOT sent — the contract reads them from the session.
   */
  syncCompleteLevel: (
    puzzleId: string,
    timeSeconds: number,
    difficulty: Difficulty
  ) => Promise<void>;
  syncUndo: (puzzleId: string) => Promise<void>;
  syncRestart: (puzzleId: string) => Promise<void>;
  fetchPlayerStats: () => Promise<void>;
}

export function useGenLayer(): UseGenLayerReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { session, setSyncing, setLastTxHash } = useGameStore();

  const withSync = useCallback(
    async (fn: () => Promise<void>) => {
      if (!session?.privateKey) {
        setLastError("Wallet not unlocked");
        return;
      }
      setIsSyncing(true);
      setSyncing(true);
      setLastError(null);
      try {
        await fn();
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "GenLayer error");
      } finally {
        setIsSyncing(false);
        setSyncing(false);
      }
    },
    [session, setSyncing]
  );

  const syncStartPuzzle = useCallback(
    (
      puzzleId: string,
      layout: Bottle[],
      difficulty: Difficulty,
      seed: string,
      level: number
    ) =>
      withSync(async () => {
        if (!session?.privateKey) return;
        const hash = await GL.startPuzzle(
          session.privateKey,
          puzzleId,
          layout,
          difficulty,
          seed,
          level
        );
        if (hash) setLastTxHash(hash);
      }),
    [withSync, session, setLastTxHash]
  );

  const syncCompleteLevel = useCallback(
    (puzzleId: string, timeSeconds: number, difficulty: Difficulty) =>
      withSync(async () => {
        if (!session?.privateKey) return;
        const hash = await GL.completeLevel(
          session.privateKey,
          puzzleId,
          timeSeconds,
          difficulty
        );
        if (hash) {
          setLastTxHash(hash);
          void GL.waitForTx(session.privateKey, hash);
        }
      }),
    [withSync, session, setLastTxHash]
  );

  const syncSubmitMove = useCallback(
    (puzzleId: string, fromBottle: number, toBottle: number) =>
      withSync(async () => {
        if (!session?.privateKey) return;
        const hash = await GL.submitMove(
          session.privateKey,
          puzzleId,
          fromBottle,
          toBottle
        );
        if (hash) setLastTxHash(hash);
      }),
    [withSync, session, setLastTxHash]
  );

  const syncUndo = useCallback(
    (puzzleId: string) =>
      withSync(async () => {
        if (!session?.privateKey) return;
        const hash = await GL.undoMove(session.privateKey, puzzleId);
        if (hash) setLastTxHash(hash);
      }),
    [withSync, session, setLastTxHash]
  );

  const syncRestart = useCallback(
    (puzzleId: string) =>
      withSync(async () => {
        if (!session?.privateKey) return;
        const hash = await GL.restartPuzzle(session.privateKey, puzzleId);
        if (hash) setLastTxHash(hash);
      }),
    [withSync, session, setLastTxHash]
  );

  const fetchPlayerStats = useCallback(
    () =>
      withSync(async () => {
        if (!session) return;
        await GL.getPlayerState(session.address, session.privateKey);
      }),
    [withSync, session]
  );

  return {
    isSyncing,
    lastError,
    syncStartPuzzle,
    syncSubmitMove,
    syncCompleteLevel,
    syncUndo,
    syncRestart,
    fetchPlayerStats,
  };
}
