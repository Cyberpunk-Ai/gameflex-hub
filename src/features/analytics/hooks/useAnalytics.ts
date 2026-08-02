// @ts-nocheck
import { useMutation } from "@tanstack/react-query";

export function useAnalytics() {
  const trackEventMutation = useMutation({
    mutationFn: async (event: any) => {
      // @ts-ignore
      const { analyticsService } = await import("@/services/analytics/AnalyticsService");
      return analyticsService.trackEvent(event);
    },
  });

  return { trackEvent: trackEventMutation.mutate };
}
