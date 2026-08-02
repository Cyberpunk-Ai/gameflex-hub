import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { socialService } from "@/services/social/SocialService";

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.followers(userId),
    queryFn: () => socialService.getFollowers(userId),
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.following(userId),
    queryFn: () => socialService.getFollowing(userId),
    enabled: !!userId,
  });
}

export function useFriends(userId: string) {
  const followers = useFollowers(userId);
  const following = useFollowing(userId);
  return { followers, following };
}
