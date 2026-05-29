"use client";

import { createClient, createAccount, chains } from "genlayer-js";
import type { Address } from "viem";
import type {
  ContractPlayerState,
  ContractSession,
  Difficulty,
  Bottle,
} from "@/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const ENDPOINT =
  process.env.NEXT_PUBLIC_GENLAYER_ENDPOINT ?? "https://studio.genlayer.com/api";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x826Cf23a6c3b4697461c5ad71C3eA996655793A6") as Address;

const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? "studionet";

// ─── Client factory ───────────────────────────────────────────────────────────

function getChain() {
  switch (NETWORK) {
    case "testnetBradbury":
      return chains.testnetBradbury;
    case "testnetAsimov":
      return chains.testnetAsimov;
    case "localnet":
      return chains.localnet;
    case "studionet":
    default:
      return chains.studionet;
  }
}

export function buildClient(privateKey?: `0x${string}`) {
  const account = privateKey ? createAccount(privateKey) : undefined;
  return createClient({
    chain: getChain(),
    endpoint: ENDPOINT,
    account,
  });
}

// ─── Known-address registry ───────────────────────────────────────────────────
// get_global_leaderboard requires the caller to supply known player addresses
// (the contract uses TreeMap which cannot be iterated in GenVM). We accumulate
// addresses from every leaderboard response and from the current session into
// localStorage so the global query keeps growing over time.

const KNOWN_ADDR_KEY = "gensort_known_addresses";

export function getKnownAddresses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KNOWN_ADDR_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addKnownAddresses(addresses: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const existing = new Set(getKnownAddresses());
    for (const a of addresses) {
      if (a) existing.add(a.toLowerCase());
    }
    localStorage.setItem(KNOWN_ADDR_KEY, JSON.stringify([...existing]));
  } catch {
    // non-fatal
  }
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

export async function getPlayerState(
  playerAddress: Address,
  privateKey?: `0x${string}`
): Promise<ContractPlayerState | null> {
  try {
    const client = buildClient(privateKey);
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_player_state",
      args: [playerAddress],
    });
    return result as unknown as ContractPlayerState;
  } catch {
    return null;
  }
}

/**
 * Read a player's active session for a puzzle.
 * Uses get_session(player_address, puzzle_id) — takes explicit address so no
 * sender signing is required.
 */
export async function getSession(
  playerAddress: string,
  puzzleId: string,
  privateKey?: `0x${string}`
): Promise<ContractSession | null> {
  try {
    const client = buildClient(privateKey);
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_session",
      args: [playerAddress, puzzleId],
    });
    const session = result as unknown as ContractSession;
    // Empty dict means no session yet
    if (!session || Object.keys(session).length === 0) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getPuzzleState(
  puzzleId: string,
  privateKey?: `0x${string}`
) {
  try {
    const client = buildClient(privateKey);
    return client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_puzzle",
      args: [puzzleId],
    });
  } catch {
    return null;
  }
}

export async function getLeaderboard(
  puzzleId: string,
  limit = 20,
  privateKey?: `0x${string}`
) {
  try {
    const client = buildClient(privateKey);
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_leaderboard",
      args: [puzzleId, limit],
    });
    // Side-effect: accumulate addresses for global leaderboard queries
    if (Array.isArray(result)) {
      addKnownAddresses(
        (result as Array<Record<string, unknown>>).map((e) => String(e.address ?? ""))
      );
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Fetch the global leaderboard.
 *
 * The contract's get_global_leaderboard requires a list of addresses because
 * its TreeMap cannot be iterated in GenVM. We merge the caller-supplied list
 * with the locally cached set accumulated from previous leaderboard fetches.
 */
export async function getGlobalLeaderboard(
  knownAddresses: string[],
  limit = 50,
  privateKey?: `0x${string}`
) {
  try {
    const all = Array.from(new Set([...getKnownAddresses(), ...knownAddresses]));
    const client = buildClient(privateKey);
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_global_leaderboard",
      args: [all, limit],
    });
    if (Array.isArray(result)) {
      addKnownAddresses(
        (result as Array<Record<string, unknown>>).map((e) => String(e.address ?? ""))
      );
    }
    return result;
  } catch {
    return [];
  }
}

