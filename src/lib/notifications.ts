import { supabase } from "@/integrations/supabase/client";

type NotificationAction =
  "tournament_starting" | "match_reminder" | "results_posted" | "registration_confirmed";

interface SendNotificationParams {
  action: NotificationAction;
  tournamentId?: string;
  matchId?: string;
  userId?: string;
}

export async function sendTournamentNotification(params: SendNotificationParams) {
  try {
    const { data, error } = await supabase.functions.invoke("tournament-notifications", {
      body: params,
    });

    if (error) {
      console.error("Failed to send notification:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Notification error:", err);
    return { success: false, error: err };
  }
}

export async function sendWhatsAppMessage(params: {
  type: "registration" | "reminder" | "result" | "promotion";
  userId: string;
  phone: string;
  message: string;
  tournamentId?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: params,
    });

    if (error) {
      console.error("Failed to send WhatsApp:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("WhatsApp error:", err);
    return { success: false, error: err };
  }
}

// Helper to create in-app notification directly
export async function createInAppNotification(params: {
  userId: string;
  type: "tournament" | "payment" | "match" | "system" | "whatsapp";
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    action_url: params.actionUrl,
  });

  if (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error };
  }

  return { success: true };
}
