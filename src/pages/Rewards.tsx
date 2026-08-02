// @ts-nocheck
import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Trophy, Users, Star, Clock, CheckCircle, Loader2, Zap } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const rewardIcons: Record<string, React.ReactNode> = {
  prize: <Trophy className="w-6 h-6 text-yellow-500" />,
  bonus: <Gift className="w-6 h-6 text-green-500" />,
  referral: <Users className="w-6 h-6 text-blue-500" />,
  achievement: <Star className="w-6 h-6 text-purple-500" />,
};

const rewardColors: Record<string, string> = {
  prize: "border-yellow-500/30 bg-yellow-500/5",
  bonus: "border-green-500/30 bg-green-500/5",
  referral: "border-blue-500/30 bg-blue-500/5",
  achievement: "border-purple-500/30 bg-purple-500/5",
};

const Rewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("rewards")
        .select("*, tournaments(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Real-time subscription for rewards updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("rewards-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rewards",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["rewards", user.id] });

          if (payload.eventType === "INSERT") {
            toast({
              title: "🎉 New Reward!",
              description: "You have received a new reward! Check it out.",
            });
          } else if (payload.eventType === "UPDATE") {
            toast({
              title: "💰 Reward Updated",
              description: "Your reward status has been updated.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast]);

  const claimMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from("rewards")
        .update({ status: "claimed", claimed_at: new Date().toISOString() })
        .eq("id", rewardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: "Reward Claimed!",
        description: "Your reward will be processed shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingRewards = rewards?.filter((r: any) => r.status === "pending") || [];
  const claimedRewards = rewards?.filter((r: any) => r.status === "claimed") || [];
  const totalEarnings =
    rewards?.reduce(
      (sum: number, r: any) => (r.status === "claimed" ? sum + Number(r.amount) : sum),
      0,
    ) || 0;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Please log in to view rewards.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold font-display">Rewards</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Your earnings and prizes
                <Badge variant="outline" className="ml-2 text-xs gap-1">
                  <Zap className="h-3 w-3 text-green-500" />
                  Live Updates
                </Badge>
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">KES {totalEarnings}</p>
              <p className="text-sm text-muted-foreground">Total Claimed</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-yellow-500">{pendingRewards.length}</p>
              <p className="text-sm text-muted-foreground">Pending Rewards</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-500">{claimedRewards.length}</p>
              <p className="text-sm text-muted-foreground">Claimed Rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Rewards */}
        {pendingRewards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Rewards
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRewards.map((reward: any) => (
                <Card key={reward.id} className={`border ${rewardColors[reward.type]}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {rewardIcons[reward.type]}
                        <div>
                          <CardTitle className="text-lg capitalize">{reward.type} Reward</CardTitle>
                          <CardDescription>
                            {reward.tournaments?.title || reward.description || "Bonus reward"}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">KES {reward.amount}</p>
                        {reward.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Expires{" "}
                            {formatDistanceToNow(new Date(reward.expires_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => claimMutation.mutate(reward.id)}
                        disabled={claimMutation.isPending}
                      >
                        {claimMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Claim"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Claimed Rewards */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Claimed Rewards
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : claimedRewards.length > 0 ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {claimedRewards.map((reward: any) => (
                    <div key={reward.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {rewardIcons[reward.type]}
                        <div>
                          <p className="font-medium capitalize">{reward.type} Reward</p>
                          <p className="text-sm text-muted-foreground">
                            {reward.tournaments?.title || reward.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">KES {reward.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          Claimed{" "}
                          {reward.claimed_at && format(new Date(reward.claimed_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No claimed rewards yet. Win tournaments to earn prizes!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
