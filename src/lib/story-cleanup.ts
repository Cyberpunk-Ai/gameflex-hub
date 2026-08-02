import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes stories created > 24 hours ago (where expires_at is non-null) from database & storage.
 * Permanent posts (where expires_at is null) remain unaffected and are preserved indefinitely.
 */
export async function cleanupExpiredStories() {
  try {
    const nowIso = new Date().toISOString();
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Select statuses that are stories (expires_at is non-null) and have passed their 24h expiration
    const { data: expired } = await supabase
      .from("user_statuses")
      .select("id, media_url, media_type, expires_at")
      .not("expires_at", "is", null)
      .or(`expires_at.lte.${nowIso},created_at.lt.${cutoff24h}`);

    if (expired && expired.length > 0) {
      const idsToDelete = expired.map((s) => s.id);

      // Clean up files in status-media bucket if applicable
      for (const item of expired) {
        if (item.media_url && item.media_url.includes("status-media")) {
          try {
            const urlParts = item.media_url.split("/status-media/");
            if (urlParts[1]) {
              const filePath = decodeURIComponent(urlParts[1].split("?")[0]);
              await supabase.storage.from("status-media").remove([filePath]);
            }
          } catch {
            // storage deletion error ignore
          }
        }
      }

      // Delete expired rows from database
      await supabase.from("user_statuses").delete().in("id", idsToDelete);
    }
  } catch (err) {
    console.error("Error during story cleanup:", err);
  }
}
