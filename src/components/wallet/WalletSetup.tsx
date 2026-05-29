"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWallet } from "@/hooks/useWallet";
import type { WalletSession } from "@/types";

interface WalletSetupProps {
  onSuccess: (session: WalletSession) => void;
}

export function WalletSetup({ onSuccess }: WalletSetupProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importKey, setImportKey] = useState("");
  const { createWallet, importPrivateKey, isLoading, error } = useWallet();

  const validateForm = (): string | null => {
    if (!username.trim()) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirm) return "Passwords do not match";
    return null;
  };

  const handleCreate = async () => {
    const err = validateForm();
    if (err) return;
    try {
      const session = await createWallet(username.trim(), password);
      onSuccess(session);
    } catch {
      // error handled in hook
    }
  };

  const handleImport = async () => {
    if (!importKey.trim() || !username.trim() || !password) return;
    try {
      const session = await importPrivateKey(
        importKey.trim(),
        username.trim(),
        password
      );
      onSuccess(session);
    } catch {
      // error handled in hook
    }
  };

  return (
    <GlassCard raised animate padding="lg">
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-text-main">Create Your Wallet</h2>
          <p className="text-sm text-text-muted mt-1">
            A secure wallet will be created and stored locally
          </p>
        </div>

        {!showImport ? (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a display name"
                className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm focus:outline-none focus:border-primary-purple/60 focus:ring-1 focus:ring-primary-purple/30 transition-all"
                maxLength={32}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm focus:outline-none focus:border-primary-purple/60 focus:ring-1 focus:ring-primary-purple/30 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm focus:outline-none focus:border-primary-purple/60 focus:ring-1 focus:ring-primary-purple/30 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>

            {error && (
              <p className="text-sm text-danger-coral bg-danger-coral/10 px-3 py-2 rounded-lg border border-danger-coral/20">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              glow
              isLoading={isLoading}
              onClick={handleCreate}
            >
              Create Wallet & Start Playing
            </Button>

            <button
              className="w-full text-center text-sm text-text-muted hover:text-primary-purple transition-colors"
              onClick={() => setShowImport(true)}
            >
              Import existing private key →
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a display name"
                className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm focus:outline-none focus:border-primary-purple/60 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Private Key
              </label>
              <textarea
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                placeholder="0x... (hex private key)"
                rows={3}
                className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm font-mono focus:outline-none focus:border-warning-amber/60 transition-all resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Encryption Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password to encrypt your key"
                className="mt-1.5 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted/50 text-sm focus:outline-none focus:border-primary-purple/60 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-danger-coral bg-danger-coral/10 px-3 py-2 rounded-lg border border-danger-coral/20">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              onClick={handleImport}
            >
              Import Wallet
            </Button>

            <button
              className="w-full text-center text-sm text-text-muted hover:text-primary-purple transition-colors"
              onClick={() => setShowImport(false)}
            >
              ← Create new wallet instead
            </button>
          </motion.div>
        )}

        <div className="flex items-start gap-2 text-xs text-text-muted bg-primary-purple/5 border border-primary-purple/15 rounded-xl p-3">
          <span className="flex-shrink-0 mt-0.5">🔒</span>
          <span>
            Your private key is encrypted with AES-256 and stored only in your
            browser's IndexedDB. It never leaves your device.
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
