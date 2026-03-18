/**
 * Client-side encryption for API keys stored in localStorage.
 *
 * Uses AES-GCM via the Web Crypto API with a key derived from
 * the page origin (PBKDF2). This prevents plain-text exposure
 * in DevTools and casual snooping. The key is decrypted in
 * memory only when needed for an API call.
 *
 * Limitations: a sophisticated XSS attack could still call the
 * decrypt function. The real defense against XSS is CSP headers
 * and secure coding. This layer stops casual/automated scraping.
 */

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const SALT = new TextEncoder().encode("bracket-ai-key-v1");

async function deriveKey(): Promise<CryptoKey> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "localhost";

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(origin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a string. Returns a base64-encoded IV+ciphertext. */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return "";
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/** Decrypt a base64-encoded IV+ciphertext string. */
export async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted) return "";
  try {
    const key = await deriveKey();
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // If decryption fails (e.g., corrupted data), return empty
    return "";
  }
}

/** Check if a string looks like it could be a raw (unencrypted) API key */
export function looksLikeRawKey(value: string): boolean {
  return (
    value.startsWith("sk-") ||
    value.startsWith("sk-ant-") ||
    value.startsWith("key-")
  );
}
