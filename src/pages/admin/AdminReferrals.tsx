// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Gift,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  Award,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function AdminReferrals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch all referrals with profile details for both referrer and referred user
  const {
    data: referrals = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      // Fetch referrals
      const { data: refData, error } = await supabase
        .from("referrals")
        .select("*")
        .limit(200)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!refData || refData.length === 0) return [];

      // Collect user IDs
      const userIds = new Set<string>();
      refData.forEach((r) => {
        if (r.referrer_id) userIds.add(r.referrer_id);
        if (r.referred_id) userIds.add(r.referred_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, email, referral_code")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      return refData.map((r) => ({
        ...r,
        referrer: profileMap.get(r.referrer_id) || {
          username: "Unknown User",
          referral_code: "N/A",
        },
        referred: profileMap.get(r.referred_id) || { username: "New User", email: "" },
      }));
    },
  });

  // Calculate statistics
  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter((r) => r.status === "completed").length;
  const pendingReferrals = referrals.filter((r) => r.status === "pending").length;
  const conversionRate =
    totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0;

  // Build Leaderboard of Top Referrers
  const referrerCounts = new Map<string, { profile: any; total: number; completed: number }>();
  referrals.forEach((r) => {
    if (!r.referrer_id) return;
    const current = referrerCounts.get(r.referrer_id) || {
      profile: r.referrer,
      total: 0,
      completed: 0,
    };
    current.total += 1;
    if (r.status === "completed") current.completed += 1;
    referrerCounts.set(r.referrer_id, current);
  });

  const topReferrers = Array.from(referrerCounts.values())
    .sort((a, b) => b.completed - a.completed || b.total - a.total)
    .slice(0, 5);

  // Filter referrals for the table
  const filteredReferrals = referrals.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;

    const refUsername = r.referrer?.username?.toLowerCase() || "";
    const refCode = r.referrer?.referral_code?.toLowerCase() || "";
    const refEmail = r.referrer?.email?.toLowerCase() || "";
    const newUsername = r.referred?.username?.toLowerCase() || "";
    const newEmail = r.referred?.email?.toLowerCase() || "";

    const matchesSearch =
      refUsername.includes(q) ||
      refCode.includes(q) ||
      refEmail.includes(q) ||
      newUsername.includes(q) ||
      newEmail.includes(q);

    return matchesStatus && matchesSearch;
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("referrals").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Referral status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update referral status");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("referrals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Referral deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete referral");
    },
  });

  // Bonus reward mutation
  const rewardMutation = useMutation({
    mutationFn: async ({ id, referrerId }: { id: string; referrerId: string }) => {
      // Update bonus_claimed flag
      const { error: refErr } = await supabase
        .from("referrals")
        .update({ bonus_claimed: true, status: "completed" })
        .eq("id", id);
      if (refErr) throw refErr;

      // Add a reward transaction log if rewards table exists
      try {
        await supabase.from("rewards").insert({
          user_id: referrerId,
          type: "referral",
          title: "Referral Bonus",
          coins: 100,
          description: "Bonus awarded for referring a new member to GameFlex",
        });
      } catch {
        // ignore reward log failure if schema differs
      }
    },
    onSuccess: () => {
      toast.success("Referral bonus awarded successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to award bonus");
    },
  });

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Referral code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Referrals & Signups Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Track user invitations, monitor referral code performance, and award bonuses.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="self-start md:self-auto flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Referrals
              </p>
              <h3 className="text-2xl font-bold font-display mt-1">{totalReferrals}</h3>
              <p className="text-xs text-muted-foreground mt-1">All time invited signups</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Completed Signups
              </p>
              <h3 className="text-2xl font-bold font-display text-emerald-500 mt-1">
                {completedReferrals}
              </h3>
              <p className="text-xs text-emerald-500/80 mt-1">{conversionRate}% conversion rate</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Pending Verification
              </p>
              <h3 className="text-2xl font-bold font-display text-amber-500 mt-1">
                {pendingReferrals}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Awaiting status update</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Top Referrer
              </p>
              <h3 className="text-lg font-bold font-display truncate max-w-[130px] mt-1">
                {topReferrers[0]?.profile?.username || "None yet"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {topReferrers[0] ? `${topReferrers[0].completed} successful` : "No referrals"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers Leaderboard */}
      {topReferrers.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 font-display">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Referral Champions
            </CardTitle>
            <CardDescription>
              Users with the highest number of invited member signups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topReferrers.map((item, idx) => (
                <div
                  key={item.profile?.user_id || idx}
                  className="p-4 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center text-center relative"
                >
                  <div className="absolute top-2 left-2 text-xs font-bold font-mono text-muted-foreground">
                    #{idx + 1}
                  </div>
                  <Avatar className="h-12 w-12 mb-2 border-2 border-primary/20">
                    <AvatarImage src={item.profile?.avatar_url} />
                    <AvatarFallback className="font-bold bg-primary/10 text-primary">
                      {item.profile?.username?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-sm truncate max-w-[130px]">
                    {item.profile?.username || "User"}
                  </h4>
                  <span className="font-mono text-xs text-primary font-bold my-1 bg-primary/10 px-2 py-0.5 rounded">
                    {item.profile?.referral_code || "CODE"}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-bold text-foreground">{item.completed}</span> successful (
                    {item.total} total)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referrals Log Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Referral Records & Signups
              </CardTitle>
              <CardDescription>
                Detailed audit list of all user referrals and code usages.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/40 text-xs">
                {(["all", "completed", "pending"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                      statusFilter === f
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search code, referrer, referred..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading referrals data...
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-foreground">No referral records found</p>
              <p className="text-xs mt-1">
                {search || statusFilter !== "all"
                  ? "Try broadening your search or filter"
                  : "Referrals will automatically appear here when users invite friends."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left min-w-[750px]">
                <thead className="text-xs uppercase bg-muted/40 border-y border-border/50 text-muted-foreground font-semibold sticky top-0 z-10 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">Referrer</th>
                    <th className="px-4 py-3">Code Used</th>
                    <th className="px-4 py-3">Referred User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Bonus Claimed</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredReferrals.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      {/* Referrer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.referrer?.avatar_url} />
                            <AvatarFallback className="text-xs font-bold">
                              {item.referrer?.username?.slice(0, 2).toUpperCase() || "R"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground truncate max-w-[140px]">
                              {item.referrer?.username || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {item.referrer?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code Used */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => copyCode(item.referrer?.referral_code || "", item.id)}
                          className="font-mono text-xs font-bold bg-muted/60 border border-border/50 px-2.5 py-1 rounded inline-flex items-center gap-1.5 hover:bg-muted transition-colors"
                        >
                          {item.referrer?.referral_code || "N/A"}
                          {copiedId === item.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-60" />
                          )}
                        </button>
                      </td>

                      {/* Referred User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.referred?.avatar_url} />
                            <AvatarFallback className="text-xs font-bold bg-secondary">
                              {item.referred?.username?.slice(0, 2).toUpperCase() || "N"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground truncate max-w-[140px]">
                              {item.referred?.username || "New Member"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {item.referred?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "completed"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-semibold"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold"
                          }
                        >
                          {item.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {item.status}
                        </Badge>
                      </td>

                      {/* Bonus Status */}
                      <td className="px-4 py-3.5">
                        {item.bonus_claimed ? (
                          <Badge
                            variant="secondary"
                            className="bg-purple-500/10 text-purple-400 border-purple-500/20"
                          >
                            100 Coins Awarded
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unclaimed</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!item.bonus_claimed && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                              onClick={() =>
                                rewardMutation.mutate({ id: item.id, referrerId: item.referrer_id })
                              }
                              disabled={rewardMutation.isPending}
                              title="Award 100 Referral Bonus Coins to Referrer"
                            >
                              <Gift className="h-3.5 w-3.5 mr-1" />
                              Bonus
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: item.id,
                                newStatus: item.status === "completed" ? "pending" : "completed",
                              })
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            Toggle Status
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm("Delete this referral record?")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            title="Delete Referral"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
