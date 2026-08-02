import { useQuery } from "@tanstack/react-query";

export function useStories(userId: string) {
  return useQuery({
    queryKey: ["stories", userId],
    queryFn: async () => {
      // @ts-ignore
      const { storiesService } = await import("@/services/stories/StoriesService");
      return storiesService.getStories(userId);
    },
    enabled: !!userId,
  });
}
