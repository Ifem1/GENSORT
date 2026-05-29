"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WalletSetup } from "@/components/wallet/WalletSetup";
import { UnlockWallet } from "@/components/wallet/UnlockWallet";
import { loadWallet } from "@/lib/db";
import { useGameStore } from "@/store/gameStore";
import type { EncryptedWallet, WalletSession } from "@/types";

type SignInState = "loading" | "create" | "unlock";

export default function SignInPage() {
  const router = useRouter();
  const { session, setSession } = useGameStore();
  const [state, setState] = useState<SignInState>("loading");
  const [wallet, setWallet] = useState<EncryptedWallet | null>(null);

  useEffect(() => {
    if (session) {
      router.push("/game");
      return;
    }
    void (async () => {
      const w = await loadWallet();
      if (w) {
        setWallet(w);
        setState("unlock");
      } else {
        setState("create");
      }
    })();
  }, [session, router]);

  const handleSuccess = (s: WalletSession) => {
    setSession(s);
    router.push("/game");
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      {/* Ambient effects */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary-purple/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-5xl mb-4 animate-float">🧪</div>
        <h1 className="text-3xl font-black gradient-text">GENSORT</h1>
        <p className="text-text-muted text-sm mt-2">
          {state === "unlock"
            ? "Welcome back, solver"
            : "Create your account to start playing"}
        </p>
      </motion.div>

      {/* Form card */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {state === "loading" && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-primary-purple border-t-transparent animate-spin" />
          </div>
        )}

        {state === "create" && (
          <WalletSetup onSuccess={handleSuccess} />
        )}

        {state === "unlock" && wallet && (
          <UnlockWallet
            walletAddress={wallet.address}
            username={wallet.username}
            onSuccess={handleSuccess}
            onCreateNew={() => {
              setWallet(null);
              setState("create");
            }}
          />
        )}
      </motion.div>

      {/* Decorative bottle row */}
      <motion.div
        className="flex items-end gap-2 mt-12 opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.5 }}
      >
        {["#8B5CF6", "#22D3EE", "#22C55E", "#F59E0B"].map((c, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ delay: i * 0.3, duration: 3, repeat: Infinity }}
            className="flex flex-col items-center"
          >
            <div className="w-5 h-3 rounded-t bg-white/10 border-t border-x border-white/15" />
            <div
              className="w-8 h-16 rounded-b-xl border border-white/15"
              style={{ backgroundColor: c + "33" }}
            >
              <div
                className="w-full h-1/2 mt-auto rounded-b-xl"
                style={{ backgroundColor: c }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
