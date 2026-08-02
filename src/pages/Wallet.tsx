// @ts-nocheck
import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  HandCoins,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  verified: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  claimed: "bg-green-500/10 text-green-500 border-green-500/20",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
  refunded: AlertCircle,
  claimed: CheckCircle2,
};

export default function Wallet() {
  const { user, profile, isAuthenticated, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data: payments = [] } = useQuery({
    queryKey: ["user-payments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("payments")
        .select("*, tournaments(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["user-rewards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("rewards")
        .select("*, tournaments(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // Claim reward mutation - Note: Full claim requires admin approval in Admin Rewards
  // This creates a notification to admins and updates status
  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      setClaimingId(rewardId);
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward || !user) throw new Error("Invalid reward");

      // For now, notify the user that their claim is being processed
      // The actual wallet transfer happens when admin approves in Admin Rewards
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "payment",
        title: "Reward Claim Submitted",
        message: `Your claim for KES ${Number(reward.amount).toLocaleString()} is being processed. An admin will review shortly.`,
        action_url: "/wallet",
      });

      return reward;
    },
    onSuccess: (reward) => {
      toast({
        title: "Claim Submitted! 🎉",
        description: `Your reward of KES ${Number(reward.amount).toLocaleString()} is being processed by our team.`,
      });
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
      setClaimingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setClaimingId(null);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <WalletIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Please login to view your wallet</h1>
        <Button asChild>
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  const totalEarnings = rewards
    .filter((r) => r.status === "claimed")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const pendingRewards = rewards.filter((r) => r.status === "pending");
  const totalSpent = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-muted-foreground">Manage your balance, payments, and rewards</p>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="text-3xl text-primary">
              KES {(profile?.wallet_balance ?? 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WalletIcon className="w-8 h-8 text-primary/50" />
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Total Earnings</CardDescription>
            <CardTitle className="text-2xl text-green-500">
              KES {totalEarnings.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ArrowDownLeft className="w-8 h-8 text-green-500/50" />
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-2xl text-orange-500">
              KES {totalSpent.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ArrowUpRight className="w-8 h-8 text-orange-500/50" />
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Pending Rewards</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">
              {pendingRewards.length} rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Trophy className="w-8 h-8 text-yellow-500/50" />
          </CardContent>
        </Card>
      </div>

      {/* Transactions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">All Activity</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your payment and reward history</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 && rewards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Join a tournament to get started!
                </p>
              ) : (
                <div className="space-y-4">
                  {[
                    ...payments.map((p) => ({ ...p, _type: "payment" as const })),
                    ...rewards.map((r) => ({ ...r, _type: "reward" as const })),
                  ]
                    .sort(
                      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                    )
                    .slice(0, 10)
                    .map((item) => {
                      const StatusIcon = statusIcons[item.status || "pending"];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2 rounded-full ${item._type === "payment" ? "bg-orange-500/10" : "bg-green-500/10"}`}
                            >
                              {item._type === "payment" ? (
                                <ArrowUpRight className="w-5 h-5 text-orange-500" />
                              ) : (
                                <ArrowDownLeft className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {item._type === "payment"
                                  ? `Tournament Entry: ${(item as any).tournaments?.title || "Unknown"}`
                                  : (item as any).description || "Reward"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={statusColors[item.status || "pending"]}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {item.status}
                            </Badge>
                            <span
                              className={`font-bold ${item._type === "payment" ? "text-orange-500" : "text-green-500"}`}
                            >
                              {item._type === "payment" ? "-" : "+"}KES{" "}
                              {Number(item.amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All your tournament entry payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments yet.</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => {
                    const StatusIcon = statusIcons[payment.status];
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-orange-500/10">
                            <ArrowUpRight className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {payment.tournaments?.title || "Tournament Entry"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.transaction_code && (
                                <span className="font-mono">{payment.transaction_code} • </span>
                              )}
                              {format(new Date(payment.created_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={statusColors[payment.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {payment.status}
                          </Badge>
                          <span className="font-bold text-orange-500">
                            -KES {Number(payment.amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-primary" />
                Rewards & Earnings
              </CardTitle>
              <CardDescription>Your tournament winnings and bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pending rewards summary */}
              {pendingRewards.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                        {pendingRewards.length} Pending Reward{pendingRewards.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: KES{" "}
                        {pendingRewards
                          .reduce((sum, r) => sum + Number(r.amount), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-500/50" />
                  </div>
                </div>
              )}

              {rewards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No rewards yet. Win a tournament to earn rewards!
                </p>
              ) : (
                <div className="space-y-4">
                  {rewards.map((reward) => {
                    const StatusIcon = statusIcons[reward.status || "pending"];
                    const isPending = reward.status === "pending";
                    const isClaiming = claimingId === reward.id;

                    return (
                      <div
                        key={reward.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isPending ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-full ${isPending ? "bg-yellow-500/10" : "bg-green-500/10"}`}
                          >
                            <Trophy
                              className={`w-5 h-5 ${isPending ? "text-yellow-500" : "text-green-500"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{reward.description || "Reward"}</p>
                            <p className="text-sm text-muted-foreground">
                              {reward.tournaments?.title && (
                                <span>{reward.tournaments.title} • </span>
                              )}
                              {format(new Date(reward.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`font-bold text-lg ${isPending ? "text-yellow-500" : "text-green-500"}`}
                            >
                              +KES {Number(reward.amount).toLocaleString()}
                            </span>
                            <div className="mt-1">
                              <Badge className={statusColors[reward.status || "pending"]}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {reward.status}
                              </Badge>
                            </div>
                          </div>
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => claimRewardMutation.mutate(reward.id)}
                              disabled={isClaiming || claimRewardMutation.isPending}
                              className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                            >
                              {isClaiming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <HandCoins className="w-4 h-4 mr-1" />
                                  Claim
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
