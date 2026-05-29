// ─── Colour & Bottle ────────────────────────────────────────────────────────

/** A hex colour string for a liquid segment, e.g. "#EF4444" */
export type LiquidColor = string;

/** A bottle is an ordered array of colour segments (index 0 = bottom). Max 4. */
export type Bottle = LiquidColor[];

export const BOTTLE_HEIGHT = 4;

export const LIQUID_COLORS: Record<string, LiquidColor> = {
  red:    "#EF4444",
  blue:   "#3B82F6",
  green:  "#22C55E",
  yellow: "#EAB308",
  purple: "#8B5CF6",
  orange: "#F97316",
  pink:   "#EC4899",
  cyan:   "#22D3EE",
  lime:   "#84CC16",
  teal:   "#14B8A6",
  rose:   "#FB7185",
  indigo: "#6366F1",
};

// ─── Difficulty ─────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  colors: number;
  filledBottles: number;
  emptyBottles: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { colors: 4,  filledBottles: 4,  emptyBottles: 2 },
  medium: { colors: 6,  filledBottles: 6,  emptyBottles: 2 },
  hard:   { colors: 9,  filledBottles: 9,  emptyBottles: 2 },
};

// ─── Puzzle ──────────────────────────────────────────────────────────────────

export interface Puzzle {
  id: string;
  level: number;
  difficulty: Difficulty;
  seed: string;
  bottles: Bottle[];
  /** Total bottles including empty */
  totalBottles: number;
  isDaily: boolean;
  dailyDate?: string; // "YYYY-MM-DD"
}

// ─── Game State ──────────────────────────────────────────────────────────────

export type MoveRecord = {
  from: number;
  to: number;
  color: LiquidColor;
  count: number;
};

export interface GameSession {
  puzzleId: string;
  bottles: Bottle[];
  moves: number;
  history: Array<{ bottles: Bottle[]; move: MoveRecord }>;
  startedAt: number; // unix ms
  completedAt?: number;
  isCompleted: boolean;
  difficulty: Difficulty;
  level: number;
}

// ─── Player / Wallet ─────────────────────────────────────────────────────────

export interface EncryptedWallet {
  address: `0x${string}`;
  username: string;
  encryptedPrivateKey: string; // base64 encoded
  salt: string;                // base64 encoded
  iv: string;                  // base64 encoded
  createdAt: number;
}

export interface WalletSession {
  address: `0x${string}`;
  username: string;
  privateKey: `0x${string}`; // decrypted, kept in memory only
}

// ─── Player Stats ────────────────────────────────────────────────────────────

export interface LevelScore {
  levelId: string;
  difficulty: Difficulty;
  moves: number;
  timeSeconds: number;
  completedAt: number;
}

export interface PlayerStats {
  address: `0x${string}`;
  username: string;
  totalCompleted: number;
  bestScores: Record<string, LevelScore>;
  completedLevels: string[];
  achievements: string[];
  streak: number;
  lastPlayedAt?: number;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  address: `0x${string}`;
  username: string;
  score: number;
  moves: number;
  timeSeconds: number;
  completedAt: number;
}

// ─── Achievements ────────────────────────────────────────────────────────────

export type AchievementId =
  | "first_solve"
  | "ten_solves"
  | "speed_demon"
  | "perfectionist"
  | "streak_3"
  | "streak_7"
  | "hard_solver"
  | "daily_devotee"
  | "century"
  | "undo_master"
  | "no_undo_easy"
  | "no_undo_hard";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_solve",
    title: "First Pour",
    description: "Complete your first puzzle",
    icon: "🎉",
    rarity: "common",
  },
  {
    id: "ten_solves",
    title: "Getting Warm",
    description: "Complete 10 puzzles",
    icon: "🔟",
    rarity: "common",
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Complete a puzzle in under 60 seconds",
    icon: "⚡",
    rarity: "rare",
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Complete a puzzle with minimum moves",
    icon: "✨",
    rarity: "epic",
  },
  {
    id: "streak_3",
    title: "On a Roll",
    description: "Complete 3 puzzles in a row",
    icon: "🔥",
    rarity: "common",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Play 7 days in a row",
    icon: "🗓️",
    rarity: "rare",
  },
  {
    id: "hard_solver",
    title: "Hard Boiled",
    description: "Complete a hard difficulty puzzle",
    icon: "💎",
    rarity: "epic",
  },
  {
    id: "daily_devotee",
    title: "Daily Devotee",
    description: "Complete 7 daily challenges",
    icon: "🌅",
    rarity: "rare",
  },
  {
    id: "century",
    title: "The Century",
    description: "Complete 100 puzzles",
    icon: "💯",
    rarity: "legendary",
  },
  {
    id: "undo_master",
    title: "Undo Master",
    description: "Use undo 10 times total",
    icon: "↩️",
    rarity: "common",
  },
  {
    id: "no_undo_easy",
    title: "No Mistakes",
    description: "Complete an easy puzzle without undo",
    icon: "🎯",
    rarity: "rare",
  },
  {
    id: "no_undo_hard",
    title: "Flawless",
    description: "Complete a hard puzzle without undo",
    icon: "🏆",
    rarity: "legendary",
  },
];

// ─── GenLayer Contract State ──────────────────────────────────────────────────

export interface ContractPlayerState {
  username: string;
  completed_levels: string[];
  best_scores: Record<string, { moves: number; time_seconds: number; score: number }>;
  total_completed: number;
  achievements: string[];
  undo_count: number;
  restart_count: number;
  streak: number;
  last_played: number;
}

export interface ContractPuzzleState {
  id: string;
  layout: string[][];
  difficulty: string;
  seed: string;
  level: number;
}

/** Shape of the on-chain session returned by get_session / get_my_session */
export interface ContractSession {
  address: string;
  puzzle_id: string;
  initial_state: Bottle[];
  current_state: Bottle[];
  history: Array<{ from_bottle: number; to_bottle: number; before: Bottle[] }>;
  moves: number;
  started: boolean;
  solved: boolean;
  completed: boolean;
}

// ─── UI State ────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export type PageTransitionVariant = "slide" | "fade" | "scale";
