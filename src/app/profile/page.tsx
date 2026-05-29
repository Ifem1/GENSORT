"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/store/gameStore";
import { getAllScores } from "@/lib/db";
import { getPlayerState } from "@/lib/genlayer";
import type { LevelScore, ContractPlayerState } from "@/types";
import { ACHIEVEMENTS } from "@/types";

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { session } = useGameStore();
  const [scores, setScores] = useState<LevelScore[]>([]);
  const [chainState, setChainState] = useState<ContractPlayerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) { router.push("/signin"); return; }
    void (async () => {
      const [sc, cs] = await Promise.all([
        getAllScores(),
        getPlayerState(session.address, session.privateKey),
      ]);
      setScores(sc);
      setChainState(cs);
      setIsLoading(false);
    })();
  }, [session, router]);

  if (!session) return null;

  const totalCompleted = chainState?.total_completed ?? scores.length;
  const streak = chainState?.streak ?? 0;
  const unlockedAchievements = chainState?.achievements ?? [];
  const bestMoves = scores.reduce((min, s) => Math.min(min, s.moves), Infinity);

  const STATS = [
    { label: "Puzzles Solved", value: totalCompleted, icon: "✅" },
    { label: "Day Streak",     value: streak,          icon: "🔥" },
    {
      label: "Best Moves",
      value: bestMoves === Infinity ? "—" : bestMoves,
      icon: "⚡",
    },
    { label: "Achievements",   value: unlockedAchievements.length, icon: "🎖️" },
  ];

  return (
    <div className="min-h-dvh px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-purple/20 border border-primary-purple/30 flex items-center justify-center text-3xl font-bold text-glow-lavender glow-purple">
          {session.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-main">{session.username}</h1>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            {session.address.slice(0, 14)}…{session.address.slice(-6)}
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {STATS.map(({ label, value, icon }) => (
          <GlassCard key={label} raised padding="md" className="text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold text-text-main">{value}</div>
            <div className="text-xs text-text-muted mt-0.5">{label}</div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Recent scores */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text-main">Recent Completions</h2>
          <Badge variant="gray" size="sm">{scores.length} total</Badge>
        </div>
        <GlassCard padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-primary-purple border-t-transparent animate-spin" />
            </div>
          ) : scores.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm">
              <div className="text-3xl mb-3">🎮</div>
              No completed puzzles yet.
              <br />
              <Link href="/game" className="text-primary-purple hover:text-glow-lavender transition-colors">
                Start playing →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {scores.slice().reverse().slice(0, 10).map((score, i) => (
                <div key={`${score.levelId}-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-success-green/10 border border-success-green/25 flex items-center justify-center text-sm">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-main truncate capitalize">
                      {score.levelId.replace(/-/g, " ")}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      <Badge variant="gray" size="sm" className="mr-1">{score.difficulty}</Badge>
                      {new Date(score.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold text-glow-lavender">{score.moves}m</div>
                    <div className="text-text-muted font-mono">{formatTime(score.timeSeconds)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Achievements preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text-main">Achievements</h2>
          <Link href="/achievements" className="text-xs text-primary-purple hover:text-glow-lavender transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {ACHIEVEMENTS.slice(0, 8).map((ach) => {
            const unlocked = unlockedAchievements.includes(ach.id);
            return (
              <GlassCard
                key={ach.id}
                padding="sm"
                className={`text-center transition-all ${unlocked ? "border-primary-purple/30" : "opacity-40"}`}
              >
                <div className={`text-2xl mb-1 ${unlocked ? "" : "grayscale"}`}>
                  {ach.icon}
                </div>
                <div className="text-[10px] text-text-muted leading-tight">{ach.title}</div>
              </GlassCard>
            );
          })}
        </div>
      </motion.div>

      {/* Wallet settings link */}
      <Link href="/wallet">
        <Button variant="secondary" size="lg" fullWidth>
          ⚙️ Wallet & Settings
        </Button>
      </Link>
    </div>
  );
}
