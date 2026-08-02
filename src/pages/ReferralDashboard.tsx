// @ts-nocheck
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getGamerAvatar } from "@/constants/avatars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  Clock,
  Wallet,
  CheckCircle2,
  MessageSquare,
  Twitter,
  Send,
} from "lucide-react";

export default function ReferralDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch referrals for current user
  const { data: userReferrals = [], isLoading } = useQuery({
    queryKey: ["user-referrals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: refData, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching user referrals:", error.message);
        return [];
      }

      if (!refData || refData.length === 0) return [];

      const referredIds = refData.map((r) => r.referred_id).filter(Boolean);
      let profileMap = new Map();

      if (referredIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, created_at, game_handle")
          .in("user_id", referredIds);

        profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      }

      return refData.map((r) => ({
        ...r,
        referredProfile: profileMap.get(r.referred_id) || {
          username: `Gamer_${r.referred_id?.slice(0, 5) || "User"}`,
          avatar_url: null,
        },
      }));
    },
    enabled: !!user,
  });

  // Calculate statistics
  const totalInvited = userReferrals.length;
  const verifiedCount = userReferrals.filter((r) => r.status === "completed").length;
  const pendingCount = userReferrals.filter((r) => r.status === "pending").length;
  const totalEarnedKES = verifiedCount * 150; // KES 150 per completed referral

  const code =
    profile?.referral_code || (user?.email ? user.email.split("@")[0].toUpperCase() : "GAMEFLEX");
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://gameflex.esports";
  const referralLink = `${baseUrl}/register?ref=${code}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast({ title: "Referral Code Copied!", description: `Code ${code} saved to clipboard.` });
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast({ title: "Referral Link Copied!", description: "Share link saved to clipboard." });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const shareText = `🎮 Join me on GameFlex Esports! Compete in FIFA, Mobile Legends, and Call of Duty tournaments to win cash prizes. Use my referral code ${code}: ${referralLink}`;

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`🎮 Join GameFlex Esports with my code ${code}!`)}`,
      "_blank",
    );
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join GameFlex Esports",
          text: shareText,
          url: referralLink,
        });
      } catch (e) {
        console.log("Share canceled");
      }
    } else {
      copyLink();
    }
  };

  const filteredReferrals = userReferrals.filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = r.referredProfile?.username?.toLowerCase() || "";
    const handle = r.referredProfile?.game_handle?.toLowerCase() || "";
    return name.includes(q) || handle.includes(q);
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* ── Top Hero Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background py-10 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />

        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Refer & Earn
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-foreground">
                Referral <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-1 max-w-xl text-sm sm:text-base">
                Invite gamer friends to GameFlex. Earn{" "}
                <span className="text-primary font-semibold">KES 150</span> for every verified
                player added to your wallet!
              </p>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-card/90 border border-primary/20 rounded-2xl p-5 shadow-sm flex items-center gap-4 min-w-[260px]">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-medium">
                  Total Referral Earnings
                </div>
                <div className="text-2xl font-display font-bold text-primary">
                  KES {totalEarnedKES.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-primary" /> {verifiedCount} verified
                  referrals
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* ── Referral Link & Sharing Section ───────────────── */}
        <Card className="bg-card border-border/60 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-accent" />
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" /> Share Your Invite Link & Code
            </CardTitle>
            <CardDescription>
              Send your link or code to friends. When they register and participate, KES 150 is
              credited directly to you!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Your Referral Code
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={code}
                      className="font-mono font-bold text-lg bg-secondary/60 text-primary tracking-wider text-center pr-10 border-primary/30"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={copyCode}
                    className="border-primary/40 hover:bg-primary/10 text-primary gap-1.5 shrink-0"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedCode ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Unique Referral Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={referralLink}
                    className="text-xs bg-secondary/60 text-foreground truncate border-border/60"
                  />
                  <Button variant="default" onClick={copyLink} className="gap-1.5 shrink-0">
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Social Share Row */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                1-Tap Instant Share
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  onClick={shareWhatsApp}
                  className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 gap-2 font-medium"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp
                </Button>
                <Button
                  onClick={shareTelegram}
                  className="bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/40 gap-2 font-medium"
                >
                  <Send className="w-4 h-4" /> Telegram
                </Button>
                <Button
                  onClick={shareTwitter}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 gap-2 font-medium"
                >
                  <Twitter className="w-4 h-4" /> Twitter / X
                </Button>
                <Button
                  onClick={shareNative}
                  variant="outline"
                  className="gap-2 font-medium border-border/80"
                >
                  <Share2 className="w-4 h-4 text-primary" /> More...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 4 Stats Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/70 border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{totalInvited}</div>
                <div className="text-xs text-muted-foreground font-medium">Total Invited</div>
              </div>
            </div>
          </Card>

          <Card className="bg-card/70 border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-primary">{verifiedCount}</div>
                <div className="text-xs text-muted-foreground font-medium">Verified Players</div>
              </div>
            </div>
          </Card>

          <Card className="bg-card/70 border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-amber-400">{pendingCount}</div>
                <div className="text-xs text-muted-foreground font-medium">Pending Signup</div>
              </div>
            </div>
          </Card>

          <Card className="bg-card/70 border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-purple-400">
                  KES {totalEarnedKES.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Total Earnings</div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Referred Gamers Table ──────────────────────────────── */}
        <Card className="bg-card border-border/60 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Referred Gamers
              </CardTitle>
              <CardDescription>
                Track status and earnings for players who registered using your link or code.
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search gamers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary/60 border-border/60 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Loading your referral list...
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-secondary mx-auto flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="font-semibold text-foreground">No referrals found</div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? "No matching gamers found for your search query."
                    : "Share your link above to start inviting players and earning KES 150 per referral."}
                </p>
                {!searchQuery && (
                  <Button variant="default" size="sm" onClick={copyLink} className="gap-2">
                    <Copy className="w-4 h-4" /> Copy Referral Link
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-secondary/40 text-muted-foreground border-y border-border/50 uppercase tracking-wider font-semibold sticky top-0 z-10 backdrop-blur">
                    <tr>
                      <th className="py-3 px-4">Gamer</th>
                      <th className="py-3 px-4">Game Handle</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Reward Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredReferrals.map((item) => {
                      const profile = item.referredProfile;
                      const avatarSrc = profile.avatar_url || getGamerAvatar(profile.username);
                      const isCompleted = item.status === "completed";

                      return (
                        <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4 font-medium flex items-center gap-2.5">
                            <img
                              src={avatarSrc}
                              alt={profile.username}
                              loading="lazy"
                              decoding="async"
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover border border-border"
                              referrerPolicy="no-referrer"
                            />

                            <span className="font-bold text-foreground">{profile.username}</span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {profile.game_handle || "@gamer"}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                isCompleted
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }
                            >
                              {isCompleted ? "✓ Verified" : "⏳ Pending"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold text-primary">
                            {isCompleted ? "+ KES 150" : "KES 0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── How It Works 3-Step Guide ────────────────────────── */}
        <Card className="bg-card/70 border-border/50 p-6">
          <h3 className="font-display font-bold text-lg mb-4 text-center">
            How GameFlex Referral Program Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary font-display font-bold text-xl flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-semibold text-foreground">Share Your Link</h4>
              <p className="text-xs text-muted-foreground">
                Copy your custom link or code and share it with friends via WhatsApp, social media,
                or gaming groups.
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary font-display font-bold text-xl flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-semibold text-foreground">Friends Join & Compete</h4>
              <p className="text-xs text-muted-foreground">
                Your friend registers on GameFlex and joins their first match or tournament game
                room.
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary font-display font-bold text-xl flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-semibold text-foreground">Earn Cash Rewards</h4>
              <p className="text-xs text-muted-foreground">
                Receive KES 150 per friend directly into your GameFlex Wallet!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
