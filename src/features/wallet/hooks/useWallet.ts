import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { paymentService } from "@/services/payments/PaymentService";
import { supabase } from "@/integrations/supabase/client";

export function usePayments(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.wallet.payments(userId),
    queryFn: () => paymentService.getPaymentHistory(userId),
    enabled: !!userId,
  });
}

export function useRewards(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.wallet.rewards(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      tournamentId: string;
      amount: number;
      method: "mpesa";
      transactionCode?: string;
    }) => paymentService.initiatePayment(params),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallet.payments(vars.userId) });
    },
  });
}

export function useWallet(userId: string) {
  const payments = usePayments(userId);
  const rewards = useRewards(userId);
  return { payments, rewards };
}
