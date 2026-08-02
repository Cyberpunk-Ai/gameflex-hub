import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

export interface ConversationWithProfile extends Conversation {
  other_user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  last_message?: string;
}

export class MessagesService {
  async getConversations(userId: string): Promise<ConversationWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          p1:profiles!conversations_participant1_id_fkey(id, username, avatar_url),
          p2:profiles!conversations_participant2_id_fkey(id, username, avatar_url)
        `,
        )
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((conv: any) => ({
        ...conv,
        other_user: conv.participant1_id === userId ? conv.p2 : conv.p1,
      }));
    } catch (err) {
      console.error("[MessagesService] getConversations:", err);
      return [];
    }
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles!inner(username, avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Message[];
    } catch (err) {
      console.error("[MessagesService] getMessages:", err);
      return [];
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<{ message: Message | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, content })
        .select()
        .single();

      if (error) throw error;

      // Update last_message_at on the conversation
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return { message: data as Message };
    } catch (err: any) {
      return { message: null, error: err.message || String(err) };
    }
  }

  async createConversation(
    participant1Id: string,
    participant2Id: string,
  ): Promise<{ conversation: Conversation | null; error?: string }> {
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(participant1_id.eq.${participant1Id},participant2_id.eq.${participant2Id}),and(participant1_id.eq.${participant2Id},participant2_id.eq.${participant1Id})`,
        )
        .single();

      if (existing) return { conversation: existing as Conversation };

      const { data, error } = await supabase
        .from("conversations")
        .insert({ participant1_id: participant1Id, participant2_id: participant2Id })
        .select()
        .single();

      if (error) throw error;
      return { conversation: data as Conversation };
    } catch (err: any) {
      return { conversation: null, error: err.message || String(err) };
    }
  }

  async deleteMessage(messageId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);
    } catch (err) {
      console.error("[MessagesService] markAsRead:", err);
    }
  }
}

export const messagesService = new MessagesService();
