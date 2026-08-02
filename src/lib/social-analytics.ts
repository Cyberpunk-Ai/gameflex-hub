export function applyCountDelta(current: number | null | undefined, delta: number): number {
  const base = Number.isFinite(current) ? Number(current) : 0;
  return Math.max(0, base + delta);
}

export async function updateStatusCount(
  supabaseClient: { from: (table: string) => any },
  statusId: string,
  field: "likes_count" | "comments_count" | "views_count",
  delta: number,
) {
  return updateEntityCount(supabaseClient, "user_statuses", statusId, field, delta);
}

export async function updateEntityCount(
  supabaseClient: { from: (table: string) => any },
  table: string,
  id: string,
  field: "likes_count" | "comments_count" | "views_count",
  delta: number,
) {
  if (!id) return null;

  try {
    const { data, error } = await supabaseClient
      .from(table)
      .select(field)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    const current = (data as Record<string, number | null> | null)?.[field] ?? 0;
    const nextValue = applyCountDelta(current, delta);

    const { error: updateError } = await supabaseClient
      .from(table)
      .update({ [field]: nextValue })
      .eq("id", id);

    if (!updateError) return nextValue;
  } catch {
    // try fallback
  }

  try {
    const { data, error } = await supabaseClient
      .from("user_statuses")
      .select(field)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const current = (data as Record<string, number | null> | null)?.[field] ?? 0;
    const nextValue = applyCountDelta(current, delta);
    const { error: updateError } = await supabaseClient
      .from("user_statuses")
      .update({ [field]: nextValue })
      .eq("id", id);
    if (updateError) throw updateError;
    return nextValue;
  } catch {
    return null;
  }
}

export function readSavedPosts(
  storage: Pick<Storage, "getItem"> | null | undefined,
  userId: string,
): string[] {
  const storageEngine =
    storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!storageEngine?.getItem) return [];
  const raw = storageEngine.getItem(`gf_saved_posts:${userId}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeSavedPosts(
  storage: Pick<Storage, "setItem" | "removeItem"> | null | undefined,
  userId: string,
  savedIds: string[],
): string[] {
  const storageEngine =
    storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!storageEngine?.setItem || !storageEngine?.removeItem) return [];
  const normalized = Array.from(new Set(savedIds.filter(Boolean)));
  if (!normalized.length) {
    storageEngine.removeItem(`gf_saved_posts:${userId}`);
    return [];
  }
  storageEngine.setItem(`gf_saved_posts:${userId}`, JSON.stringify(normalized));
  return normalized;
}
