// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type Squad = {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  game: string | null;
  region: string | null;
  is_public: boolean;
  max_members: number;
  owner_id: string;
  wins: number;
  losses: number;
  points: number;
  created_at: string;
  member_count?: number;
  my_role?: SquadRole;
};

export type SquadRole = "owner" | "captain" | "player" | "sub";

export type SquadMember = {
  id: string;
  squad_id: string;
  user_id: string;
  role: SquadRole;
  joined_at: string;
  profiles?: { username: string | null; avatar_url: string | null; user_id?: string } | null;
};

export type SquadInvite = {
  id: string;
  squad_id: string;
  invited_user_id: string;
  invited_by: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message: string | null;
  created_at: string;
  squads?: Squad | null;
  profiles?: { username: string | null; avatar_url: string | null } | null;
};

export type SquadMessage = {
  id: string;
  squad_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  kind: "text" | "image" | "system";
  created_at: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
};

const PROFILE_SELECT = "profiles:profiles!inner(user_id, username, avatar_url)";

/** True when the squad tables have not been provisioned yet. */
export function isMissingSquadTables(error: unknown): boolean {
  const message = String((error as any)?.message ?? error ?? "");
  return /does not exist|schema cache|relation .* squad/i.test(message);
}

export class SquadService {
  async getMySquads(userId: string): Promise<Squad[]> {
    const { data, error } = await supabase
      .from("squad_members")
      .select("role, squads(*)")
      .eq("user_id", userId);
    if (error) return [];

    const squads = (data ?? [])
      .filter((row: any) => row.squads)
      .map((row: any) => ({ ...row.squads, my_role: row.role as SquadRole }));

    return this.withMemberCounts(squads);
  }

  async discoverSquads(userId: string, limit = 12): Promise<Squad[]> {
    const { data, error } = await supabase
      .from("squads")
      .select("*")
      .eq("is_public", true)
      .order("points", { ascending: false })
      .limit(limit);
    if (error) return [];

    const mine = new Set((await this.getMySquads(userId)).map((s) => s.id));
    return this.withMemberCounts((data ?? []).filter((s: any) => !mine.has(s.id)));
  }

  private async withMemberCounts(squads: Squad[]): Promise<Squad[]> {
    if (squads.length === 0) return squads;
    const { data } = await supabase
      .from("squad_members")
      .select("squad_id")
      .in("squad_id", squads.map((s) => s.id));

    const rows = (data ?? []) as { squad_id: string }[];
    return squads.map((squad) => ({
      ...squad,
      member_count: rows.filter((r) => r.squad_id === squad.id).length,
    }));
  }

  async createSquad(
    userId: string,
    input: { name: string; tag: string; description?: string; game?: string; region?: string; is_public?: boolean },
  ): Promise<{ squad: Squad | null; error?: Error }> {
    const { data, error } = await supabase
      .from("squads")
      .insert({
        name: input.name.trim(),
        tag: input.tag.trim().toUpperCase().slice(0, 6),
        description: input.description?.trim() || null,
        game: input.game || null,
        region: input.region || null,
        is_public: input.is_public ?? true,
        owner_id: userId,
      })
      .select("*")
      .single();

    if (error) return { squad: null, error: new Error(error.message) };
    return { squad: data as Squad };
  }

  async updateSquad(squadId: string, patch: Partial<Squad>): Promise<{ error?: Error }> {
    const { error } = await supabase
      .from("squads")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", squadId);
    return error ? { error: new Error(error.message) } : {};
  }

  async getMembers(squadId: string): Promise<SquadMember[]> {
    const { data, error } = await supabase
      .from("squad_members")
      .select(`id, squad_id, user_id, role, joined_at, ${PROFILE_SELECT}`)
      .eq("squad_id", squadId)
      .order("joined_at", { ascending: true });
    if (error) return [];
    return (data ?? []) as SquadMember[];
  }

  async setRole(memberId: string, role: SquadRole): Promise<{ error?: Error }> {
    const { error } = await supabase.from("squad_members").update({ role }).eq("id", memberId);
    return error ? { error: new Error(error.message) } : {};
  }

