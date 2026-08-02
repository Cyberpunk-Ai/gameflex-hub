// Shared gradient templates for text-only stories.
//
// The `user_statuses` table has no dedicated column for a background template,
// so a text story encodes its chosen template in `media_type` as
// `text:<id>` (with `media_url` left null). Legacy rows written before
// templates existed have `media_type = null` and fall back to a deterministic
// gradient derived from the row, so nothing breaks.

export interface StoryGradient {
  id: string;
  label: string;
  css: string;
}

export const STORY_GRADIENTS: StoryGradient[] = [
  {
    id: "neon",
    label: "Neon",
    css: "linear-gradient(135deg, hsl(142 76% 45%) 0%, hsl(180 100% 50%) 100%)",
  },
  {
    id: "victory",
    label: "Victory",
    css: "linear-gradient(135deg, hsl(45 100% 50%) 0%, hsl(142 76% 45%) 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    css: "linear-gradient(135deg, hsl(142 76% 28%) 0%, hsl(160 80% 45%) 100%)",
  },
  {
    id: "midnight",
    label: "Midnight",
    css: "linear-gradient(135deg, hsl(220 80% 40%) 0%, hsl(142 76% 45%) 100%)",
  },
  {
    id: "ember",
    label: "Ember",
    css: "linear-gradient(135deg, hsl(25 100% 55%) 0%, hsl(0 84% 60%) 100%)",
  },
  {
    id: "aurora",
    label: "Aurora",
    css: "linear-gradient(135deg, hsl(280 80% 55%) 0%, hsl(142 76% 45%) 100%)",
  },
  {
    id: "arcade",
    label: "Arcade",
    css: "linear-gradient(135deg, hsl(280 100% 60%) 0%, hsl(330 100% 60%) 100%)",
  },
  {
    id: "frost",
    label: "Frost",
    css: "linear-gradient(135deg, hsl(200 100% 50%) 0%, hsl(190 90% 70%) 100%)",
  },
  {
    id: "carbon",
    label: "Carbon",
    css: "linear-gradient(135deg, hsl(220 15% 18%) 0%, hsl(220 12% 32%) 100%)",
  },
];

export const DEFAULT_STORY_GRADIENT = STORY_GRADIENTS[0];

/** Encode a template id for storage in `user_statuses.media_type`. */
export function encodeTextStoryType(gradientId: string): string {
  return `text:${gradientId}`;
}

/**
 * Resolve the background CSS for a text story row.
 * Falls back to a stable gradient keyed off `fallbackKey` for legacy rows.
 */
export function resolveStoryGradient(
  mediaType: string | null | undefined,
  fallbackKey = 0,
): string {
  if (mediaType?.startsWith("text:")) {
    const id = mediaType.slice("text:".length);
    const found = STORY_GRADIENTS.find((g) => g.id === id);
    if (found) return found.css;
  }
  const index = Math.abs(fallbackKey) % STORY_GRADIENTS.length;
  return STORY_GRADIENTS[index].css;
}

/** True when the row is a media story rather than a text template story. */
export function isVideoStory(story: {
  media_type?: string | null;
  media_url?: string | null;
}): boolean {
  if (!story.media_url) return false;
  if (story.media_type === "video") return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(story.media_url);
}
