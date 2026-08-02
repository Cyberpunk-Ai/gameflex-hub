export const APP_NAME = "GameFlex";
export const APP_TAGLINE = "The Ultimate Esports Platform";
export const APP_DESCRIPTION =
  "Join tournaments, build your legacy, and compete in the ultimate esports arena.";

export const CURRENCY = "KES";
export const CURRENCY_SYMBOL = "KES";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const CACHE = {
  STALE_TIME_DEFAULT: 5 * 60 * 1000,
  STALE_TIME_LEADERBOARD: 60 * 1000,
  STALE_TIME_TOURNAMENTS: 2 * 60 * 1000,
};

export const SUPABASE_BUCKETS = {
  AVATARS: "avatars",
  TOURNAMENT_IMAGES: "tournament-images",
  MARKETPLACE: "marketplace",
  STORIES: "stories",
  REELS: "reels",
};

export const REALTIME_CHANNELS = {
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  PRESENCE: "presence",
  TOURNAMENTS: "tournaments",
};

export const STORAGE = {
  MAX_AVATAR_SIZE_MB: 2,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_SIZE_MB: 50,
};

export const ANALYTICS = {
  SESSION_KEY: "gf_session_id",
};