  async removeMember(memberId: string): Promise<{ error?: Error }> {
    const { error } = await supabase.from("squad_members").delete().eq("id", memberId);
    return error ? { error: new Error(error.message) } : {};
  }

  async leaveSquad(squadId: string, userId: string): Promise<{ error?: Error }> {
    const { error } = await supabase
      .from("squad_members")
      .delete()
      .eq("squad_id", squadId)
      .eq("user_id", userId);
    return error ? { error: new Error(error.message) } : {};
  }

  async invite(
    squadId: string,
    invitedBy: string,
    invitedUserId: string,
    message?: string,
  ): Promise<{ error?: Error }> {
    const { error } = await supabase.from("squad_invites").upsert(
      {
        squad_id: squadId,
        invited_user_id: invitedUserId,
        invited_by: invitedBy,
        message: message?.trim() || null,
        status: "pending",
        responded_at: null,
      },
      { onConflict: "squad_id,invited_user_id" },
    );
    return error ? { error: new Error(error.message) } : {};
  }

  async getMyInvites(userId: string): Promise<SquadInvite[]> {
    const { data, error } = await supabase
      .from("squad_invites")
      .select("*, squads(*)")
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as SquadInvite[];
  }

  async getSquadInvites(squadId: string): Promise<SquadInvite[]> {
    const { data, error } = await supabase
      .from("squad_invites")
      .select(`*, profiles:profiles!squad_invites_invited_user_id_fkey(username, avatar_url)`)
      .eq("squad_id", squadId)
      .eq("status", "pending");
    if (error) return [];
    return (data ?? []) as SquadInvite[];
  }

  async respondToInvite(
    invite: SquadInvite,
    accept: boolean,
    userId: string,
  ): Promise<{ error?: Error }> {
    const { error } = await supabase
      .from("squad_invites")
      .update({
        status: accept ? "accepted" : "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", invite.id);
    if (error) return { error: new Error(error.message) };

    if (!accept) return {};

    const { error: joinError } = await supabase
      .from("squad_members")
      .insert({ squad_id: invite.squad_id, user_id: userId, role: "player" });
    return joinError ? { error: new Error(joinError.message) } : {};
  }

  async joinPublicSquad(squadId: string, userId: string): Promise<{ error?: Error }> {
    const { error } = await supabase
      .from("squad_members")
      .insert({ squad_id: squadId, user_id: userId, role: "player" });
    return error ? { error: new Error(error.message) } : {};
  }

  async getMessages(squadId: string, limit = 100): Promise<SquadMessage[]> {
    const { data, error } = await supabase
      .from("squad_messages")
      .select(`id, squad_id, user_id, content, attachment_url, kind, created_at, ${PROFILE_SELECT}`)
      .eq("squad_id", squadId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as SquadMessage[];
  }

  async sendMessage(
    squadId: string,
    userId: string,
    content: string,
  ): Promise<{ error?: Error }> {
    const trimmed = content.trim();
    if (!trimmed) return { error: new Error("Message is empty") };
    const { error } = await supabase
      .from("squad_messages")
      .insert({ squad_id: squadId, user_id: userId, content: trimmed.slice(0, 2000) });
    return error ? { error: new Error(error.message) } : {};
  }

  /** Live squad chat updates. Returns an unsubscribe function. */
  subscribeToMessages(squadId: string, onMessage: () => void): () => void {
    const channel = supabase
      .channel(`squad_chat_${squadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "squad_messages", filter: `squad_id=eq.${squadId}` },
        () => onMessage(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /** Candidate invitees: people the user follows who are not already in the squad. */
  async getInviteCandidates(userId: string, squadId: string) {
    const { socialService } = await import("@/services/social/SocialService");
    const [following, members, invites] = await Promise.all([
      socialService.getFollowing(userId),
      this.getMembers(squadId),
      this.getSquadInvites(squadId),
    ]);

    const taken = new Set([
      ...members.map((m) => m.user_id),
      ...invites.map((i) => i.invited_user_id),
    ]);

    return (following ?? [])
      .filter(Boolean)
      .map((p: any) => ({
        user_id: p.user_id ?? p.id,
        username: p.username,
        avatar_url: p.avatar_url,
      }))
      .filter((p) => p.user_id && !taken.has(p.user_id));
  }
}

export const squadService = new SquadService();
