import type { Puzzle, Difficulty, Bottle } from "@/types";
import { DIFFICULTY_CONFIG, BOTTLE_HEIGHT, LIQUID_COLORS } from "@/types";
import {
  isSolved,
  canPour,
  getPourDetails,
  applyPour,
} from "@/lib/gameLogic";

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToNumber(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Puzzle generation ────────────────────────────────────────────────────────

function generateBottles(seed: string, difficulty: Difficulty): Bottle[] {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const rng = mulberry32(seedToNumber(seed));

  const colorKeys = Object.keys(LIQUID_COLORS).slice(0, cfg.colors);
  const segments: string[] = [];

  // Each colour fills exactly BOTTLE_HEIGHT segments
  for (const c of colorKeys) {
    for (let i = 0; i < BOTTLE_HEIGHT; i++) segments.push(LIQUID_COLORS[c]);
  }

  // Fisher-Yates shuffle
  for (let i = segments.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [segments[i], segments[j]] = [segments[j], segments[i]];
  }

  // Fill filled bottles from bottom
  const bottles: Bottle[] = [];
  for (let b = 0; b < cfg.filledBottles; b++) {
    bottles.push(segments.slice(b * BOTTLE_HEIGHT, (b + 1) * BOTTLE_HEIGHT));
  }

  // Add empty bottles
  for (let e = 0; e < cfg.emptyBottles; e++) {
    bottles.push([]);
  }

  // Shuffle bottle order
  for (let i = bottles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bottles[i], bottles[j]] = [bottles[j], bottles[i]];
  }

  return bottles;
}

/** Generate a puzzle from a seed + difficulty. Fully deterministic. */
export function generatePuzzle(
  seed: string,
  difficulty: Difficulty,
  level: number,
  isDaily = false,
  dailyDate?: string
): Puzzle {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const bottles = generateBottles(seed, difficulty);
  const id = isDaily ? `daily-${dailyDate ?? seed}` : `${difficulty}-${level}-${seed}`;

  return {
    id,
    level,
    difficulty,
    seed,
    bottles,
    totalBottles: cfg.filledBottles + cfg.emptyBottles,
    isDaily,
    dailyDate,
  };
}

// ─── Level catalogue ─────────────────────────────────────────────────────────

function padLevel(n: number): string {
  return String(n).padStart(4, "0");
}

export function getPuzzleForLevel(level: number, difficulty: Difficulty): Puzzle {
  const seed = `${difficulty}-level-${padLevel(level)}`;
  return generatePuzzle(seed, difficulty, level);
}

export function getDailyChallengePuzzle(date?: Date): Puzzle {
  const d = date ?? new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const seed = `daily-${dateStr}`;
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const diffIndex = d.getDate() % 3;
  return generatePuzzle(seed, difficulties[diffIndex], 0, true, dateStr);
}

/** Return all levels for a difficulty (up to count). */
export function getLevelList(
  difficulty: Difficulty,
  count = 50
): Puzzle[] {
  return Array.from({ length: count }, (_, i) =>
    getPuzzleForLevel(i + 1, difficulty)
  );
}

/** Check if a puzzle is solvable (BFS with depth limit). */
export function isSolvable(puzzle: Puzzle): boolean {
  const key = (b: Bottle[]) => JSON.stringify(b);
  const visited = new Set<string>();
  const queue: Bottle[][] = [puzzle.bottles.map((b) => [...b])];
  const MAX_STATES = 100_000;
  let statesChecked = 0;

  while (queue.length > 0 && statesChecked < MAX_STATES) {
    const bottles = queue.shift()!;
    statesChecked++;
    const k = key(bottles);
    if (visited.has(k)) continue;
    visited.add(k);
    if (isSolved(bottles)) return true;

    for (let f = 0; f < bottles.length; f++) {
      for (let t = 0; t < bottles.length; t++) {
        if (f === t) continue;
        if (canPour(bottles[f], bottles[t])) {
          const move = getPourDetails(bottles, f, t);
          if (move) {
            queue.push(applyPour(bottles, move));
          }
        }
      }
    }
  }
  return false;
}
