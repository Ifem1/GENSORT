"use client";

/**
 * AES-256-GCM encryption / decryption using the Web Crypto API.
 * All keys are derived from a user password via PBKDF2.
 */

const PBKDF2_ITERATIONS = 210_000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// ─── Key derivation ──────────────────────────────────────────────────────────

async function deriveKey(
  password: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface EncryptionResult {
  ciphertext: string; // base64
  salt: string;       // base64
  iv: string;         // base64
}

/** Encrypt `plaintext` with `password` using AES-256-GCM + PBKDF2. */
export async function encrypt(
  plaintext: string,
  password: string
): Promise<EncryptionResult> {
  const saltArr = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(saltArr);
  const ivArr = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(ivArr);

  const saltBuf = saltArr.buffer as ArrayBuffer;
  const ivBuf = ivArr.buffer as ArrayBuffer;

  const key = await deriveKey(password, saltBuf);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBuf },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    ciphertext: bufToBase64(encrypted),
    salt: bufToBase64(saltBuf),
    iv: bufToBase64(ivBuf),
  };
}

/** Decrypt previously encrypted data. Throws on wrong password. */
export async function decrypt(
  ciphertext: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> {
  const saltBuf = base64ToBuf(salt);
  const ivBuf = base64ToBuf(iv);
  const cipherBuf = base64ToBuf(ciphertext);
  const key = await deriveKey(password, saltBuf);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf },
    key,
    cipherBuf
  );

  return new TextDecoder().decode(decrypted);
}

/** Generate a cryptographically random hex string of `bytes` length. */
export function randomHex(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
