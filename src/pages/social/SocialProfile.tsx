import { useAuth } from "@/lib/auth-context";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SocialLayout } from "@/components/social/social-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGamerAvatar } from "@/constants/avatars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/social/follow-button";
import { SquadSuggestions } from "@/components/social/squad-suggestions";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import Achievements from "@/pages/Achievements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Grid3x3,
  Film,
  Bookmark,
  Settings,
  Play,
  MoreVertical,
  QrCode,
  Heart,
  MessageCircle,
  Camera,
  Plus,
  Bell,
  Trophy,
  Share2,
  Gamepad2,
  BadgeCheck,
  LayoutGrid,
  Square,
  Loader2,
  Coins,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { STORAGE_BUCKETS } from "@/integrations/supabase/storage-setup";
import { formatDistanceToNow } from "date-fns";

export default function SocialProfile() {
  const { user, profile, updateProfile, refreshProfile, isLoading: authLoading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"posts" | "reels" | "saved" | "achievements">("posts");
  const [viewMode, setViewMode] = useState<"grid" | "cards">("grid");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [likedPostsMap, setLikedPostsMap] = useState<Record<string, boolean>>({});
  const [inlineComments, setInlineComments] = useState<Record<string, string>>({});

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      nav(`/login?returnTo=${encodeURIComponent("/social/profile")}`, { replace: true });
    }
  }, [authLoading, user, nav]);


  // Fetch My Posts
  const { data: myPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts", user?.id],
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_statuses")
        .select("id, user_id, media_url, media_type, likes_count, comments_count, content, created_at, expires_at")
        .eq("user_id", user!.id)
        .is("expires_at", null)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch Saved Posts
  const { data: savedPosts = [] } = useQuery({
    queryKey: ["saved-posts", user?.id],
    enabled: !!user && tab === "saved",
    queryFn: async () => {
      const { data: saves } = await (supabase as any)
        .from("status_saves")
        .select("status_id")
        .eq("user_id", user!.id);
      if (!saves?.length) return [];
      const ids = (saves as { status_id: string }[]).map((s) => s.status_id);
      const { data: savedData } = await supabase
        .from("user_statuses")
        .select("id, user_id, media_url, media_type, likes_count, comments_count, content, created_at")
        .in("id", ids);
      return savedData ?? [];
    },
  });

  // Fetch Counts (Followers, Following, Posts)
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["profile-counts", user?.id],
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      const [followers, following, statuses] = await Promise.all([
        supabase
          .from("user_follows")
          .select("follower_id", { count: "exact", head: true })
          .eq("following_id", user!.id),
        supabase
          .from("user_follows")
          .select("following_id", { count: "exact", head: true })
          .eq("follower_id", user!.id),
        supabase
          .from("user_statuses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id),
      ]);
      return {
        followers: followers.count ?? 0,
        following: following.count ?? 0,
        posts: statuses.count ?? 0,
      };
    },
  });

  // Fetch Followers details for dialog
  const { data: followersList = [], isLoading: followersLoading } = useQuery({
    queryKey: ["followers-list", user?.id],
    enabled: !!user && followersModalOpen,
    queryFn: async () => {
      const { data: follows } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", user!.id);
      if (!follows?.length) {
        const { data: fallback } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user!.id)
          .limit(5);
        return fallback ?? [];
      }
      const ids = follows.map((f) => f.follower_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      return profiles ?? [];
    },
  });

  // Fetch Following details for dialog
  const { data: followingList = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following-list", user?.id],
    enabled: !!user && followingModalOpen,
    queryFn: async () => {
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      if (!follows?.length) {
        const { data: fallback } = await supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user!.id)
          .limit(5);
        return fallback ?? [];
      }
      const ids = follows.map((f) => f.following_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      return profiles ?? [];
    },
  });

  // Fetch Comments for Selected Post Modal
  const { data: postComments = [], refetch: refetchComments } = useQuery({
    queryKey: ["post-comments", selectedPost?.id],
    enabled: !!selectedPost?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("status_comments")
        .select("*, profiles(*)")
        .eq("status_id", selectedPost!.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // Fetch Active Stories
  const { data: myStories = [] } = useQuery({
    queryKey: ["my-stories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_statuses")
        .select("*")
        .eq("user_id", user!.id)
        .not("expires_at", "is", null)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (authLoading || !user) return null;

  const handleShareProfile = async () => {
    try {
      await navigator.share({ title: profile?.username ?? "GameFlex", url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Profile link copied to clipboard!" });
    }
  };

  const handleCopyProfileLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Profile link copied to clipboard!" });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please pick an image for your profile avatar.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Avatar image size is limited to 5MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const rawExt = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar_${Date.now()}.${rawExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(filePath, file, { upsert: true, cacheControl: "0" });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKETS.AVATARS).getPublicUrl(filePath);
      const updatedUrl = `${publicUrl}?v=${Date.now()}`;
      await updateProfile({ avatar_url: updatedUrl });
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Avatar updated!", description: "Your profile picture is updated across GameFlex." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    const currentlyLiked = likedPostsMap[postId];
    setLikedPostsMap((prev) => ({ ...prev, [postId]: !currentlyLiked }));

    queryClient.setQueryData(["my-posts", user.id], (old: any[] | undefined) => {
      if (!old) return [];
      return old.map((p) =>
        p.id === postId
          ? { ...p, likes_count: (p.likes_count || 0) + (currentlyLiked ? -1 : 1) }
          : p,
      );
    });

    try {
      if (currentlyLiked) {
        await supabase.from("status_likes").delete().eq("status_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("status_likes").insert({ status_id: postId, user_id: user.id } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddModalComment = async () => {
    if (!newCommentText.trim() || !selectedPost || !user) return;
    try {
      const text = newCommentText.trim();
      setNewCommentText("");
      const { error } = await supabase.from("status_comments").insert({
        status_id: selectedPost.id,
        user_id: user.id,
        content: text,
      } as any);
      if (error) throw error;

      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["my-posts", user.id] });
      toast({ title: "Comment posted" });
    } catch (err: any) {
      toast({ title: "Failed to post comment", description: err.message, variant: "destructive" });
    }
  };

  const handleAddInlineComment = async (postId: string) => {
    const text = inlineComments[postId]?.trim();
    if (!text || !user) return;

    setInlineComments((prev) => ({ ...prev, [postId]: "" }));
    try {
      const { error } = await supabase.from("status_comments").insert({
        status_id: postId,
        user_id: user.id,
        content: text,
      } as any);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["my-posts", user.id] });
      toast({ title: "Comment added" });
    } catch (err: any) {
      toast({ title: "Failed to comment", description: err.message, variant: "destructive" });
    }
  };

  const filteredPosts =
    tab === "reels"
      ? myPosts.filter((p: any) => p.media_type === "video")
      : tab === "saved"
        ? savedPosts
        : myPosts.filter((p: any) => p.media_type !== "video");

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <SocialLayout>
      <motion.div
        className="px-0 md:px-4 max-w-4xl mx-auto pb-12"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        {/* Hidden Avatar File Input */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        {/* Mobile Header Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-md z-30">
          <div className="font-semibold text-lg flex items-center gap-1.5">
            <span>{profile?.username ?? "profile"}</span>
            {profile?.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu options">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border/50 shadow-xl">
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTab("achievements")}>
                  <Trophy className="h-4 w-4 mr-2" /> Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTab("saved")}>
                  <Bookmark className="h-4 w-4 mr-2" /> Saved posts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyProfileLink}>
                  <QrCode className="h-4 w-4 mr-2" /> Share profile link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Header Section: Instagram / GameFlex Style Profile Header */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 mb-8 px-4 md:px-0 pt-6 md:pt-4"
        >
          {/* Avatar with dynamic ring & upload trigger */}
          <div className="flex w-full md:w-auto items-center gap-6 justify-between md:justify-start">
            <div className="relative group shrink-0">
              <div
                className="p-[3px] rounded-full bg-gradient-to-tr from-primary via-emerald-400 to-yellow-400 shadow-neon-sm"
              >
                <Avatar className="h-24 w-24 md:h-36 md:w-36 border-4 border-background object-cover">
                  <AvatarImage
                    src={profile?.avatar_url || getGamerAvatar(profile?.username)}
                    alt={profile?.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-3xl font-display font-bold bg-secondary text-foreground">
                    {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Upload trigger overlay button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change profile photo"
                className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background hover:scale-105 active:scale-95 transition-all disabled:opacity-50 z-10"
                title="Update avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Mobile Stats (Beside Avatar) */}
            <div className="flex md:hidden flex-1 justify-around text-center pl-2">
              <button
                onClick={() => setTab("posts")}
                className="flex flex-col items-center active:scale-95 transition-transform"
              >
                <span className="font-display font-bold text-lg">{countsLoading ? "-" : counts?.posts}</span>
                <span className="text-xs text-muted-foreground">posts</span>
              </button>
              <button
                onClick={() => setFollowersModalOpen(true)}
                className="flex flex-col items-center active:scale-95 transition-transform"
              >
                <span className="font-display font-bold text-lg">{countsLoading ? "-" : counts?.followers}</span>
                <span className="text-xs text-muted-foreground">followers</span>
              </button>
              <button
                onClick={() => setFollowingModalOpen(true)}
                className="flex flex-col items-center active:scale-95 transition-transform"
              >
                <span className="font-display font-bold text-lg">{countsLoading ? "-" : counts?.following}</span>
                <span className="text-xs text-muted-foreground">following</span>
              </button>
            </div>
          </div>

          {/* Profile Details & Actions */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-display truncate">
                  {profile?.username ?? "user"}
                </h1>
                {profile?.is_verified && (
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" aria-label="Verified Gamer" />
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 md:flex-none font-semibold shadow-sm h-9 rounded-xl"
                  onClick={() => setEditProfileOpen(true)}
                >
                  Edit profile
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 md:flex-none font-semibold shadow-sm h-9 rounded-xl"
                  onClick={handleShareProfile}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Share profile
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 rounded-xl" asChild>
                  <Link to="/settings" aria-label="Settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Desktop Stats Row */}
            <div className="hidden md:flex gap-8 mb-4 text-sm font-medium">
              <button
                onClick={() => setTab("posts")}
                className="hover:opacity-80 transition-opacity text-left"
              >
                <span className="font-bold text-foreground font-display text-base mr-1">
                  {countsLoading ? "-" : counts?.posts}
                </span>{" "}
                <span className="text-muted-foreground">posts</span>
              </button>

              <button
                onClick={() => setFollowersModalOpen(true)}
                className="hover:opacity-80 transition-opacity text-left"
              >
                <span className="font-bold text-foreground font-display text-base mr-1">
                  {countsLoading ? "-" : counts?.followers}
                </span>{" "}
                <span className="text-muted-foreground">followers</span>
              </button>

              <button
                onClick={() => setFollowingModalOpen(true)}
                className="hover:opacity-80 transition-opacity text-left"
              >
                <span className="font-bold text-foreground font-display text-base mr-1">
                  {countsLoading ? "-" : counts?.following}
                </span>{" "}
                <span className="text-muted-foreground">following</span>
              </button>
            </div>

            {/* Gamer Bio & Game Tags */}
            <div className="text-sm space-y-2">
              <div className="font-bold font-display text-base">
                {(profile as any)?.full_name ?? profile?.username}
              </div>

              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed max-w-lg">
                {(profile as any)?.bio ?? "GameFlex Pro Gamer 🎮 | Competitor | Sharing highlights & flex clips"}
              </p>

              {/* Game Handle Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {profile?.game_handle && (
                  <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg font-medium text-xs bg-secondary/80">
                    <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                    {profile.game_handle}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg font-medium text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Coins className="h-3.5 w-3.5" />
                  KES {(profile?.wallet_balance ?? 0).toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Story Highlights Strip */}
        <motion.div
          variants={itemVariants}
          className="flex gap-4 px-4 md:px-0 mb-6 overflow-x-auto scrollbar-hide pb-2 border-b border-border/40"
        >
          <Link
            to="/stories/new"
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="h-16 w-16 md:h-18 md:w-18 rounded-full border border-dashed border-primary/60 bg-primary/10 flex items-center justify-center group-hover:border-primary transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="text-[11px] md:text-xs font-medium">New Story</span>
          </Link>

          {myStories.map((story: any, i: number) => (
            <Link
              key={story.id}
              to="/stories"
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="h-16 w-16 md:h-18 md:w-18 rounded-full p-0.5 bg-gradient-to-tr from-primary via-emerald-400 to-yellow-400">
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-secondary">
                  {story.media_url ? (
                    story.media_type === "video" ? (
                      <video src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={optimizeImageUrl(story.media_url, { width: 200, quality: 75 })}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        alt="Story"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold">
                      TEXT
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] md:text-xs font-medium">Highlight {i + 1}</span>
            </Link>
          ))}
        </motion.div>

        {/* Profile Tabs Bar */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between border-b border-border/60 mb-6"
        >
          <div className="flex items-center gap-6 md:gap-12">
            {[
              { id: "posts" as const, label: "POSTS", icon: Grid3x3 },
              { id: "reels" as const, label: "FLEXES", icon: Film },
              { id: "saved" as const, label: "SAVED", icon: Bookmark },
              { id: "achievements" as const, label: "ACHIEVEMENTS", icon: Trophy },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors relative",
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground/80",
                )}
              >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Posts Layout View Toggle (Grid vs Cards View) */}
          {(tab === "posts" || tab === "reels") && (
            <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-lg border border-border/50">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "cards" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Container Cards View"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* ACHIEVEMENTS TAB */}
        {tab === "achievements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Achievements />
          </motion.div>
        )}

        {/* POSTS, FLEXES & SAVED */}
        {tab !== "achievements" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {postsLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-none md:rounded-lg" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl mx-4 md:mx-0 p-8">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  {tab === "posts" && <Camera className="h-8 w-8 text-muted-foreground" />}
                  {tab === "reels" && <Film className="h-8 w-8 text-muted-foreground" />}
                  {tab === "saved" && <Bookmark className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="font-display font-bold text-lg mb-1">
                  {tab === "posts" && "No Posts Yet"}
                  {tab === "reels" && "No Flex Clips Yet"}
                  {tab === "saved" && "No Saved Items"}
                </h3>
                <p className="text-muted-foreground text-xs max-w-xs mx-auto mb-4">
                  {tab === "posts" && "Share your gaming highlights and photos to showcase them here."}
                  {tab === "reels" && "Upload short video clips to build your personal gaming flex reel."}
                  {tab === "saved" && "Bookmarked photos and clips will appear in your saved collection."}
                </p>
                {tab === "posts" && (
                  <Button size="sm" asChild>
                    <Link to="/create">Create Your First Post</Link>
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* Instagram 3x3 Photo Matrix View */
              <div className="grid grid-cols-3 gap-0.5 md:gap-2">
                {filteredPosts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPost(p)}
                    className="relative aspect-square bg-secondary group overflow-hidden md:rounded-lg block text-left"
                  >
                    {p.media_type === "video" ? (
                      <>
                        <video
                          src={p.media_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <Play className="absolute top-2 right-2 h-4 w-4 text-white drop-shadow-md z-10" />
                      </>
                    ) : p.media_url ? (
                      <img
                        src={optimizeImageUrl(p.media_url, { width: 400, quality: 75 })}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center p-3 text-center"
                        style={{
                          background: "linear-gradient(135deg, hsl(142 76% 45%) 0%, hsl(200 100% 50%) 100%)",
                        }}
                      >
                        <span className="font-display font-bold text-xs text-white line-clamp-3">
                          {p.content}
                        </span>
                      </div>
                    )}

                    {/* Instagram Hover Stats Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 backdrop-blur-[2px] z-20">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Heart className="h-5 w-5 fill-white text-white" />
                        <span>{p.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <MessageCircle className="h-5 w-5 fill-white text-white" />
                        <span>{p.comments_count || 0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Instagram Feed Container Cards View */
              <div className="space-y-4 max-w-2xl mx-auto px-4 md:px-0">
                {filteredPosts.map((p: any) => {
                  const isLiked = likedPostsMap[p.id];
                  return (
                    <Card key={p.id} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
                      {/* Card Header */}
                      <div className="flex items-center justify-between p-3.5 border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/30">
                            <AvatarImage src={profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="font-bold bg-secondary">
                              {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-sm flex items-center gap-1">
                              <span>{profile?.username}</span>
                              {profile?.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {p.created_at
                                ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true })
                                : "recently"}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Card Media */}
                      {p.media_type === "video" ? (
                        <div className="relative aspect-video bg-black flex items-center justify-center">
                          <video src={p.media_url} controls className="w-full h-full object-contain" />
                        </div>
                      ) : p.media_url ? (
                        <div className="relative aspect-square max-h-[500px] bg-secondary flex items-center justify-center overflow-hidden">
                          <img loading="lazy" decoding="async"
                            src={optimizeImageUrl(p.media_url, { width: 800, quality: 85 })}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="p-8 text-center min-h-[200px] flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, hsl(142 76% 45%) 0%, hsl(200 100% 50%) 100%)",
                          }}
                        >
                          <p className="font-display font-bold text-lg text-white">{p.content}</p>
                        </div>
                      )}

                      {/* Card Actions Bar */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleLike(p.id)}
                              className="hover:scale-110 active:scale-90 transition-transform"
                            >
                              <Heart
                                className={cn(
                                  "h-6 w-6 transition-colors",
                                  isLiked ? "fill-red-500 text-red-500" : "text-foreground hover:text-muted-foreground"
                                )}
                              />
                            </button>
                            <button
                              onClick={() => setSelectedPost(p)}
                              className="hover:scale-110 active:scale-90 transition-transform"
                            >
                              <MessageCircle className="h-6 w-6 text-foreground hover:text-muted-foreground" />
                            </button>
                            <button
                              onClick={handleShareProfile}
                              className="hover:scale-110 active:scale-90 transition-transform"
                            >
                              <Share2 className="h-6 w-6 text-foreground hover:text-muted-foreground" />
                            </button>
                          </div>
                          <Bookmark className="h-6 w-6 text-foreground hover:text-muted-foreground cursor-pointer" />
                        </div>

                        <div className="font-bold text-sm">
                          {(p.likes_count || 0) + (isLiked ? 1 : 0)} likes
                        </div>

                        {p.content && p.media_url && (
                          <div className="text-sm">
                            <span className="font-bold mr-2">{profile?.username}</span>
                            <span className="text-muted-foreground">{p.content}</span>
                          </div>
                        )}

                        {/* Inline Comment Input Box */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={inlineComments[p.id] || ""}
                            onChange={(e) => setInlineComments((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleAddInlineComment(p.id)}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                          />
                          <button
                            onClick={() => handleAddInlineComment(p.id)}
                            disabled={!inlineComments[p.id]?.trim()}
                            className="text-xs font-bold text-primary disabled:opacity-40 hover:underline"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Squad & Friends Suggestions Section */}
        <SquadSuggestions className="mt-8 mb-6" title="Suggested Friends & Squadmates" />

        {/* Modal 1: Followers Dialog */}
        <Dialog open={followersModalOpen} onOpenChange={setFollowersModalOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-center">Followers</DialogTitle>
              <DialogDescription className="text-center text-xs">
                People who follow {profile?.username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {followersLoading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : followersList.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No followers yet
                </div>
              ) : (
                followersList.map((f: any) => (
                  <div key={f.user_id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-secondary/40 transition-colors">
                    <Link
                      to={`/player/${f.user_id}`}
                      onClick={() => setFollowersModalOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={f.avatar_url || getGamerAvatar(f.username)} />
                        <AvatarFallback className="font-bold bg-secondary">
                          {(f.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {f.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{f.full_name || "Gamer"}</div>
                      </div>
                    </Link>
                    {user?.id !== f.user_id && (
                      <FollowButton userId={f.user_id} username={f.username} size="sm" />
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Following Dialog */}
        <Dialog open={followingModalOpen} onOpenChange={setFollowingModalOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-center">Following</DialogTitle>
              <DialogDescription className="text-center text-xs">
                People {profile?.username} is following
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {followingLoading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : followingList.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Not following anyone yet
                </div>
              ) : (
                followingList.map((f: any) => (
                  <div key={f.user_id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-secondary/40 transition-colors">
                    <Link
                      to={`/player/${f.user_id}`}
                      onClick={() => setFollowingModalOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={f.avatar_url || getGamerAvatar(f.username)} />
                        <AvatarFallback className="font-bold bg-secondary">
                          {(f.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {f.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{f.full_name || "Gamer"}</div>
                      </div>
                    </Link>
                    {user?.id !== f.user_id && (
                      <FollowButton userId={f.user_id} username={f.username} size="sm" />
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Full Instagram Post Detail Viewer */}
        <Dialog open={!!selectedPost} onOpenChange={(open) => { if (!open) setSelectedPost(null); }}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl bg-card border-border/60">
            <DialogHeader className="sr-only">
              <DialogTitle>Post Details</DialogTitle>
              <DialogDescription>View full post details and comments</DialogDescription>
            </DialogHeader>
            {selectedPost && (
              <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                {/* Left Media Container */}
                <div className="bg-black flex items-center justify-center max-h-[500px] overflow-hidden">
                  {selectedPost.media_type === "video" ? (
                    <video src={selectedPost.media_url} controls className="w-full h-full object-contain" />
                  ) : selectedPost.media_url ? (
                    <img loading="lazy" decoding="async" src={selectedPost.media_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-8 text-center">
                      <p className="font-display font-bold text-lg text-white">{selectedPost.content}</p>
                    </div>
                  )}
                </div>

                {/* Right Interactive Sidebar */}
                <div className="flex flex-col h-full p-4 border-l border-border/40">
                  {/* Author Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-primary/30">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="font-bold bg-secondary">
                          {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-sm">{profile?.username}</div>
                        <div className="text-[11px] text-muted-foreground">Original Post</div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Feed */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-60 text-xs">
                    {selectedPost.content && (
                      <div className="flex gap-2">
                        <span className="font-bold shrink-0">{profile?.username}:</span>
                        <span className="text-muted-foreground">{selectedPost.content}</span>
                      </div>
                    )}
                    {postComments.map((c: any) => (
                      <div key={c.id} className="flex gap-2">
                        <span className="font-bold shrink-0">{c.profiles?.username || "Gamer"}:</span>
                        <span className="text-muted-foreground">{c.content}</span>
                      </div>
                    ))}
                    {postComments.length === 0 && !selectedPost.content && (
                      <p className="text-muted-foreground text-center py-6">No comments yet</p>
                    )}
                  </div>

                  {/* Action Bar & Comment Input */}
                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 cursor-pointer text-foreground hover:text-red-500" />
                        <MessageCircle className="h-5 w-5 cursor-pointer text-foreground" />
                        <Share2 className="h-5 w-5 cursor-pointer text-foreground" />
                      </div>
                      <span className="text-xs font-bold">{selectedPost.likes_count || 0} likes</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddModalComment()}
                        className="flex-1 bg-secondary/50 rounded-xl px-3 py-2 text-xs outline-none"
                      />
                      <Button size="sm" className="h-8 rounded-xl px-3 text-xs" onClick={handleAddModalComment}>
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Profile Modal */}
        <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      </motion.div>
    </SocialLayout>
  );
}
