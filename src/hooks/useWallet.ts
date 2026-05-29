"use client";

import { useState, useCallback } from "react";
import { generatePrivateKey, createAccount } from "genlayer-js";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  saveWallet,
  loadWallet,
  deleteWallet,
  walletExists,
  createSession as dbCreateSession,
  clearSession as dbClearSession,
} from "@/lib/db";
import { useGameStore } from "@/store/gameStore";
import type { EncryptedWallet, WalletSession } from "@/types";

interface UseWalletReturn {
  isLoading: boolean;
  error: string | null;
  createWallet: (username: string, password: string) => Promise<WalletSession>;
  unlockWallet: (password: string) => Promise<WalletSession>;
  lockWallet: () => Promise<void>;
  checkWalletExists: () => Promise<boolean>;
  exportPrivateKey: (password: string) => Promise<string>;
  importPrivateKey: (
    privateKey: string,
    username: string,
    password: string
  ) => Promise<WalletSession>;
  deleteCurrentWallet: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession, clearSession } = useGameStore();

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createWallet = useCallback(
    (username: string, password: string) =>
      withLoading(async () => {
        const privateKey = generatePrivateKey();
        const account = createAccount(privateKey);

        const { ciphertext, salt, iv } = await encrypt(privateKey, password);

        const encryptedWallet: EncryptedWallet = {
          address: account.address,
          username,
          encryptedPrivateKey: ciphertext,
          salt,
          iv,
          createdAt: Date.now(),
        };

        await saveWallet(encryptedWallet);
        await dbCreateSession(account.address);

        const session: WalletSession = {
          address: account.address,
          username,
          privateKey,
        };
        setSession(session);
        return session;
      }),
    [withLoading, setSession]
  );

  const unlockWallet = useCallback(
    (password: string) =>
      withLoading(async () => {
        const wallet = await loadWallet();
        if (!wallet) throw new Error("No wallet found. Please sign up first.");

        const privateKey = await decrypt(
          wallet.encryptedPrivateKey,
          password,
          wallet.salt,
          wallet.iv
        );

        await dbCreateSession(wallet.address);

        const session: WalletSession = {
          address: wallet.address,
          username: wallet.username,
          privateKey: privateKey as `0x${string}`,
        };
        setSession(session);
        return session;
      }),
    [withLoading, setSession]
  );

  const lockWallet = useCallback(async () => {
    await dbClearSession();
    clearSession();
  }, [clearSession]);

  const checkWalletExists = useCallback(() => walletExists(), []);

  const exportPrivateKey = useCallback(
    (password: string) =>
      withLoading(async () => {
        const wallet = await loadWallet();
        if (!wallet) throw new Error("No wallet found.");
        return decrypt(wallet.encryptedPrivateKey, password, wallet.salt, wallet.iv);
      }),
    [withLoading]
  );

  const importPrivateKey = useCallback(
    (privateKey: string, username: string, password: string) =>
      withLoading(async () => {
        const pk = privateKey.startsWith("0x")
          ? (privateKey as `0x${string}`)
          : (`0x${privateKey}` as `0x${string}`);

        const account = createAccount(pk);
        const { ciphertext, salt, iv } = await encrypt(pk, password);

        const encryptedWallet: EncryptedWallet = {
          address: account.address,
          username,
          encryptedPrivateKey: ciphertext,
          salt,
          iv,
          createdAt: Date.now(),
        };

        await saveWallet(encryptedWallet);
        await dbCreateSession(account.address);

        const session: WalletSession = {
          address: account.address,
          username,
          privateKey: pk,
        };
        setSession(session);
        return session;
      }),
    [withLoading, setSession]
  );

  const deleteCurrentWallet = useCallback(
    () =>
      withLoading(async () => {
        await deleteWallet();
        await dbClearSession();
        clearSession();
      }),
    [withLoading, clearSession]
  );

  return {
    isLoading,
    error,
    createWallet,
    unlockWallet,
    lockWallet,
    checkWalletExists,
    exportPrivateKey,
    importPrivateKey,
    deleteCurrentWallet,
  };
}
