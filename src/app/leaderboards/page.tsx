"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useGameStore } from "@/store/gameStore";
import { getGlobalLeaderboard, getLeaderboard, addKnownAddresses } from "@/lib/genlayer";
import { getDailyChallengePuzzle } from "@/lib/puzzles";

interface LBEntry {
  rank: number;
  address: string;
  username: string;
  score: number;
  moves: number;
  timeSeconds: number;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function LeaderboardsPage() {
  const router = useRouter();
  const { session } = useGameStore();
  const [tab, setTab] = useState<"global" | "daily">("global");
  const [entries, setEntries] = useState<LBEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      let raw;
      if (tab === "global") {
        // Always include the current user so they appear even if no puzzle LB
        // has been fetched yet. getGlobalLeaderboard also merges any locally
        // cached addresses accumulated from previous leaderboard fetches.
        addKnownAddresses([session.address]);
        raw = await getGlobalLeaderboard([session.address], 50, session.privateKey);
      } else {
        const daily = getDailyChallengePuzzle();
        // getLeaderboard auto-accumulates the returned addresses for future
        // global leaderboard queries.
        raw = await getLeaderboard(daily.id, 50, session.privateKey);
      }
      const normalized: LBEntry[] = Array.isArray(raw)
        ? (raw as Array<Record<string, unknown>>).map((r, i) => ({
            rank: i + 1,
            address: String(r.address ?? ""),
            username: String(r.username ?? "Anonymous"),
            score: Number(r.score ?? 0),
            moves: Number(r.moves ?? 0),
            timeSeconds: Number(r.time_seconds ?? 0),
          }))
        : [];
      setEntries(normalized);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, tab]);

  useEffect(() => {
    if (!session) {
      router.push("/signin");
      return;
    }
    // Schedule async data fetch outside the synchronous effect body
    const id = setTimeout(() => { void fetchData(); }, 0);
    return () => clearTimeout(id);
  }, [session, tab, router, fetchData]);

  if (!session) return null;

  return (
    <div className="min-h-dvh px-4 py-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-main">Leaderboard</h1>
        <p className="text-text-muted text-sm mt-1">Top players on GenLayer</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["global", "daily"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
              tab === t
                ? "bg-primary-purple/20 border-primary-purple/40 text-glow-lavender"
                : "bg-transparent border-white/10 text-text-muted hover:border-white/20"
            }`}
          >
            {t === "global" ? "🌍 Global" : "🌅 Daily Challenge"}
          </button>
        ))}
      </div>

      {/* Podium (top 3) */}
      {!isLoading && entries.length >= 3 && (
        <motion.div
          className="flex items-end justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div key={entry.address} className="flex flex-col items-center gap-1 flex-1">
                <div className="text-2xl">{RANK_MEDALS[entry.rank - 1]}</div>
                <div className="text-xs font-medium text-text-main truncate max-w-full px-1">
                  {entry.username}
                </div>
                <div className="text-[10px] text-text-muted">{entry.moves} moves</div>
                <div
                  className={`w-full ${heights[i]} rounded-t-xl border border-white/10 flex items-end justify-center pb-2 ${
                    i === 1
                      ? "bg-primary-purple/20 border-primary-purple/30"
                      : "bg-surface-raised/60"
                  }`}
                >
                  <span className="text-xl font-black text-text-muted/50">
                    {entry.rank}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Full list */}
      <GlassCard padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-primary-purple border-t-transparent animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            <div className="text-3xl mb-3">📭</div>
            No entries yet. Be the first to complete a puzzle!
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((entry, i) => {
              const isMe = entry.address.toLowerCase() === session.address.toLowerCase();
              return (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-primary-purple/8" : ""}`}
                >
                  <div className="w-8 text-center">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">{RANK_MEDALS[entry.rank - 1]}</span>
                    ) : (
                      <span className="text-sm font-mono text-text-muted">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-main truncate">
                        {entry.username}
                      </span>
                      {isMe && <Badge variant="purple" size="sm">You</Badge>}
                    </div>
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      {formatAddress(entry.address)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-glow-lavender">{entry.moves}m</div>
                    <div className="text-[10px] text-text-muted font-mono">
                      {formatTime(entry.timeSeconds)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <p className="text-center text-xs text-text-muted/50">
        Scores are recorded on GenLayer and updated in real-time.
      </p>
    </div>
  );
}
