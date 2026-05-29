"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useGameStore } from "@/store/gameStore";
import { useWallet } from "@/hooks/useWallet";

export default function WalletPage() {
  const router = useRouter();
  const { session } = useGameStore();
  const { exportPrivateKey, deleteCurrentWallet, lockWallet, isLoading, error } =
    useWallet();

  const [showExport, setShowExport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportedKey, setExportedKey] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session) router.push("/signin");
  }, [session, router]);

  if (!session) return null;

  const handleExport = async () => {
    try {
      const key = await exportPrivateKey(exportPassword);
      setExportedKey(key);
    } catch {
      // handled in hook
    }
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(exportedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    try {
      // Verify password first
      await exportPrivateKey(deletePassword);
      await deleteCurrentWallet();
      router.push("/signin");
    } catch {
      // error in hook
    }
  };

  const handleLock = async () => {
    await lockWallet();
    router.push("/signin");
  };

  const SETTINGS = [
    {
      label: "Network",
      value: process.env.NEXT_PUBLIC_NETWORK ?? "localnet",
      badge: <Badge variant="cyan" size="sm">GenLayer</Badge>,
    },
    {
      label: "Contract",
      value: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "Not set").slice(0, 14) + "…",
      badge: null,
    },
  ];

  return (
    <div className="min-h-dvh px-4 py-6 max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-main">Wallet & Settings</h1>
        <p className="text-text-muted text-sm mt-1">Manage your embedded wallet</p>
      </motion.div>

      {/* Wallet info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard raised glow padding="md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-purple/20 border border-primary-purple/30 flex items-center justify-center text-2xl font-bold text-glow-lavender">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-text-main">{session.username}</div>
              <Badge variant="green" size="sm" dot>Active session</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wide">Address</label>
              <div className="mt-1 bg-surface/60 rounded-lg px-3 py-2 font-mono text-xs text-text-main break-all">
                {session.address}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Actions</h2>

        <button
          onClick={() => { setShowExport(true); setExportedKey(""); setExportPassword(""); }}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-surface-raised/60 border border-white/8 hover:border-primary-purple/30 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-electric-cyan/10 border border-electric-cyan/25 flex items-center justify-center">
            📤
          </div>
          <div>
            <div className="font-medium text-text-main text-sm">Export Private Key</div>
            <div className="text-xs text-text-muted">Download your key for backup</div>
          </div>
        </button>

        <button
          onClick={handleLock}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-surface-raised/60 border border-white/8 hover:border-warning-amber/30 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-warning-amber/10 border border-warning-amber/25 flex items-center justify-center">
            🔒
          </div>
          <div>
            <div className="font-medium text-text-main text-sm">Lock Wallet</div>
            <div className="text-xs text-text-muted">Sign out and require password next visit</div>
          </div>
        </button>

        <button
          onClick={() => { setShowDelete(true); setDeletePassword(""); }}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-surface-raised/60 border border-white/8 hover:border-danger-coral/30 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-danger-coral/10 border border-danger-coral/25 flex items-center justify-center">
            🗑️
          </div>
          <div>
            <div className="font-medium text-danger-coral text-sm">Delete Wallet</div>
            <div className="text-xs text-text-muted">Remove wallet from this device</div>
          </div>
        </button>
      </motion.div>

      {/* Network settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Network
        </h2>
        <GlassCard padding="md" className="space-y-3">
          {SETTINGS.map(({ label, value, badge }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{label}</span>
              <div className="flex items-center gap-2">
                {badge}
                <span className="text-xs font-mono text-text-main">{value}</span>
              </div>
            </div>
          ))}
        </GlassCard>
      </motion.div>

      {/* Export modal */}
      <Modal isOpen={showExport} onClose={() => setShowExport(false)} title="Export Private Key" size="sm">
        {!exportedKey ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Enter your password to reveal the private key. Keep it secret — anyone with
              this key controls your wallet.
            </p>
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExport()}
              placeholder="Your password"
              autoFocus
              className="input-base"
            />
            {error && (
              <p className="text-sm text-danger-coral">{error}</p>
            )}
            <Button variant="primary" fullWidth isLoading={isLoading} onClick={handleExport}>
              Reveal Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-warning-amber/10 border border-warning-amber/30 rounded-xl p-3 text-xs text-warning-amber">
              ⚠️ Never share this key. Store it securely offline.
            </div>
            <div className="bg-surface rounded-xl p-3 font-mono text-xs text-text-main break-all select-all">
              {exportedKey}
            </div>
            <Button
              variant={copied ? "success" : "secondary"}
              fullWidth
              onClick={handleCopy}
            >
              {copied ? "✓ Copied!" : "Copy to Clipboard"}
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Wallet" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            This will permanently remove your wallet from this device. Make sure you have
            exported your private key first.
          </p>
          <div className="bg-danger-coral/10 border border-danger-coral/25 rounded-xl p-3 text-xs text-danger-coral">
            ⚠️ This action cannot be undone.
          </div>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
            placeholder="Enter password to confirm"
            className="input-base"
          />
          {error && <p className="text-sm text-danger-coral">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth isLoading={isLoading} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
