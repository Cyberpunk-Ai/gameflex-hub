export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          points: number;
          requirement_type: string;
          requirement_value: number;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description: string;
          icon?: string;
          id?: string;
          name: string;
          points?: number;
          requirement_type: string;
          requirement_value?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          points?: number;
          requirement_type?: string;
          requirement_value?: number;
        };
        Relationships: [];
      };
      activity_feed: {
        Row: {
          activity_type: string;
          created_at: string;
          description: string | null;
          id: string;
          is_public: boolean | null;
          metadata: Json | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          metadata?: Json | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          metadata?: Json | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string | null;
          participant1_id: string;
          participant2_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          participant1_id: string;
          participant2_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          participant1_id?: string;
          participant2_id?: string;
        };
        Relationships: [];
      };
      game_rooms: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          match_id: string | null;
          password: string | null;
          platform: Database["public"]["Enums"]["platform_type"];
          room_code: string;
          tournament_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          match_id?: string | null;
          password?: string | null;
          platform?: Database["public"]["Enums"]["platform_type"];
          room_code: string;
          tournament_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          match_id?: string | null;
          password?: string | null;
          platform?: Database["public"]["Enums"]["platform_type"];
          room_code?: string;
          tournament_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_rooms_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rooms_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      leaderboard_stats: {
        Row: {
          created_at: string;
          earnings: number | null;
          id: string;
          losses: number | null;
          points: number | null;
          tournaments_played: number | null;
          updated_at: string;
          user_id: string;
          wins: number | null;
        };
        Insert: {
          created_at?: string;
          earnings?: number | null;
          id?: string;
          losses?: number | null;
          points?: number | null;
          tournaments_played?: number | null;
          updated_at?: string;
          user_id: string;
          wins?: number | null;
        };
        Update: {
          created_at?: string;
          earnings?: number | null;
          id?: string;
          losses?: number | null;
          points?: number | null;
          tournaments_played?: number | null;
          updated_at?: string;
          user_id?: string;
          wins?: number | null;
        };
        Relationships: [];
      };
      marketplace_listings: {
        Row: {
          category: Database["public"]["Enums"]["listing_category"];
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          price: number;
          seller_id: string;
          status: Database["public"]["Enums"]["listing_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: Database["public"]["Enums"]["listing_category"];
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          price: number;
          seller_id: string;
          status?: Database["public"]["Enums"]["listing_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["listing_category"];
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          price?: number;
          seller_id?: string;
          status?: Database["public"]["Enums"]["listing_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          match_number: number;
          player1_id: string | null;
          player1_score: number | null;
          player2_id: string | null;
          player2_score: number | null;
          round: number;
          scheduled_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          tournament_id: string;
          updated_at: string;
          winner_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          match_number: number;
          player1_id?: string | null;
          player1_score?: number | null;
          player2_id?: string | null;
          player2_score?: number | null;
          round: number;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          tournament_id: string;
          updated_at?: string;
          winner_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          match_number?: number;
          player1_id?: string | null;
          player1_score?: number | null;
          player2_id?: string | null;
          player2_score?: number | null;
          round?: number;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          tournament_id?: string;
          updated_at?: string;
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          is_encrypted: boolean | null;
          is_read: boolean | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          is_encrypted?: boolean | null;
          is_read?: boolean | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          is_encrypted?: boolean | null;
          is_read?: boolean | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string;
          id: string;
          is_read: boolean | null;
          message: string;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          message: string;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          method: string | null;
          rejection_reason: string | null;
          screenshot_url: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          tournament_id: string;
          transaction_code: string | null;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          method?: string | null;
          rejection_reason?: string | null;
          screenshot_url?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          tournament_id: string;
          transaction_code?: string | null;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          method?: string | null;
          rejection_reason?: string | null;
          screenshot_url?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          tournament_id?: string;
          transaction_code?: string | null;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          email: string | null;
          followers_count: number | null;
          following_count: number | null;
          game_handle: string | null;
          id: string;
          is_verified: boolean | null;
          phone: string | null;
          referral_code: string | null;
          updated_at: string;
          user_id: string;
          username: string;
          wallet_balance: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          game_handle?: string | null;
          id?: string;
          is_verified?: boolean | null;
          phone?: string | null;
          referral_code?: string | null;
          updated_at?: string;
          user_id: string;
          username: string;
          wallet_balance?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          game_handle?: string | null;
          id?: string;
          is_verified?: boolean | null;
          phone?: string | null;
          referral_code?: string | null;
          updated_at?: string;
          user_id?: string;
          username?: string;
          wallet_balance?: number | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          bonus_claimed: boolean | null;
          created_at: string;
          id: string;
          referred_id: string;
          referrer_id: string;
          status: string;
        };
        Insert: {
          bonus_claimed?: boolean | null;
          created_at?: string;
          id?: string;
          referred_id: string;
          referrer_id: string;
          status?: string;
        };
        Update: {
          bonus_claimed?: boolean | null;
          created_at?: string;
          id?: string;
          referred_id?: string;
          referrer_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          created_at: string;
          game_handle: string;
          id: string;
          payment_id: string | null;
          seed_number: number | null;
          status: Database["public"]["Enums"]["registration_status"];
          tournament_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          game_handle: string;
          id?: string;
          payment_id?: string | null;
          seed_number?: number | null;
          status?: Database["public"]["Enums"]["registration_status"];
          tournament_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          game_handle?: string;
          id?: string;
          payment_id?: string | null;
          seed_number?: number | null;
          status?: Database["public"]["Enums"]["registration_status"];
          tournament_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      rewards: {
        Row: {
          amount: number;
          claimed_at: string | null;
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          status: string | null;
          tournament_id: string | null;
          type: Database["public"]["Enums"]["reward_type"];
          user_id: string;
        };
        Insert: {
          amount: number;
          claimed_at?: string | null;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          status?: string | null;
          tournament_id?: string | null;
          type: Database["public"]["Enums"]["reward_type"];
          user_id: string;
        };
        Update: {
          amount?: number;
          claimed_at?: string | null;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          status?: string | null;
          tournament_id?: string | null;
          type?: Database["public"]["Enums"]["reward_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      status_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_encrypted: boolean | null;
          status_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_encrypted?: boolean | null;
          status_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_encrypted?: boolean | null;
          status_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "status_comments_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "user_statuses";
            referencedColumns: ["id"];
          },
        ];
      };
      status_likes: {
        Row: {
          created_at: string;
          id: string;
          status_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          status_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          status_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "status_likes_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "user_statuses";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          description: string;
          id: string;
          priority: Database["public"]["Enums"]["ticket_priority"];
          status: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          priority?: Database["public"]["Enums"]["ticket_priority"];
          status?: Database["public"]["Enums"]["ticket_status"];
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          priority?: Database["public"]["Enums"]["ticket_priority"];
          status?: Database["public"]["Enums"]["ticket_status"];
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          created_at: string;
          id: string;
          is_staff: boolean | null;
          message: string;
          ticket_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_staff?: boolean | null;
          message: string;
          ticket_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_staff?: boolean | null;
          message?: string;
          ticket_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      tournaments: {
        Row: {
          created_at: string;
          created_by: string | null;
          current_participants: number | null;
          description: string | null;
          end_date: string | null;
          entry_fee: number;
          format: Database["public"]["Enums"]["tournament_format"];
          game: Database["public"]["Enums"]["game_type"];
          group_link: string | null;
          live_stream_link: string | null;
          id: string;
          image_url: string | null;
          max_participants: number;
          prize_pool: number;
          registration_deadline: string;
          rules: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["tournament_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          current_participants?: number | null;
          description?: string | null;
          end_date?: string | null;
          entry_fee?: number;
          format?: Database["public"]["Enums"]["tournament_format"];
          game: Database["public"]["Enums"]["game_type"];
          group_link?: string | null;
          live_stream_link?: string | null;
          id?: string;
          image_url?: string | null;
          max_participants?: number;
          prize_pool?: number;
          registration_deadline: string;
          rules?: string | null;
          start_date: string;
          status?: Database["public"]["Enums"]["tournament_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          current_participants?: number | null;
          description?: string | null;
          end_date?: string | null;
          entry_fee?: number;
          format?: Database["public"]["Enums"]["tournament_format"];
          game?: Database["public"]["Enums"]["game_type"];
          group_link?: string | null;
          live_stream_link?: string | null;
          id?: string;
          image_url?: string | null;
          max_participants?: number;
          prize_pool?: number;
          registration_deadline?: string;
          rules?: string | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["tournament_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
        ];
      };
      user_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_statuses: {
        Row: {
          comments_count: number | null;
          content: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          likes_count: number | null;
          media_type: string | null;
          media_url: string | null;
          user_id: string;
          views_count: number | null;
        };
        Insert: {
          comments_count?: number | null;
          content?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          likes_count?: number | null;
          media_type?: string | null;
          media_url?: string | null;
          user_id: string;
          views_count?: number | null;
        };
        Update: {
          comments_count?: number | null;
          content?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          likes_count?: number | null;
          media_type?: string | null;
          media_url?: string | null;
          user_id?: string;
          views_count?: number | null;
        };
        Relationships: [];
      };
      whatsapp_messages: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          phone: string;
          sent_at: string | null;
          status: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          phone: string;
          sent_at?: string | null;
          status?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          phone?: string;
          sent_at?: string | null;
          status?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
      game_type: "fifa" | "cod" | "pubg" | "fortnite" | "apex" | "valorant" | "other";
      listing_category: "account" | "items" | "coaching" | "other";
      listing_status: "active" | "sold" | "cancelled";
      match_status: "scheduled" | "live" | "completed" | "cancelled";
      notification_type: "tournament" | "payment" | "match" | "system" | "whatsapp";
      payment_status: "pending" | "verified" | "rejected" | "refunded";
      platform_type: "playstation" | "xbox" | "pc" | "mobile";
      registration_status: "pending" | "confirmed" | "cancelled" | "checked_in";
      reward_type: "prize" | "bonus" | "referral" | "achievement";
      ticket_priority: "low" | "medium" | "high" | "urgent";
      ticket_status: "open" | "in_progress" | "resolved" | "closed";
      tournament_format: "single_elimination" | "double_elimination" | "round_robin" | "swiss";
      tournament_status:
        | "upcoming"
        | "registration_open"
        | "registration_closed"
        | "live"
        | "completed"
        | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      game_type: ["fifa", "cod", "pubg", "fortnite", "apex", "valorant", "other"],
      listing_category: ["account", "items", "coaching", "other"],
      listing_status: ["active", "sold", "cancelled"],
      match_status: ["scheduled", "live", "completed", "cancelled"],
      notification_type: ["tournament", "payment", "match", "system", "whatsapp"],
      payment_status: ["pending", "verified", "rejected", "refunded"],
      platform_type: ["playstation", "xbox", "pc", "mobile"],
      registration_status: ["pending", "confirmed", "cancelled", "checked_in"],
      reward_type: ["prize", "bonus", "referral", "achievement"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      tournament_format: ["single_elimination", "double_elimination", "round_robin", "swiss"],
      tournament_status: [
        "upcoming",
        "registration_open",
        "registration_closed",
        "live",
        "completed",
        "cancelled",
      ],
    },
  },
} as const;
