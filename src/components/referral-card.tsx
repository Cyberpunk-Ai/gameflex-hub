// @ts-nocheck
import { useState } from "react";
import { Copy, Check, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ReferralCard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralStats } = useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, successful: 0, pending: 0 };

      const { data } = await supabase.from("referrals").select("status").eq("referrer_id", user.id);

      const stats = {
        total: data?.length ?? 0,
        successful: data?.filter((r) => r.status === "completed").length ?? 0,
        pending: data?.filter((r) => r.status === "pending").length ?? 0,
      };

      return stats;
    },
    enabled: !!user,
  });

  const referralCode = profile?.referral_code || "Loading...";
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `/register?ref=${referralCode}`;

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Gift className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Invite Friends & Earn</h3>
          <p className="text-sm text-muted-foreground">
            Earn KES 150 + Milestone bonuses per verified gamer!
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Referral Code */}
        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Your Referral Code</div>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-lg">{referralCode}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(referralLink)}
              className="h-8"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-background/50 text-center">
            <div className="font-display font-bold text-xl">{referralStats?.total ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50 text-center">
            <div className="font-display font-bold text-xl text-green-400">
              {referralStats?.successful ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50 text-center">
            <div className="font-display font-bold text-xl text-yellow-400">
              {referralStats?.pending ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Share Button & Dashboard Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="neon" className="w-full" onClick={() => copyToClipboard(referralLink)}>
            <Users className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            className="w-full border-purple-500/40 hover:bg-purple-500/10 text-purple-300"
            onClick={() => (window.location.href = "/referrals")}
          >
            Open Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
