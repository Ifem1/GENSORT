import type { Bottle, LiquidColor, MoveRecord } from "@/types";
import { BOTTLE_HEIGHT } from "@/types";

// ─── Pure game-logic helpers ──────────────────────────────────────────────────

/** Get the colour at the top of a bottle (last element), or null if empty. */
export function topColor(bottle: Bottle): LiquidColor | null {
  return bottle.length > 0 ? bottle[bottle.length - 1] : null;
}

/** True when every segment in a non-empty bottle is the same colour. */
export function isBottleComplete(bottle: Bottle): boolean {
  if (bottle.length === 0) return true;
  if (bottle.length !== BOTTLE_HEIGHT) return false;
  const c = bottle[0];
  return bottle.every((s) => s === c);
}

/** Count the number of same-colour segments at the top of `bottle`. */
export function topColorCount(bottle: Bottle): number {
  if (bottle.length === 0) return 0;
  const c = bottle[bottle.length - 1];
  let count = 0;
  for (let i = bottle.length - 1; i >= 0; i--) {
    if (bottle[i] === c) count++;
    else break;
  }
  return count;
}

/** True when a pour from `from` to `to` is valid. */
export function canPour(from: Bottle, to: Bottle): boolean {
  if (from.length === 0) return false;
  if (to.length >= BOTTLE_HEIGHT) return false;

  // Allow if entire source already complete and target is empty (no-op opt-out)
  const fromTop = topColor(from);
  const toTop = topColor(to);

  if (toTop === null) return true; // target empty → any colour OK
  return fromTop === toTop;
}

/** Returns { from, to, color, count } for a valid pour, or null if invalid. */
export function getPourDetails(
  bottles: Bottle[],
  fromIdx: number,
  toIdx: number
): MoveRecord | null {
  const from = bottles[fromIdx];
  const to = bottles[toIdx];

  if (!canPour(from, to)) return null;

  const color = topColor(from)!;
  const available = topColorCount(from);
  const space = BOTTLE_HEIGHT - to.length;
  const count = Math.min(available, space);

  if (count === 0) return null;
  return { from: fromIdx, to: toIdx, color, count };
}

/** Execute a pour and return the mutated bottles (deep clone). */
export function applyPour(bottles: Bottle[], move: MoveRecord): Bottle[] {
  const next = bottles.map((b) => [...b]);
  const { from, to, color, count } = move;

  next[from] = next[from].slice(0, next[from].length - count);
  for (let i = 0; i < count; i++) {
    next[to].push(color);
  }
  return next;
}

/** True when every bottle is either empty or fully sorted. */
export function isSolved(bottles: Bottle[]): boolean {
  return bottles.every(isBottleComplete);
}

/** Check if any valid move exists (not stuck). */
export function hasValidMove(bottles: Bottle[]): boolean {
  for (let i = 0; i < bottles.length; i++) {
    for (let j = 0; j < bottles.length; j++) {
      if (i !== j && canPour(bottles[i], bottles[j])) return true;
    }
  }
  return false;
}

/** Returns minimum possible move count for this puzzle configuration (heuristic). */
export function minMovesHeuristic(bottles: Bottle[]): number {
  // Count colours not yet in a single bottle as lower bound
  const colorSegments: Record<string, number> = {};
  for (const b of bottles) {
    let i = 0;
    while (i < b.length) {
      const c = b[i];
      let run = 0;
      while (i < b.length && b[i] === c) {
        i++;
        run++;
      }
      if (run > 0) {
        colorSegments[c] = (colorSegments[c] ?? 0) + 1;
      }
    }
  }
  // Each contiguous group that's separated costs at least 1 move
  return Math.max(0, Object.values(colorSegments).reduce((s, v) => s + v, 0) - Object.keys(colorSegments).length);
}

/** Serialize game state for contract submission. */
export function serializeBottles(bottles: Bottle[]): string[][] {
  return bottles.map((b) => [...b]);
}

/** Deserialize from contract. */
export function deserializeBottles(raw: string[][]): Bottle[] {
  return raw.map((b) => [...b]);
}
