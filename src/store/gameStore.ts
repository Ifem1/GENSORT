"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Bottle, MoveRecord, Puzzle, WalletSession, Difficulty } from "@/types";
import {
  getPourDetails,
  applyPour,
  isSolved,
  hasValidMove,
} from "@/lib/gameLogic";

// ─── Game slice ───────────────────────────────────────────────────────────────

interface GameSlice {
  puzzle: Puzzle | null;
  bottles: Bottle[];
  selectedBottle: number | null;
  moves: number;
  history: Array<{ bottles: Bottle[]; move: MoveRecord }>;
  isCompleted: boolean;
  isStuck: boolean;
  pourFrom: number | null;
  pourTo: number | null;
  isPaused: boolean;
  startedAt: number | null;
  completedAt: number | null;

  loadPuzzle: (puzzle: Puzzle) => void;
  selectBottle: (index: number) => void;
  clearSelection: () => void;
  undo: () => void;
  restart: () => void;
  setPaused: (paused: boolean) => void;
  markCompleted: () => void;
}

// ─── Wallet slice ─────────────────────────────────────────────────────────────

interface WalletSlice {
  session: WalletSession | null;
  isLocked: boolean;
  setSession: (session: WalletSession) => void;
  clearSession: () => void;
  lock: () => void;
}

// ─── UI slice ─────────────────────────────────────────────────────────────────

interface UISlice {
  selectedDifficulty: Difficulty;
  isGenLayerSyncing: boolean;
  lastTxHash: `0x${string}` | null;
  setDifficulty: (d: Difficulty) => void;
  setSyncing: (v: boolean) => void;
  setLastTxHash: (h: `0x${string}` | null) => void;
}

// ─── Combined store ───────────────────────────────────────────────────────────

type Store = GameSlice & WalletSlice & UISlice;

export const useGameStore = create<Store>()(
  devtools(
    (set, get) => ({
      // ── Game defaults ──
      puzzle: null,
      bottles: [],
      selectedBottle: null,
      moves: 0,
      history: [],
      isCompleted: false,
      isStuck: false,
      pourFrom: null,
      pourTo: null,
      isPaused: false,
      startedAt: null,
      completedAt: null,

      loadPuzzle: (puzzle) => {
        set({
          puzzle,
          bottles: puzzle.bottles.map((b) => [...b]),
          selectedBottle: null,
          moves: 0,
          history: [],
          isCompleted: false,
          isStuck: false,
          pourFrom: null,
          pourTo: null,
          isPaused: false,
          startedAt: Date.now(),
          completedAt: null,
        });
      },

      selectBottle: (index) => {
        const { selectedBottle, bottles } = get();

        // Nothing selected yet
        if (selectedBottle === null) {
          if (bottles[index].length > 0) {
            set({ selectedBottle: index });
          }
          return;
        }

        // Tapped same bottle → deselect
        if (selectedBottle === index) {
          set({ selectedBottle: null });
          return;
        }

        // Attempt pour
        const move = getPourDetails(bottles, selectedBottle, index);
        if (!move) {
          // Can't pour — reselect if new bottle has liquid
          if (bottles[index].length > 0) {
            set({ selectedBottle: index });
          } else {
            set({ selectedBottle: null });
          }
          return;
        }

        // Apply pour
        const newBottles = applyPour(bottles, move);
        const completed = isSolved(newBottles);
        const stuck = !completed && !hasValidMove(newBottles);

        set((s) => ({
          bottles: newBottles,
          moves: s.moves + 1,
          history: [
            ...s.history,
            { bottles: bottles.map((b) => [...b]), move },
          ],
          selectedBottle: null,
          pourFrom: selectedBottle,
          pourTo: index,
          isCompleted: completed,
          isStuck: stuck,
          completedAt: completed ? Date.now() : null,
        }));

        // Clear pour animation hint after short delay
        setTimeout(() => {
          set({ pourFrom: null, pourTo: null });
        }, 600);
      },

      clearSelection: () => set({ selectedBottle: null }),

      undo: () => {
        const { history } = get();
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        set((s) => ({
          bottles: prev.bottles,
          history: s.history.slice(0, -1),
          moves: Math.max(0, s.moves - 1),
          selectedBottle: null,
          isCompleted: false,
          isStuck: false,
        }));
      },

      restart: () => {
        const { puzzle } = get();
        if (!puzzle) return;
        set({
          bottles: puzzle.bottles.map((b) => [...b]),
          selectedBottle: null,
          moves: 0,
          history: [],
          isCompleted: false,
          isStuck: false,
          pourFrom: null,
          pourTo: null,
          startedAt: Date.now(),
          completedAt: null,
        });
      },

      setPaused: (paused) => set({ isPaused: paused }),

      markCompleted: () =>
        set({ isCompleted: true, completedAt: Date.now() }),

      // ── Wallet defaults ──
      session: null,
      isLocked: true,

      setSession: (session) => set({ session, isLocked: false }),
      clearSession: () => set({ session: null, isLocked: true }),
      lock: () => set({ isLocked: true, session: null }),

      // ── UI defaults ──
      selectedDifficulty: "easy",
      isGenLayerSyncing: false,
      lastTxHash: null,

      setDifficulty: (d) => set({ selectedDifficulty: d }),
      setSyncing: (v) => set({ isGenLayerSyncing: v }),
      setLastTxHash: (h) => set({ lastTxHash: h }),
    }),
    { name: "gensort-store" }
  )
);
