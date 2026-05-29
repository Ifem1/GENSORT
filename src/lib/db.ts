"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { EncryptedWallet, LevelScore } from "@/types";

const DB_NAME = "gensort-db";
const DB_VERSION = 1;

// ─── Schema ──────────────────────────────────────────────────────────────────

interface GensortDB {
  wallet: {
    key: string;
    value: EncryptedWallet;
  };
  scores: {
    key: string;
    value: LevelScore;
  };
  settings: {
    key: string;
    value: unknown;
  };
  session: {
    key: string;
    value: { address: string; expiresAt: number };
  };
}

// ─── DB singleton ────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<GensortDB>> | null = null;

function getDB(): Promise<IDBPDatabase<GensortDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GensortDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("wallet")) {
          db.createObjectStore("wallet");
        }
        if (!db.objectStoreNames.contains("scores")) {
          db.createObjectStore("scores");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
        if (!db.objectStoreNames.contains("session")) {
          db.createObjectStore("session");
        }
      },
    });
  }
  return dbPromise;
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export async function saveWallet(wallet: EncryptedWallet): Promise<void> {
  const db = await getDB();
  await db.put("wallet", wallet, "current");
}

export async function loadWallet(): Promise<EncryptedWallet | undefined> {
  const db = await getDB();
  return db.get("wallet", "current");
}

export async function deleteWallet(): Promise<void> {
  const db = await getDB();
  await db.delete("wallet", "current");
}

export async function walletExists(): Promise<boolean> {
  const wallet = await loadWallet();
  return wallet !== undefined;
}

// ─── Session ─────────────────────────────────────────────────────────────────

const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function createSession(address: string): Promise<void> {
  const db = await getDB();
  await db.put(
    "session",
    { address, expiresAt: Date.now() + SESSION_DURATION_MS },
    "active"
  );
}

export async function getSession(): Promise<{ address: string } | null> {
  const db = await getDB();
  const session = await db.get("session", "active");
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return { address: session.address };
}

export async function clearSession(): Promise<void> {
  const db = await getDB();
  await db.delete("session", "active");
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export async function saveScore(score: LevelScore): Promise<void> {
  const db = await getDB();
  const existing = await db.get("scores", score.levelId);
  // Only keep best (fewest moves, then fastest time)
  if (
    !existing ||
    score.moves < existing.moves ||
    (score.moves === existing.moves && score.timeSeconds < existing.timeSeconds)
  ) {
    await db.put("scores", score, score.levelId);
  }
}

export async function getScore(levelId: string): Promise<LevelScore | undefined> {
  const db = await getDB();
  return db.get("scores", levelId);
}

export async function getAllScores(): Promise<LevelScore[]> {
  const db = await getDB();
  return db.getAll("scores");
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("settings", value, key);
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get("settings", key) as Promise<T | undefined>;
}
