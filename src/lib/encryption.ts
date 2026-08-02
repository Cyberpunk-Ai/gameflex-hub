// Secure client-side encryption for messages and sensitive data
// Uses Web Crypto API for AES-GCM encryption with PBKDF2 key derivation

// Use a more secure approach - key derivation from a secret
const ENCRYPTION_SECRET = "gameflex-secure-platform-2024-v2";
const SALT = "gameflex-encryption-salt-v2";
const ITERATIONS = 100000;

// Cache for derived key to avoid re-deriving on each operation
let cachedKey: CryptoKey | null = null;

async function deriveKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const encoder = new TextEncoder();

  // Import the secret as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_SECRET),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive an AES-GCM key using PBKDF2
  cachedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return cachedKey;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK_SIZE = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK_SIZE) as unknown as number[],
    );
  }
  return btoa(binary);
}

/**
 * Encrypts a message using AES-GCM encryption
 * @param message - The plaintext message to encrypt
 * @returns Base64 encoded encrypted message with IV prepended
 */
export async function encryptMessage(message: string): Promise<string> {
  try {
    const key = await deriveKey();
    const encoder = new TextEncoder();

    // Generate a random IV (12 bytes for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(message),
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as Base64 with a version prefix for future compatibility
    return "v2:" + uint8ArrayToBase64(combined);
  } catch (error) {
    console.error("Encryption failed:", error);
    // Return original message if encryption fails (should not happen in production)
    return message;
  }
}

/**
 * Decrypts a message that was encrypted with encryptMessage
 * @param encryptedMessage - The Base64 encoded encrypted message
 * @returns The decrypted plaintext message
 */
export async function decryptMessage(encryptedMessage: string): Promise<string> {
  if (!encryptedMessage || typeof encryptedMessage !== "string") {
    return encryptedMessage || "";
  }

  try {
    let data = encryptedMessage;
    const hasPrefix = data.startsWith("v2:");
    if (hasPrefix) {
      data = data.slice(3);
    } else {
      // If it doesn't have the v2: prefix, check if it looks like base64
      if (!/^[A-Za-z0-9+/]+=*$/.test(data.trim()) || data.length < 20) {
        return encryptedMessage;
      }
    }

    const cleanData = data.trim();

    // Check base64 validity before calling atob
    if (!/^[A-Za-z0-9+/]+=*$/.test(cleanData)) {
      return encryptedMessage;
    }

    let combined: Uint8Array;
    try {
      const binary = atob(cleanData);
      combined = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    } catch {
      // Not valid Base64 string
      return encryptedMessage;
    }

    // Extract IV (12 bytes) and encrypted data (at least 1 byte)
    if (combined.length < 13) {
      // Data too small to contain IV + ciphertext
      return encryptedMessage;
    }

    const key = await deriveKey();
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);

    return new TextDecoder().decode(decrypted);
  } catch {
    // Return original unencrypted string if decryption fails
    return encryptedMessage;
  }
}

/**
 * Encrypts sensitive data object to JSON string
 * @param data - Object containing sensitive data
 * @returns Encrypted JSON string
 */
export async function encryptData<T>(data: T): Promise<string> {
  const jsonString = JSON.stringify(data);
  return encryptMessage(jsonString);
}

/**
 * Decrypts data that was encrypted with encryptData
 * @param encryptedData - The encrypted data string
 * @returns The decrypted data object
 */
export async function decryptData<T>(encryptedData: string): Promise<T> {
  const jsonString = await decryptMessage(encryptedData);
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return encryptedData as unknown as T;
  }
}

/**
 * Hashes a string using SHA-256 (one-way hash, cannot be decrypted)
 * Useful for storing passwords or sensitive identifiers
 * @param input - The string to hash
 * @returns Hex-encoded hash string
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a cryptographically secure random token
 * @param length - The length of the token in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validates if a string appears to be encrypted (has our version prefix)
 * @param str - String to check
 * @returns Boolean indicating if string appears encrypted
 */
export function isEncrypted(str: string): boolean {
  return str.startsWith("v2:") || (str.length > 20 && /^[A-Za-z0-9+/=]+$/.test(str));
}
