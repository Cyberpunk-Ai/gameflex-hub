// @ts-nocheck
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export default function AdminPayments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*, tournaments(title)")
        .limit(200)
        .order("created_at", { ascending: false });

      if (!paymentsData) return [];

      const userIds = [...new Set(paymentsData.map((p) => p.user_id))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return paymentsData.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id),
      }));
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
      tournamentId,
    }: {
      id: string;
      status: "verified" | "rejected";
      rejectionReason?: string;
      tournamentId?: string;
    }) => {
      const { error } = await supabase
        .from("payments")
        .update({
          status,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", id);
      if (error) throw error;

      if (status === "verified") {
        await supabase.from("registrations").update({ status: "confirmed" }).eq("payment_id", id);
      }

      return { status, tournamentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      // Also invalidate tournament queries so participant counts update
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["home-tournaments"] });
      if (data.tournamentId) {
        queryClient.invalidateQueries({ queryKey: ["tournament", data.tournamentId] });
        queryClient.invalidateQueries({ queryKey: ["registrations", data.tournamentId] });
      }
      toast({
        title: data.status === "verified" ? "Payment Verified" : "Payment Rejected",
        description: `Payment has been ${data.status}`,
        variant: data.status === "rejected" ? "destructive" : "default",
      });
    },
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold mb-6">Payment Verification</h1>
        <div className="rounded-xl bg-card border border-border/50 p-8 text-center text-muted-foreground">
          Loading payments...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Payment Verification</h1>
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-8 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur">
              <div>Transaction</div>
              <div>User</div>
              <div>Tournament</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Screenshot</div>
              <div>Date</div>
              <div>Actions</div>
            </div>
            {payments.map((payment: any) => (
              <div
                key={payment.id}
                className="grid grid-cols-8 gap-4 p-4 border-t border-border/50 items-center text-sm"
              >
                <div className="font-mono truncate">{payment.transaction_code ?? "-"}</div>
                <div className="truncate">{payment.profile?.username ?? "-"}</div>
                <div className="truncate">{payment.tournaments?.title ?? "-"}</div>
                <div className="font-semibold">KES {Number(payment.amount).toLocaleString()}</div>
                <div>
                  <Badge
                    variant={
                      payment.status === "verified"
                        ? "default"
                        : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
                <div>
                  {payment.screenshot_url ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedScreenshot(payment.screenshot_url)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {new Date(payment.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  {payment.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          updatePaymentMutation.mutate({
                            id: payment.id,
                            status: "verified",
                            tournamentId: payment.tournament_id,
                          })
                        }
                        disabled={updatePaymentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updatePaymentMutation.mutate({
                            id: payment.id,
                            status: "rejected",
                            rejectionReason: "Invalid transaction",
                            tournamentId: payment.tournament_id,
                          })
                        }
                        disabled={updatePaymentMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No payments found</div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <img
              loading="lazy"
              decoding="async"
              src={selectedScreenshot}
              alt="Payment screenshot"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
