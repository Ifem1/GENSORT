"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useGameStore } from "@/store/gameStore";
import { useWallet } from "@/hooks/useWallet";

const NAV_ITEMS = [
  { href: "/game",         label: "Play",         icon: "🎮" },
  { href: "/puzzles",      label: "Puzzles",       icon: "🧩" },
  { href: "/leaderboards", label: "Leaderboard",   icon: "🏆" },
  { href: "/achievements", label: "Achievements",  icon: "🎖️" },
  { href: "/profile",      label: "Profile",       icon: "👤" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isGenLayerSyncing } = useGameStore();
  const { lockWallet } = useWallet();

  const handleSignOut = async () => {
    await lockWallet();
    router.push("/signin");
  };

  if (!session) return null;

  return (
    <>
      {/* Desktop sidebar (hidden on mobile) */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col border-r border-white/8 bg-surface/80 backdrop-blur-xl z-40 p-4 gap-2">
        {/* Logo */}
        <Link href="/game" className="flex items-center gap-2 px-3 py-4 mb-2">
          <div className="w-8 h-8 rounded-xl bg-primary-purple/20 border border-primary-purple/40 flex items-center justify-center text-base">
            🧪
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary-purple to-electric-cyan bg-clip-text text-transparent">
            GENSORT
          </span>
        </Link>

        {/* Nav links */}
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary-purple/15 text-glow-lavender border border-primary-purple/25"
                    : "text-text-muted hover:text-text-main hover:bg-white/5"
                )}
              >
                <span className="text-base">{icon}</span>
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-purple"
                  />
                )}
              </div>
            </Link>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* GenLayer sync indicator */}
        {isGenLayerSyncing && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-electric-cyan"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            Syncing…
          </div>
        )}

        {/* Wallet info */}
        <Link href="/wallet">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-primary-purple/20 flex items-center justify-center text-xs font-bold text-glow-lavender">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-text-main truncate">
                {session.username}
              </div>
              <div className="text-[10px] text-text-muted truncate font-mono">
                {session.address.slice(0, 6)}…{session.address.slice(-4)}
              </div>
            </div>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-danger-coral hover:bg-danger-coral/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-surface/90 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 4).map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  className={clsx(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                    active ? "text-primary-purple" : "text-text-muted"
                  )}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-[10px] font-medium">{label}</span>
                  {active && (
                    <div className="w-1 h-1 rounded-full bg-primary-purple mt-0.5" />
                  )}
                </div>
              </Link>
            );
          })}
          <Link href="/profile">
            <div
              className={clsx(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                pathname.startsWith("/profile") ? "text-primary-purple" : "text-text-muted"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary-purple/20 border border-primary-purple/30 flex items-center justify-center text-xs font-bold text-glow-lavender">
                {session.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-medium">Me</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}
