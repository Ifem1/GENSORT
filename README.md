# 🧪 GENSORT — Water Colour Sort on GenLayer

> **Sort the colours. Beat the chain.**

GENSORT is a fully on-chain Water Colour Sort puzzle game powered by [GenLayer](https://genlayer.com) intelligent contracts. Every move you make, every puzzle you complete, and every achievement you unlock is validated and permanently recorded on the GenLayer blockchain — with no backend servers, no databases, and no way to cheat.

**Live demo → [https://gensort-one.vercel.app](https://gensort-one.vercel.app)**

---

## Table of Contents

- [What is GENSORT?](#what-is-gensort)
- [How to Play](#how-to-play)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [GenLayer Contract](#genlayer-contract)
- [Frontend ↔ Contract Flow](#frontend--contract-flow)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Wallet System](#wallet-system)
- [Puzzle Generation](#puzzle-generation)
- [Achievements](#achievements)
- [Deployment](#deployment)

---

## What is GENSORT?

GENSORT is a **colour-sorting puzzle game** where you arrange liquid-filled bottles so that each bottle contains only one colour. It combines the addictive simplicity of mobile puzzle games with the transparency and permanence of blockchain technology.

Unlike traditional games where a central server is the authority, GENSORT uses a **GenLayer intelligent contract** as the single source of truth. The contract:

- Stores every puzzle layout on-chain
- Tracks each player's active game session
- Validates every move before accepting it
- Records scores, leaderboards, and achievements permanently

Players use an **auto-generated embedded wallet** — no MetaMask, no external wallet app required. Just create a username and a password and start playing.

---

## How to Play

1. **Create your wallet** — enter a username and password. Your private key is generated locally and encrypted with AES-256-GCM. It never leaves your device unencrypted.
2. **Choose a puzzle** — pick from Easy, Medium, or Hard difficulties, or try today's Daily Challenge.
3. **Sort the colours** — tap a bottle to select it (source), then tap another bottle to pour into it (target). The pour only works if:
   - The source bottle is not empty
   - The target bottle is not full (max 4 segments)
   - The top colour of both bottles matches, or the target is empty
4. **Win** — the puzzle is solved when every bottle is either empty or completely filled with a single colour.
5. **Score** — your score is `100,000 − (moves × 100) − time_in_seconds`. Fewer moves and faster time = higher score.

**Controls:**
- `Tap / Click` a bottle to select it
- `Tap / Click` another bottle to pour
- `Undo` button — reverts the last move
- `Restart` button — resets the puzzle to its initial state
- `Pause` button — pauses the timer

---

## Features

### Gameplay
- 🎮 Classic Water Colour Sort mechanics with smooth pour animations
- 🧩 Three difficulty levels: **Easy** (4 colours, 6 bottles), **Medium** (6 colours, 8 bottles), **Hard** (9 colours, 11 bottles)
- 📅 **Daily Challenge** — a new puzzle every day, same puzzle for all players worldwide
- ↩️ Undo and Restart support
- ⭐ Star rating (1–3 stars) based on completion time
- ⏱️ Live move counter and timer

### Blockchain
- ⛓️ Every move validated on the GenLayer contract
- 🏆 Leaderboards per puzzle and globally
- 🎖️ Achievements tracked and awarded on-chain
- 🔒 All scores are tamper-proof and permanently stored

### Wallet
- 🔑 Auto-generated embedded wallet — no browser extension needed
- 🔐 AES-256-GCM encryption with PBKDF2 key derivation (210,000 iterations)
- 💾 Encrypted wallet stored in IndexedDB
- 📤 Export / import private key
- 🔄 Optional: connect an injected wallet (advanced)

### UI
- 🌑 Dark-mode-first glassmorphism design
- 📱 Mobile-first, fully responsive
- ✨ Framer Motion animations throughout
- 🎉 Confetti victory modal with deterministic particle system

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion v11 |
| Blockchain | [GenLayer](https://genlayer.com) — `genlayer-js@1.1.7` |
| Wallet crypto | Web Crypto API (AES-256-GCM + PBKDF2) |
| Local storage | `idb` (IndexedDB Promise wrapper) |
| State management | Zustand v5 |
| Linting | ESLint 9 (flat config) |
| Deployment | Vercel |

**No Supabase. No Firebase. No WalletConnect. No external backend of any kind.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  Next.js UI  │   │  Zustand     │   │  IndexedDB     │  │
│  │  (React)     │◄──│  Game Store  │   │  (idb)         │  │
│  └──────┬───────┘   └──────────────┘   │  - Wallet      │  │
│         │                              │  - Session     │  │
│         │                              │  - Scores      │  │
│  ┌──────▼───────┐                      └────────────────┘  │
│  │  useGame     │                                           │
│  │  useGenLayer │                                           │
│  │  useWallet   │                                           │
│  └──────┬───────┘                                           │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │ genlayer-js SDK
          │
┌─────────▼───────────────────────────────────────────────────┐
│              GenLayer Blockchain (studionet)                 │
│                                                             │
│   Contract: 0x826Cf23a6c3b4697461c5ad71C3eA996655793A6     │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │   puzzles   │  │   players    │  │    sessions      │  │
│   │  TreeMap    │  │  TreeMap     │  │   TreeMap        │  │
│   └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐                        │
│   │ leaderboards│  │ global_scores│                        │
│   │  TreeMap    │  │  TreeMap     │                        │
│   └─────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Key design decisions

**Optimistic UI updates** — local state (Zustand) updates instantly on every move so the player experiences zero latency. The GenLayer contract call fires asynchronously in the background. The pulsing "Syncing…" indicator in the navbar shows when a transaction is in flight.

**Contract as source of truth** — the contract stores a full session (`current_state`, `history`, `moves`) per player per puzzle. It independently validates every move — a pour that is illegal on the frontend will also be rejected by the contract.

**No server** — there is no API server, no database, no authentication backend. The only persistent layer is GenLayer.

---

## GenLayer Contract

**File:** `contracts/gensort.py`  
**Address:** `0x826Cf23a6c3b4697461c5ad71C3eA996655793A6`  
**Network:** studionet  

### Storage

| Store | Key | Value |
|---|---|---|
| `puzzles` | `puzzle_id` | JSON puzzle object |
| `players` | `address` | JSON player object |
| `sessions` | `address::puzzle_id` | JSON session object |
| `leaderboards` | `puzzle_id` | JSON list of top-100 entries |
| `global_scores` | `address` | Total score (string) |

### Write methods

| Method | Description |
|---|---|
| `register_player(username)` | Creates or updates a player record |
| `start_puzzle(puzzle_id, fallback_layout, difficulty, seed, level)` | Opens a session; auto-stores puzzle if new |
| `submit_move(puzzle_id, from_bottle, to_bottle)` | Validates and applies a pour; returns new state |
| `undo_move(puzzle_id)` | Rolls back last move in the session |
| `restart_puzzle(puzzle_id)` | Resets session to initial state |
| `complete_level(puzzle_id, time_seconds, difficulty)` | Records score, updates leaderboard, checks achievements |
| `store_puzzle(puzzle_id, layout, difficulty, seed, level)` | Admin: store a single puzzle |
| `store_many_puzzles(puzzles[])` | Admin: batch store multiple puzzles |

### Read methods

| Method | Description |
|---|---|
| `get_player_state(address)` | Full player object — stats, achievements, best scores |
| `get_session(player_address, puzzle_id)` | Active session state for a player |
| `get_puzzle(puzzle_id)` | Puzzle layout and metadata |
| `puzzle_exists(puzzle_id)` | Boolean existence check |
| `get_puzzle_count()` | Total number of stored puzzles |
| `get_leaderboard(puzzle_id, limit)` | Top N entries for a puzzle |
| `get_global_leaderboard(addresses[], limit)` | Top N players by total score |
| `get_global_score(address)` | A single player's total score |
| `get_daily_stats(date_str)` | Completion count + best stats for a daily puzzle |

### Scoring formula

```
score = max(0, 100,000 − (moves × 100) − time_seconds)
```

Fewer moves and faster time produce a higher score. The contract records the **best** score per puzzle per player and updates the leaderboard only on improvement.

---

## Frontend ↔ Contract Flow

The exact order of contract calls during a game session:

```
1.  register_player(username)          ← on first wallet creation
                                         (or on username update)

2.  start_puzzle(                       ← when any puzzle is loaded
      puzzle_id,
      layout,          ← full bottle layout as fallback
      difficulty,
      seed,
      level
    )

3.  submit_move(puzzle_id, from, to)   ← on every successful pour
                                         (no current_state sent —
                                          contract owns session state)

    ... repeat for each move ...

4a. undo_move(puzzle_id)               ← if player presses Undo
4b. restart_puzzle(puzzle_id)          ← if player presses Restart

5.  complete_level(                     ← when puzzle is solved
      puzzle_id,
      time_seconds,    ← moves and final_state NOT sent;
      difficulty         contract reads them from the session
    )
```

**Reads happen on page load:**

```
get_player_state(address)              ← profile + achievements pages
get_leaderboard(puzzle_id, limit)      ← daily leaderboard tab
get_global_leaderboard(addresses[])    ← global leaderboard tab
```

> **Why pass `addresses[]` to `get_global_leaderboard`?**  
> The contract uses `TreeMap` which cannot be iterated in GenVM. The frontend
> accumulates known player addresses in `localStorage` from every leaderboard
> response it sees, then passes that set to the global query.

---

## Project Structure

```
GenSort/
├── contracts/
│   └── gensort.py              # GenLayer intelligent contract
│
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── signin/page.tsx     # Wallet create / unlock
│   │   ├── game/page.tsx       # Main game screen
│   │   ├── puzzles/page.tsx    # Level select
│   │   ├── leaderboards/page.tsx
│   │   ├── achievements/page.tsx
│   │   ├── profile/page.tsx
│   │   └── wallet/page.tsx     # Wallet settings + export
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── Bottle.tsx      # Animated bottle with liquid segments
│   │   │   ├── GameBoard.tsx   # Grid of bottles
│   │   │   ├── GameHUD.tsx     # Move counter, timer, controls
│   │   │   └── VictoryModal.tsx# Confetti + score breakdown
│   │   ├── layout/
│   │   │   └── Navbar.tsx      # Desktop sidebar + mobile bottom bar
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Modal.tsx
│   │   └── wallet/
│   │       ├── WalletSetup.tsx # New wallet creation form
│   │       └── UnlockWallet.tsx# Password unlock form
│   │
│   ├── hooks/
│   │   ├── useGame.ts          # Combines store + GenLayer + timer
│   │   ├── useGenLayer.ts      # Fire-and-forget contract sync hooks
│   │   ├── useWallet.ts        # Wallet create / unlock / export
│   │   └── useTimer.ts         # MM:SS timer with pause/resume
│   │
│   ├── lib/
│   │   ├── genlayer.ts         # genlayer-js SDK wrapper functions
│   │   ├── gameLogic.ts        # Pure game functions (canPour, applyPour, isSolved)
│   │   ├── puzzles.ts          # Deterministic puzzle generation (mulberry32 PRNG)
│   │   ├── crypto.ts           # AES-256-GCM encrypt/decrypt via Web Crypto API
│   │   └── db.ts               # IndexedDB schema (idb)
│   │
│   ├── store/
│   │   └── gameStore.ts        # Zustand store (game + wallet + UI slices)
│   │
│   └── types/
│       └── index.ts            # All TypeScript types and constants
│
├── .env.example                # Environment variable template
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Ifem1/GENSORT.git
cd GENSORT
npm install
```

### Setup environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_GENLAYER_ENDPOINT=https://studio.genlayer.com/api
NEXT_PUBLIC_CONTRACT_ADDRESS=0x826Cf23a6c3b4697461c5ad71C3eA996655793A6
NEXT_PUBLIC_NETWORK=studionet
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_GENLAYER_ENDPOINT` | GenLayer RPC endpoint URL | `https://studio.genlayer.com/api` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address | `0x826Cf23a6c3b4697461c5ad71C3eA996655793A6` |
| `NEXT_PUBLIC_NETWORK` | GenLayer network name | `studionet` |

Supported network values: `studionet`, `testnetAsimov`, `testnetBradbury`, `localnet`.

> ⚠️ All three variables are prefixed with `NEXT_PUBLIC_` which means they are embedded into the client bundle and visible in the browser. They contain no secrets — your private key is **never** stored in environment variables.

---

## Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run typecheck    # Run TypeScript compiler (no emit)
npm run lint         # Run ESLint
```

---

## Wallet System

GENSORT uses a fully embedded wallet — no browser extension or external wallet app is required.

### How it works

1. **Key generation** — `generatePrivateKey()` from `genlayer-js` creates a cryptographically secure private key.
2. **Encryption** — the private key is encrypted with AES-256-GCM using a key derived from the user's password via PBKDF2 (SHA-256, 210,000 iterations, random 16-byte salt).
3. **Storage** — the encrypted key, salt, and IV are stored as base64 strings in IndexedDB via `idb`. The plaintext private key is **never** persisted.
4. **Session** — on unlock, the decrypted private key is held in Zustand memory only for the duration of the session. Locking or closing the tab clears it.
5. **Signing** — all GenLayer write calls (`writeContract`) are signed automatically using the in-memory private key via `createAccount()` from `genlayer-js`.

### Export / Import

Players can export their private key (after password verification) to a plain hex string for backup or to import into another wallet. They can also import an existing private key and re-encrypt it under a new password.

---

## Puzzle Generation

All puzzles are **deterministic** — given the same seed and difficulty, the same puzzle is always generated. No puzzle data is bundled with the app.

### Algorithm

1. A seed string is constructed: `"easy-level-0001"`, `"daily-2025-06-01"`, etc.
2. The seed is hashed into a 32-bit integer.
3. A `mulberry32` PRNG is seeded with that integer.
4. All colour segments are created (`colors × BOTTLE_HEIGHT` segments total).
5. A Fisher-Yates shuffle distributes segments across bottles.
6. Empty bottles are appended, then the whole array is shuffled again.

### Daily Challenge

The daily puzzle is derived from the current date:

```
seed = "daily-YYYY-MM-DD"
difficulty = ["easy", "medium", "hard"][day_of_month % 3]
```

The same seed produces the same puzzle for every player on the same day, worldwide.

### Difficulty config

| Difficulty | Colours | Filled bottles | Empty bottles | Total bottles |
|---|---|---|---|---|
| Easy | 4 | 4 | 2 | 6 |
| Medium | 6 | 6 | 2 | 8 |
| Hard | 9 | 9 | 2 | 11 |

---

## Achievements

Achievements are awarded by the contract inside `complete_level` and `undo_move`. They are stored permanently on-chain in the player's record.

| ID | Title | Condition | Rarity |
|---|---|---|---|
| `first_solve` | First Pour | Complete your first puzzle | Common |
| `ten_solves` | Getting Warm | Complete 10 puzzles | Common |
| `speed_demon` | Speed Demon | Complete a puzzle in under 60 seconds | Rare |
| `hard_solver` | Hard Boiled | Complete a hard difficulty puzzle | Epic |
| `century` | The Century | Complete 100 puzzles | Legendary |
| `undo_master` | Undo Master | Use undo 10 times total | Common |
| `perfectionist` | Perfectionist | Complete a puzzle with minimum moves | Epic |
| `no_undo_easy` | No Mistakes | Complete an easy puzzle without undo | Rare |
| `no_undo_hard` | Flawless | Complete a hard puzzle without undo | Legendary |
| `streak_3` | On a Roll | Complete 3 puzzles in a row | Common |
| `streak_7` | Week Warrior | Play 7 days in a row | Rare |
| `daily_devotee` | Daily Devotee | Complete 7 daily challenges | Rare |

---

## Deployment

The project is deployed on **Vercel** with the GitHub repo connected for continuous deployment.

**Production URL:** [https://gensort-one.vercel.app](https://gensort-one.vercel.app)

To redeploy after changes:

```bash
# Push to GitHub (triggers automatic Vercel redeploy)
git add .
git commit -m "your message"
git push

# Or deploy directly via Vercel CLI
vercel --prod
```

---

## License

MIT — do whatever you want with it.

---

*Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and GenLayer.*
