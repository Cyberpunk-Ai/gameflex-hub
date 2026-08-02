// @ts-nocheck
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  let sanitized = text;
  // Strip nested or malformed HTML tags
  let previous;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  } while (sanitized !== previous);

  return sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/javascript:/gi, "")
    .replace(/data:(?!image\/)/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function validateFileUpload(
  file: File,
  opts?: { maxSizeMB?: number; allowedTypes?: string[] },
): { valid: boolean; error?: string } {
  const maxSizeMB = opts?.maxSizeMB ?? 10;
  const allowedTypes = opts?.allowedTypes ?? [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type " + file.type + " is not allowed" };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: "File must be under " + maxSizeMB + "MB" };
  }
  return { valid: true };
}
