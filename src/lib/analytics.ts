// Lightweight event tracker. Append-only; browser-only.
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "login"
  | "signup"
  | "session_start"
  | "tournament_viewed"
  | "tournament_joined"
  | "match_completed"
  | "purchase_made"
  | "friend_added"
  | "referral"
  | "search"
  | "post_created"
  | "post_liked";

const SESSION_KEY = "gf_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

// Set to true after running the analytics_events Supabase migration.
// Keeping it false prevents HTTP 400 errors when the table doesn't exist yet.
const ANALYTICS_ENABLED = false;

export async function track(
  event: AnalyticsEvent,
  properties: Record<string, unknown> = {},
): Promise<void> {
  if (!ANALYTICS_ENABLED || typeof window === "undefined") return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      user_id: userData?.user?.id ?? null,
      event_name: event,
      properties,
      session_id: getSessionId(),
      device: getDevice(),
      path: window.location.pathname,
    };
    // @ts-ignore — table added via migration
    await supabase.from("analytics_events").insert(payload);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[analytics] track failed", err);
  }
}

let sessionStarted = false;
export function startSession() {
  if (sessionStarted) return;
  sessionStarted = true;
  void track("session_start", { referrer: document.referrer || null });
}
