"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useGameStore } from "@/store/gameStore";
import { getSession } from "@/lib/db";

const FEATURES = [
  {
    icon: "🧪",
    title: "Onchain Puzzles",
    description: "All moves validated on GenLayer. Your progress is permanently stored on the blockchain.",
    badge: "GenLayer",
    badgeVariant: "purple" as const,
  },
  {
    icon: "🔐",
    title: "Embedded Wallet",
    description: "No browser extensions needed. Your wallet is created automatically and encrypted locally.",
    badge: "AES-256",
    badgeVariant: "cyan" as const,
  },
  {
    icon: "🎨",
    title: "Colour Sorting",
    description: "Sort the liquid colours into matching bottles. 3 difficulty levels and daily challenges.",
    badge: "Puzzle",
    badgeVariant: "green" as const,
  },
  {
    icon: "🏆",
    title: "Leaderboards",
    description: "Compete globally. Fewest moves and fastest time earn top spots.",
    badge: "Global",
    badgeVariant: "amber" as const,
  },
];

const STEPS = [
  { num: "01", label: "Sign Up", desc: "Create a username & password — no crypto knowledge needed." },
  { num: "02", label: "Select Puzzle", desc: "Choose a difficulty or tackle the daily challenge." },
  { num: "03", label: "Sort & Solve", desc: "Pour colours, track moves, race the clock." },
  { num: "04", label: "Earn On-Chain", desc: "Results are recorded on GenLayer forever." },
];

export default function LandingPage() {
  const router = useRouter();
  const { session } = useGameStore();

  useEffect(() => {
    // If there's an active session, redirect to game
    if (session) {
      router.push("/game");
      return;
    }
    // Check IndexedDB for persisted session
    void getSession().then((s) => {
      if (s) router.push("/signin");
    });
  }, [session, router]);

  return (
    <div className="min-h-dvh">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-dvh text-center px-4 py-20 gap-8">
        {/* Logo mark */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary-purple/20 border border-primary-purple/40 flex items-center justify-center text-3xl glow-purple">
            🧪
          </div>
          <span className="text-4xl font-black tracking-tight gradient-text">
            GENSORT
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="space-y-4 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-text-main">
            Sort the Colours.
            <br />
            <span className="gradient-text">Beat the Chain.</span>
          </h1>
          <p className="text-lg text-text-muted max-w-xl mx-auto leading-relaxed">
            A fully onchain Water Colour Sort puzzle game powered by
            GenLayer intelligent contracts. No wallets required — we handle
            everything for you.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Link href="/signin">
            <Button variant="primary" size="xl" glow>
              🎮 Start Playing Free
            </Button>
          </Link>
          <Link href="/leaderboards">
            <Button variant="outline" size="xl">
              🏆 View Leaderboard
            </Button>
          </Link>
        </motion.div>

        {/* Mini bottle preview */}
        <motion.div
          className="flex items-end gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {[
            ["#EF4444", "#3B82F6", "#22C55E", "#EAB308"],
            ["#22C55E", "#EF4444", "#3B82F6", "#8B5CF6"],
            [],
            ["#EAB308", "#8B5CF6", "#22C55E", "#EF4444"],
            ["#3B82F6", "#EAB308", "#8B5CF6", "#EF4444"],
          ].map((cols, i) => (
            <motion.div
              key={i}
              className="flex flex-col-reverse"
              animate={{ y: [0, -4, 0] }}
              transition={{ delay: i * 0.2, duration: 3, repeat: Infinity }}
            >
              <div className="w-8 h-28 rounded-b-xl border border-white/15 bg-white/5 overflow-hidden flex flex-col-reverse">
                {cols.map((c, j) => (
                  <div key={j} className="h-7 w-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="w-5 h-3 mx-auto rounded-t bg-white/10 border-t border-x border-white/15" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-center text-text-main mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Why <span className="gradient-text">GENSORT</span>?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon, title, description, badge, badgeVariant }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard raised hover padding="lg" className="h-full">
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{icon}</span>
                    <Badge variant={badgeVariant} size="sm">{badge}</Badge>
                  </div>
                  <h3 className="font-semibold text-text-main text-lg">{title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed flex-1">{description}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-center text-text-main mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <div className="space-y-4">
          {STEPS.map(({ num, label, desc }, i) => (
            <motion.div
              key={i}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-purple/20 border border-primary-purple/30 flex items-center justify-center font-mono text-sm font-bold text-glow-lavender">
                {num}
              </div>
              <div className="pt-2">
                <h3 className="font-semibold text-text-main">{label}</h3>
                <p className="text-text-muted text-sm mt-0.5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 text-center">
        <GlassCard raised glow padding="lg" className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-text-main mb-3">
            Ready to Sort?
          </h2>
          <p className="text-text-muted text-sm mb-6">
            Join thousands of players competing on GenLayer.
          </p>
          <Link href="/signin">
            <Button variant="primary" size="xl" fullWidth glow>
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-4 py-8 text-center text-text-muted text-xs space-y-1">
        <p className="font-semibold gradient-text text-sm">GENSORT</p>
        <p>Powered by GenLayer Intelligent Contracts</p>
        <p className="opacity-50">© {new Date().getFullYear()} GENSORT. Onchain forever.</p>
      </footer>
    </div>
  );
}
