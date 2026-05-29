"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWallet } from "@/hooks/useWallet";
import type { WalletSession } from "@/types";

interface UnlockWalletProps {
  walletAddress: `0x${string}`;
  username: string;
  onSuccess: (session: WalletSession) => void;
  onCreateNew?: () => void;
}

export function UnlockWallet({
  walletAddress,
  username,
  onSuccess,
  onCreateNew,
}: UnlockWalletProps) {
  const [password, setPassword] = useState("");
  const { unlockWallet, isLoading, error } = useWallet();

  const handleUnlock = async () => {
    if (!password) return;
    try {
      const session = await unlockWallet(password);
      onSuccess(session);
    } catch {
      // error handled in hook
    }
  };

  return (
    <GlassCard raised animate padding="lg">
      <div className="space-y-5">
        <div className="text-center">
          <motion.div
            className="text-4xl mb-3"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            🔓
          </motion.div>
          <h2 className="text-xl font-bold text-text-main">Welcome Back</h2>
          <p className="text-sm text-text-muted mt-1">
            Enter your password to unlock your wallet
          </p>
        </div>

        {/* Wallet info */}
        <div className="bg-surface/60 border border-white/8 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-purple/20 border border-primary-purple/30 flex items-center justify-center text-lg font-bold text-glow-lavender flex-shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-text-main text-sm">{username}</div>
            <div className="text-xs text-text-muted font-mono truncate">
              {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter your password"
            autoFocus
            className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm focus:outline-none focus:border-primary-purple/60 focus:ring-1 focus:ring-primary-purple/30 transition-all"
          />
        </div>

        {error && (
          <motion.p
            className="text-sm text-danger-coral bg-danger-coral/10 px-3 py-2 rounded-lg border border-danger-coral/20"
            initial={{ x: -4 }}
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
          >
            {error === "The operation failed for an operation-specific reason"
              ? "Incorrect password. Please try again."
              : error}
          </motion.p>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          glow
          isLoading={isLoading}
          onClick={handleUnlock}
        >
          Unlock & Play
        </Button>

        {onCreateNew && (
          <button
            className="w-full text-center text-sm text-text-muted hover:text-text-main transition-colors"
            onClick={onCreateNew}
          >
            Create a new wallet instead →
          </button>
        )}
      </div>
    </GlassCard>
  );
}
