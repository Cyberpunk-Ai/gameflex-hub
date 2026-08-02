// @ts-nocheck
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  showRewardNotification,
  showFollowerNotification,
  showMessageNotification,
  getNotificationPermission,
} from "@/lib/push-notifications";

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || getNotificationPermission() !== "granted") return;

    // Listen for new rewards
    const rewardsChannel = supabase
      .channel("push-rewards")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rewards",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const reward = payload.new as any;
          showRewardNotification(reward.amount, reward.description || "New reward earned!");
        },
      )
      .subscribe();

    // Listen for new followers
    const followsChannel = supabase
      .channel("push-follows")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_follows",
          filter: `following_id=eq.${user.id}`,
        },
        async (payload) => {
          const follow = payload.new as any;
          // Get follower's username
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", follow.follower_id)
            .single();

          if (profile) {
            showFollowerNotification(profile.username);
          }
        },
      )
      .subscribe();

    // Listen for new messages
    const messagesChannel = supabase
      .channel("push-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as any;
          if (message.sender_id === user.id) return; // Don't notify for own messages

          // Check if user is part of the conversation
          const { data: conversation } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", message.conversation_id)
            .single();

          if (!conversation) return;
          if (conversation.participant1_id !== user.id && conversation.participant2_id !== user.id)
            return;

          // Get sender's username
          const { data: sender } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", message.sender_id)
            .single();

          if (sender) {
            showMessageNotification(sender.username, message.content);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rewardsChannel);
      supabase.removeChannel(followsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);
}
