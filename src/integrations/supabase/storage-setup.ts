// Storage bucket initialization
// Run this SQL in your Supabase SQL editor to create required buckets:
// INSERT INTO storage.buckets (id, name, public) VALUES
//   ('status-media', 'status-media', true),
//   ('avatars', 'avatars', true),
//   ('tournament-images', 'tournament-images', true),
//   ('reels', 'reels', true),
//   ('messages', 'messages', false)
// ON CONFLICT (id) DO NOTHING;

export const STORAGE_BUCKETS = {
  STATUS_MEDIA: "status-media",
  AVATARS: "avatars",
  TOURNAMENT_IMAGES: "tournament-images",
  REELS: "reels",
  MESSAGES: "messages",
} as const;
