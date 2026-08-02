import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribeToChat(conversationId: string, callback: (payload: any) => void): () => void {
    const channelName = `chat:${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback,
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  subscribeToNotifications(userId: string, callback: (payload: any) => void): () => void {
    const channelName = `notifications:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  subscribeToTournamentUpdates(tournamentId: string, callback: (payload: any) => void): () => void {
    const channelName = `tournaments:${tournamentId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments", filter: `id=eq.${tournamentId}` },
        callback,
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  subscribeToLeaderboard(callback: (payload: any) => void): () => void {
    const channelName = "leaderboard_stats";
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard_stats" },
        callback,
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  subscribeToPresence(
    channelName: string,
    userId: string,
    callback: (users: any[]) => void,
  ): { track: (state: any) => Promise<any>; unsubscribe: () => void } {
    const channel = supabase.channel(`presence:${channelName}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        callback(users);
      })
      .subscribe();

    this.channels.set(`presence:${channelName}`, channel);

    return {
      track: (state: any) =>
        channel.track({ user_id: userId, online_at: new Date().toISOString(), ...state }),
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.channels.delete(`presence:${channelName}`);
      },
    };
  }

  subscribeToFriendActivity(userId: string, callback: (payload: any) => void): () => void {
    const channelName = `friend_activity:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  subscribeToMatchUpdates(matchId: string, callback: (payload: any) => void): () => void {
    const channelName = `matches:${matchId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        callback,
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();
