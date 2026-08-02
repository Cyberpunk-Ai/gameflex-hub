import { useQuery } from "@tanstack/react-query";

export function useReels() {
  return useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      // @ts-ignore
      const { reelsService } = await import("@/services/reels/ReelsService");
      return reelsService.getReels();
    },
  });
}
