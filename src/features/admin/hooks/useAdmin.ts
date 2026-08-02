import { useQuery } from "@tanstack/react-query";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      // @ts-ignore
      const { adminService } = await import("@/services/admin/AdminService");
      return adminService.getStats();
    },
  });
}