export async function getGlobalScore(
  playerAddress: string,
  privateKey?: `0x${string}`
): Promise<number> {
  try {
    const client = buildClient(privateKey);
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_global_score",
      args: [playerAddress],
    });
    return Number(result ?? 0);
  } catch {
    return 0;
  }
}

export async function getPuzzleCount(
  privateKey?: `0x${string}`
): Promise<string> {
  try {
    const client = buildClient(privateKey);
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_puzzle_count",
      args: [],
    });
    return String(result ?? "0");
  } catch {
    return "0";
  }
}

// ─── Write helpers ────────────────────────────────────────────────────────────

export async function registerPlayer(
  privateKey: `0x${string}`,
  username: string
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "register_player",
      args: [username],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

/**
 * Start (or resume) a puzzle session on-chain.
 *
 * Contract signature:
 *   start_puzzle(puzzle_id, fallback_layout, difficulty, seed, level)
 *
 * If the puzzle does not yet exist on-chain, the contract auto-stores it using
 * the provided fallback_layout — preventing "Puzzle not found" errors.
 * This must be called before the first submit_move for every puzzle.
 */
export async function startPuzzle(
  privateKey: `0x${string}`,
  puzzleId: string,
  layout: Bottle[],
  difficulty: Difficulty,
  seed: string,
  level: number
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "start_puzzle",
      args: [puzzleId, layout, difficulty, seed, level],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

/**
 * Submit a move to the contract.
 *
 * Contract signature:
 *   submit_move(puzzle_id, from_bottle, to_bottle)
 *
 * The contract owns the session state — current_state is NOT sent. The contract
 * validates legality and returns the new bottle layout and move count.
 */
export async function submitMove(
  privateKey: `0x${string}`,
  puzzleId: string,
  fromBottle: number,
  toBottle: number
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "submit_move",
      args: [puzzleId, fromBottle, toBottle],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

/**
 * Record puzzle completion on-chain.
 *
 * Contract signature:
 *   complete_level(puzzle_id, time_seconds, difficulty)
 *
 * The contract reads moves and final_state directly from the session — do NOT
 * send them. The contract also calls _is_solved(session.current_state) to
 * verify the puzzle is actually complete before recording anything.
 */
export async function completeLevel(
  privateKey: `0x${string}`,
  puzzleId: string,
  timeSeconds: number,
  difficulty: Difficulty
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "complete_level",
      args: [puzzleId, timeSeconds, difficulty],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

export async function undoMove(
  privateKey: `0x${string}`,
  puzzleId: string
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "undo_move",
      args: [puzzleId],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

export async function restartPuzzle(
  privateKey: `0x${string}`,
  puzzleId: string
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "restart_puzzle",
      args: [puzzleId],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

/**
 * Batch-store multiple puzzle layouts.
 * Useful for pre-seeding the contract with the first N levels on app bootstrap.
 */
export async function storeManyPuzzles(
  privateKey: `0x${string}`,
  puzzles: Array<{
    puzzle_id: string;
    layout: Bottle[];
    difficulty: Difficulty;
    seed: string;
    level: number;
  }>
): Promise<`0x${string}` | null> {
  try {
    const client = buildClient(privateKey);
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "store_many_puzzles",
      args: [puzzles],
      value: BigInt(0),
    });
    return hash as unknown as `0x${string}`;
  } catch {
    return null;
  }
}

/** Wait for a transaction to be finalized. */
export async function waitForTx(
  privateKey: `0x${string}`,
  hash: `0x${string}`
) {
  try {
    const client = buildClient(privateKey);
    return await client.waitForTransactionReceipt({
      hash: hash as Parameters<typeof client.waitForTransactionReceipt>[0]["hash"],
    });
  } catch {
    return null;
  }
}
