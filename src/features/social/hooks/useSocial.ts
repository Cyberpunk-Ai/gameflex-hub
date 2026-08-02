import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { socialService } from "@/services/social/SocialService";

export function useSocialFeed(userId: string, limit = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.social.feed(userId), limit],
    queryFn: () => socialService.getActivityFeed(userId, limit),
    enabled: !!userId,
  });
}

export function useStatusFeed(userId?: string, limit = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.social.statuses(userId ?? "global"), limit],
    queryFn: () => socialService.getStatusFeed(userId, limit),
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followerId, followingId }: { followerId: string; followingId: string }) =>
      socialService.follow(followerId, followingId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.followers(vars.followingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.following(vars.followerId) });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followerId, followingId }: { followerId: string; followingId: string }) =>
      socialService.unfollow(followerId, followingId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.followers(vars.followingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles.following(vars.followerId) });
    },
  });
}

export function useIsFollowing(followerId: string, followingId: string) {
  return useQuery({
    queryKey: ["following", followerId, followingId],
    queryFn: () => socialService.isFollowing(followerId, followingId),
    enabled: !!followerId && !!followingId,
  });
}

export function useCreateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      content,
      imageUrl,
    }: {
      userId: string;
      content: string;
      imageUrl?: string;
    }) => socialService.createStatus(userId, content, imageUrl),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.social.statuses(vars.userId) });
    },
  });
}
