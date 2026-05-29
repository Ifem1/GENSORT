"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useGameStore } from "@/store/gameStore";
import { getPlayerState } from "@/lib/genlayer";
import { ACHIEVEMENTS } from "@/types";
import type { Achievement } from "@/types";

const RARITY_COLORS: Record<Achievement["rarity"], string> = {
  common:    "border-text-muted/20 text-text-muted",
  rare:      "border-electric-cyan/30 text-electric-cyan",
  epic:      "border-primary-purple/40 text-glow-lavender",
  legendary: "border-warning-amber/40 text-warning-amber",
};

const RARITY_BADGE: Record<Achievement["rarity"], React.ReactNode> = {
  common:    <Badge variant="gray" size="sm">Common</Badge>,
  rare:      <Badge variant="cyan" size="sm">Rare</Badge>,
  epic:      <Badge variant="purple" size="sm">Epic</Badge>,
  legendary: <Badge variant="amber" size="sm">Legendary</Badge>,
};

export default function AchievementsPage() {
  const router = useRouter();
  const { session } = useGameStore();
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    if (!session) { router.push("/signin"); return; }
    void (async () => {
      const state = await getPlayerState(session.address, session.privateKey);
      setUnlocked(state?.achievements ?? []);
      setIsLoading(false);
    })();
  }, [session, router]);

  if (!session) return null;

  const filtered = ACHIEVEMENTS.filter((a) => {
    if (filter === "unlocked") return unlocked.includes(a.id);
    if (filter === "locked")   return !unlocked.includes(a.id);
    return true;
  });

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).length;

  return (
    <div className="min-h-dvh px-4 py-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-main">Achievements</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="purple">{unlockedCount} / {ACHIEVEMENTS.length} unlocked</Badge>
          <span className="text-text-muted text-sm">
            — {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% complete
          </span>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-purple to-electric-cyan rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unlocked", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              filter === f
                ? "bg-primary-purple/20 border-primary-purple/40 text-glow-lavender"
                : "bg-transparent border-white/10 text-text-muted hover:border-white/20"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary-purple border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((ach, i) => {
            const isUnlocked = unlocked.includes(ach.id);
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard
                  raised={isUnlocked}
                  padding="md"
                  className={`relative border transition-all ${
                    isUnlocked
                      ? RARITY_COLORS[ach.rarity]
                      : "border-white/6 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        isUnlocked ? "bg-white/5" : "grayscale opacity-40"
                      }`}
                    >
                      {ach.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-semibold text-text-main leading-tight">
                          {ach.title}
                        </h3>
                        {RARITY_BADGE[ach.rarity]}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                        {ach.description}
                      </p>
                      {isUnlocked && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-success-green">
                          <span>✓</span>
                          <span>Unlocked</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Locked overlay icon */}
                  {!isUnlocked && (
                    <div className="absolute top-2 right-2 text-xs text-text-muted/40">
                      🔒
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-10 text-text-muted text-sm">
          <div className="text-3xl mb-3">🎯</div>
          {filter === "unlocked" ? "No achievements unlocked yet. Keep playing!" : "All locked."}
        </div>
      )}
    </div>
  );
}
