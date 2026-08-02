// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Gift,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Loader2,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  claimed: "bg-green-500/10 text-green-500 border-green-500/20",
  expired: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  claimed: CheckCircle2,
  expired: XCircle,
};

const rewardTypes = ["prize", "bonus", "referral", "achievement"] as const;

export default function AdminRewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newReward, setNewReward] = useState({
    type: "bonus" as (typeof rewardTypes)[number],
    amount: "",
    description: "",
  });

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["admin-rewards", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("rewards")
        .select("*, tournaments(title)")
        .limit(200)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data } = await query;

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((r) => ({
        ...r,
        profiles: profileMap.get(r.user_id),
      }));
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-for-rewards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, email")
        .limit(200)
        .order("username");
      return data || [];
    },
  });

  const approveRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward) throw new Error("Reward not found");

      // Update reward status
      const { error: rewardError } = await supabase
        .from("rewards")
        .update({
          status: "claimed",
          claimed_at: new Date().toISOString(),
        })
        .eq("id", rewardId);

      if (rewardError) throw rewardError;

      // Update user's wallet balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", reward.user_id)
        .single();

      const newBalance = (profile?.wallet_balance || 0) + Number(reward.amount);

      const { error: walletError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("user_id", reward.user_id);

      if (walletError) throw walletError;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: reward.user_id,
        type: "payment",
        title: "Reward Claimed! 🎉",
        message: `KES ${Number(reward.amount).toLocaleString()} has been added to your wallet.`,
        action_url: "/wallet",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      toast({ title: "Reward approved", description: "Funds added to user wallet" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createRewardMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !newReward.amount) throw new Error("Missing fields");

      const { error } = await supabase.from("rewards").insert({
        user_id: selectedUserId,
        type: newReward.type,
        amount: Number(newReward.amount),
        description: newReward.description || `Manual ${newReward.type} reward`,
        status: "pending",
      });

      if (error) throw error;

      // Notify user
      await supabase.from("notifications").insert({
        user_id: selectedUserId,
        type: "payment",
        title: "New Reward! 🎁",
        message: `You've received a ${newReward.type} reward of KES ${Number(newReward.amount).toLocaleString()}`,
        action_url: "/rewards",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      setShowCreateDialog(false);
      setNewReward({ type: "bonus", amount: "", description: "" });
      setSelectedUserId("");
      toast({ title: "Reward created", description: "User has been notified" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredRewards = rewards.filter((r) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      r.profiles?.username?.toLowerCase().includes(search) ||
      r.description?.toLowerCase().includes(search) ||
      r.type?.toLowerCase().includes(search)
    );
  });

  const stats = {
    pending: rewards.filter((r) => r.status === "pending").length,
    pendingAmount: rewards
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.amount), 0),
    claimed: rewards.filter((r) => r.status === "claimed").length,
    claimedAmount: rewards
      .filter((r) => r.status === "claimed")
      .reduce((sum, r) => sum + Number(r.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Rewards Management</h1>
          <p className="text-muted-foreground">Manage prizes, bonuses, and user rewards</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
              <DialogDescription>Manually create a reward for a user</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newReward.type}
                  onValueChange={(v: (typeof rewardTypes)[number]) =>
                    setNewReward({ ...newReward, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={newReward.amount}
                  onChange={(e) => setNewReward({ ...newReward, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Reason for reward..."
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createRewardMutation.mutate()}
                disabled={createRewardMutation.isPending || !selectedUserId || !newReward.amount}
              >
                {createRewardMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Reward
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Pending Rewards</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              KES {stats.pendingAmount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Claimed Rewards</CardDescription>
            <CardTitle className="text-2xl text-green-500">{stats.claimed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              KES {stats.claimedAmount.toLocaleString()} distributed
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Total Rewards</CardDescription>
            <CardTitle className="text-2xl text-primary">{rewards.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Trophy className="w-6 h-6 text-primary/50" />
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-2xl text-blue-500">
              KES {(stats.pendingAmount + stats.claimedAmount).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DollarSign className="w-6 h-6 text-blue-500/50" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by username, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rewards List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Rewards</CardTitle>
          <CardDescription>View and manage user rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rewards found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredRewards.map((reward) => {
                const StatusIcon = statusIcons[reward.status || "pending"];
                return (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          reward.type === "prize"
                            ? "bg-yellow-500/10"
                            : reward.type === "bonus"
                              ? "bg-blue-500/10"
                              : reward.type === "referral"
                                ? "bg-purple-500/10"
                                : "bg-green-500/10"
                        }`}
                      >
                        {reward.type === "prize" ? (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        ) : reward.type === "bonus" ? (
                          <Gift className="w-5 h-5 text-blue-500" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{reward.profiles?.username || "Unknown User"}</p>
                        <p className="text-sm text-muted-foreground">
                          {reward.description || `${reward.type} reward`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(reward.created_at), { addSuffix: true })}
                          {reward.tournaments?.title && ` • ${reward.tournaments.title}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-500">
                          +KES {Number(reward.amount).toLocaleString()}
                        </p>
                        <Badge className={statusColors[reward.status || "pending"]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {reward.status}
                        </Badge>
                      </div>
                      {reward.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => approveRewardMutation.mutate(reward.id)}
                          disabled={approveRewardMutation.isPending}
                        >
                          {approveRewardMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve & Pay
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
    </div>
  );
}
