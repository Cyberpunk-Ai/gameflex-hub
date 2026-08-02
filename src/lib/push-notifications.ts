// Browser Push Notifications utility

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function showNotification(options: NotificationOptions): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || "/favicon.ico",
    tag: options.tag,
    requireInteraction: options.requireInteraction,
  });

  if (options.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  // Auto-close after 5 seconds if not interactive
  if (!options.requireInteraction) {
    setTimeout(() => notification.close(), 5000);
  }
}

// Notification types for the platform
export function showRewardNotification(amount: number, description: string): void {
  showNotification({
    title: "🎉 New Reward!",
    body: `You earned KES ${amount.toLocaleString()} - ${description}`,
    tag: "reward",
    onClick: () => {
      window.location.href = "/rewards";
    },
  });
}

export function showMatchNotification(tournamentName: string, opponent: string): void {
  showNotification({
    title: "⚔️ Match Starting!",
    body: `Your match in ${tournamentName} against ${opponent} is starting`,
    tag: "match",
    requireInteraction: true,
    onClick: () => {
      window.location.href = "/my-matches";
    },
  });
}

export function showTournamentNotification(tournamentName: string, message: string): void {
  showNotification({
    title: `🏆 ${tournamentName}`,
    body: message,
    tag: "tournament",
    onClick: () => {
      window.location.href = "/tournaments";
    },
  });
}

export function showFollowerNotification(username: string): void {
  showNotification({
    title: "👤 New Follower!",
    body: `${username} started following you`,
    tag: "follower",
    onClick: () => {
      window.location.href = "/dashboard";
    },
  });
}

export function showMessageNotification(username: string, preview: string): void {
  showNotification({
    title: `💬 ${username}`,
    body: preview.length > 50 ? preview.substring(0, 50) + "..." : preview,
    tag: "message",
    onClick: () => {
      window.location.href = "/messages";
    },
  });
}
