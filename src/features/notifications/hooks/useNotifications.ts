import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { notificationService } from "@/services/notifications/NotificationService";

export function useNotifications(userId: string) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: QUERY_KEYS.notifications.list(userId),
    queryFn: () => notificationService.getNotifications(userId),
    enabled: !!userId,
  });

  const unreadCountQuery = useQuery({
    queryKey: QUERY_KEYS.notifications.unreadCount(userId),
    queryFn: () => notificationService.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 30 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount(userId) });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount(userId) });
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    unreadCount: unreadCountQuery.data ?? 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}
