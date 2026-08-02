import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const isValidUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const SUPABASE_URL = isValidUrl(rawUrl)
  ? rawUrl!.trim()
  : "https://xsakgueycwgloiaiwkti.supabase.co";

/** Origin of the data backend, used to preconnect before the first query. */
export const SUPABASE_ORIGIN = new URL(SUPABASE_URL).origin;

const SUPABASE_ANON_KEY =
  rawKey && rawKey.trim().length > 20
    ? rawKey.trim()
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYWtndWV5Y3dnbG9pYWl3a3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDMwNTYsImV4cCI6MjA4MTY3OTA1Nn0.JNhZydjCDCb2Zss-OevZ9rIIggZTDgaMguUBfUmLo3s";

const isBrowser = typeof window !== "undefined";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isBrowser ? window.localStorage : undefined,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
  },
});
