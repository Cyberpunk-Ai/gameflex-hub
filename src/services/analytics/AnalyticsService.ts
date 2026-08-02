import { track as originalTrack, startSession as originalStartSession } from "@/lib/analytics";

export type ExtendedAnalyticsEvent =
  | "login"
  | "logout"
  | "signup"
  | "page_view"
  | "tournament_join"
  | "match_finish"
  | "wallet_deposit"
  | "purchase"
  | "story_view"
  | "reel_view"
  | "like"
  | "comment"
  | "share"
  | "follow"
  | "search"
  | "marketplace_purchase"
  | "notification_open"
  | "friend_request"
  | "session_start"
  | "tournament_viewed"
  | "match_completed"
  | "post_created"
  | "post_liked"
  | "referral";

export class AnalyticsService {
  async track(event: ExtendedAnalyticsEvent, properties?: Record<string, unknown>): Promise<void> {
    try {
      // Cast to any to bypass the original strict typing in lib/analytics.ts,
      // while preserving backwards compatibility
      await originalTrack(event as any, properties);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[AnalyticsService] track error:", err);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("gf_user_id", userId);
      if (traits) {
        window.sessionStorage.setItem("gf_user_traits", JSON.stringify(traits));
      }
    }
  }

  async page(pageName: string, properties?: Record<string, unknown>): Promise<void> {
    await this.track("page_view", { page: pageName, ...properties });
  }

  timing(category: string, variable: string, time: number, label?: string): void {
    this.track("page_view", {
      // mapped to generic or specific timing event
      type: "timing",
      category,
      variable,
      time,
      label,
    });
  }

  async error(error: Error, context?: Record<string, unknown>): Promise<void> {
    // Often reported to Sentry or similar; here we can track it as an event
    try {
      await originalTrack("page_view" as any, {
        is_error: true,
        message: error.message,
        name: error.name,
        stack: error.stack,
        ...context,
      });
    } catch (e) {
      console.error(e);
    }
  }

  startSession(): void {
    originalStartSession();
  }
}

export const analyticsService = new AnalyticsService();
