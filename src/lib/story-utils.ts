/**
 * Utilities for distinguishing between Posts and Stories.
 * - Posts: Permanent, never expire (expires_at is null), available indefinitely in feed & profiles.
 * - Stories: Ephemeral, expire after 24 hours (expires_at is timestamp 24h after creation).
 */

export function calculateStoryExpiresAt(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export function isStory(status: {
  expires_at?: string | null;
  media_type?: string | null;
}): boolean {
  if (!status) return false;
  if (status.expires_at) return true;
  if (status.media_type && status.media_type.startsWith("text:")) return true;
  return false;
}

export function getStoryRemainingTimeMs(createdAt: string, expiresAt?: string | null): number {
  const targetTime = expiresAt
    ? new Date(expiresAt).getTime()
    : new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
  return Math.max(0, targetTime - Date.now());
}

export function getStoryRemainingHours(createdAt: string, expiresAt?: string | null): number {
  const ms = getStoryRemainingTimeMs(createdAt, expiresAt);
  return ms / (1000 * 60 * 60);
}

export function formatStoryRemainingBadge(createdAt: string, expiresAt?: string | null): string {
  const ms = getStoryRemainingTimeMs(createdAt, expiresAt);
  if (ms <= 0) return "Expired";

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`;
  }
  return `Expires in ${minutes}m`;
}
