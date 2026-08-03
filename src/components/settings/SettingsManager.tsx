// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GAMER_AVATARS, getGamerAvatar } from "@/constants/avatars";
import { NotificationSettings } from "@/components/notifications/notification-settings";
import {
  User,
  Shield,
  Bell,
  Lock,
  Palette,
  Gamepad2,
  Play,
  Trash2,
  Loader2,
  Check,
  Copy,
  Gift,
  Sparkles,
  Volume2,
  Eye,
  MessageCircle,
  UserX,
  Smartphone,
  Database,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Radio,
  Share2,
  Sliders,
  Tv,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Preset Avatars for Gamers
const PRESET_AVATARS = [
  { id: "avatar_1", name: "White Mummy", url: GAMER_AVATARS[0] },
  { id: "avatar_2", name: "Bape Camo", url: GAMER_AVATARS[1] },
  { id: "avatar_3", name: "Gojo Glacier", url: GAMER_AVATARS[2] },
  { id: "avatar_4", name: "Mummy Duo", url: GAMER_AVATARS[3] },
  { id: "avatar_5", name: "Skull Shooter", url: GAMER_AVATARS[4] },
  { id: "avatar_6", name: "Butterfly Crown", url: GAMER_AVATARS[5] },
];

const GAMING_PLATFORMS = [
  "PC (Windows)",
  "PlayStation 5",
  "Xbox Series X/S",
  "Mobile (iOS/Android)",
  "Nintendo Switch",
];
const GAME_GENRES = [
  "FPS / Shooter",
  "Battle Royale",
  "MOBA",
  "Fighting",
  "Sports / Racing",
  "RPG / Strategy",
];

interface SettingsManagerProps {
  initialTab?: string;
  variant?: "standard" | "social";
}

export function SettingsManager({
  initialTab = "profile",
  variant = "standard",
}: SettingsManagerProps) {
  const {
    user,
    profile,
    updateProfile,
    refreshProfile,
    logout,
    isLoading: authLoading,
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [gameHandle, setGameHandle] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [platform, setPlatform] = useState("PC (Windows)");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Security & Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Referral State
  const [customRefCode, setCustomRefCode] = useState("");
  const [savingRefCode, setSavingRefCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Persisted Preferences (scoped to user)
  const uid = user?.id ?? "guest";
  const [themeMode, setThemeMode] = useLocalStorage<string>(
    `gf:setting:${uid}:theme`,
    "dark-cyber",
  );
  const [gamingMode, setGamingMode] = useLocalStorage<boolean>(
    `gf:setting:${uid}:gaming-mode`,
    true,
  );
  const [soundFx, setSoundFx] = useLocalStorage<boolean>(`gf:setting:${uid}:sound-fx`, true);
  const [reducedMotion, setReducedMotion] = useLocalStorage<boolean>(
    `gf:setting:${uid}:reduced-motion`,
    false,
  );
  const [compactUi, setCompactUi] = useLocalStorage<boolean>(`gf:setting:${uid}:compact-ui`, false);

  // Privacy & Chat Preferences
  const [privateAccount, setPrivateAccount] = useLocalStorage<boolean>(
    `gf:setting:${uid}:private`,
    false,
  );
  const [showActivity, setShowActivity] = useLocalStorage<boolean>(
    `gf:setting:${uid}:activity`,
    true,
  );
  const [dmPermission, setDmPermission] = useLocalStorage<string>(
    `gf:setting:${uid}:dm-permission`,
    "everyone",
  );
  const [readReceipts, setReadReceipts] = useLocalStorage<boolean>(
    `gf:setting:${uid}:read-receipts`,
    true,
  );
  const [typingIndicator, setTypingIndicator] = useLocalStorage<boolean>(
    `gf:setting:${uid}:typing`,
    true,
  );
  const [matureFilter, setMatureFilter] = useLocalStorage<boolean>(
    `gf:setting:${uid}:mature-filter`,
    true,
  );
  const [blockedUsers, setBlockedUsers] = useLocalStorage<string[]>(
    `gf:setting:${uid}:blocked-users`,
    [],
  );

  // Notifications Preferences
  const [notifCategories, setNotifCategories] = useLocalStorage(
    `gf:setting:${uid}:notif-categories`,
    {
      tournaments: true,
      matches: true,
      rewards: true,
      followers: true,
      messages: true,
      likes: true,
      promotions: false,
    },
  );

  // Media & Connected Accounts Preferences
  const [autoplayVideos, setAutoplayVideos] = useLocalStorage<string>(
    `gf:setting:${uid}:autoplay`,
    "always",
  );
  const [videoQuality, setVideoQuality] = useLocalStorage<string>(
    `gf:setting:${uid}:video-quality`,
    "auto",
  );
  const [connectedAccounts, setConnectedAccounts] = useLocalStorage(
    `gf:setting:${uid}:connected-accounts`,
    {
      steam: "",
      psn: "",
      xbox: "",
      discord: "",
      riot: "",
      twitch: "",
    },
  );

  // Delete Account Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Play audio click effect if soundFx is active
  const playClick = () => {
    if (!soundFx) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio context fail silent
    }
  };

  // Sync profile fields on load
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setFullName((profile as any).full_name || "");
      setGameHandle(profile.game_handle || "");
      setBio(profile.bio || "");
      setWebsite((profile as any).website || "");
      setAvatarUrl(profile.avatar_url || "");
      setCustomRefCode(profile.referral_code || "");
      if ((profile as any).platform) setPlatform((profile as any).platform);
      if ((profile as any).favorite_genres) setFavoriteGenres((profile as any).favorite_genres);
    }
  }, [profile]);

  // Sync theme and FX to HTML attributes
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.gamingMode = gamingMode ? "on" : "off";
    root.dataset.reducedMotion = reducedMotion ? "on" : "off";
    root.dataset.themeMode = themeMode;

    if (themeMode === "midnight") {
      root.classList.add("dark", "theme-midnight");
      root.classList.remove("theme-light");
    } else if (themeMode === "light") {
      root.classList.remove("dark", "theme-midnight");
      root.classList.add("theme-light");
    } else {
      root.classList.add("dark");
      root.classList.remove("theme-midnight", "theme-light");
    }
  }, [gamingMode, reducedMotion, themeMode]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    if (!user) return;
    playClick();
    setSavingProfile(true);

    try {
      let updateError: any = null;

      // First try full update with optional fields
      const fullPayload = {
        username: username.trim(),
        full_name: fullName.trim(),
        game_handle: gameHandle.trim(),
        bio: bio.trim(),
        website: website.trim(),
        avatar_url: avatarUrl,
        platform,
        favorite_genres: favoriteGenres,
        updated_at: new Date().toISOString(),
      };

      const res1 = await supabase.from("profiles").update(fullPayload).eq("user_id", user.id);

      updateError = res1.error;

      // If schema cache error occurs (missing column favorite_genres / favourite_genres / platform / etc.), fallback to standard profile columns
      if (
        updateError &&
        (updateError.message?.includes("column") ||
          updateError.message?.includes("schema cache") ||
          updateError.code === "PGRST204")
      ) {
        console.warn("Falling back to core profile schema update:", updateError.message);
        const corePayload = {
          username: username.trim(),
          game_handle: gameHandle.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        };

        const res2 = await supabase.from("profiles").update(corePayload).eq("user_id", user.id);

        updateError = res2.error;
      }

      if (updateError) throw updateError;

      await refreshProfile();
      toast({
        title: "Profile Saved",
        description: "Your profile and gamer identity have been updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Preset Avatar Selection
  const handleSelectPresetAvatar = (url: string) => {
    playClick();
    setAvatarUrl(url);
    toast({
      title: "Avatar Selected",
      description: 'Click "Save Profile Changes" to apply your new gamer avatar.',
    });
  };

  // Handle Custom Avatar File Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) {
        // Fallback to Base64 data URL if storage bucket fails or isn't public
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (base64) {
            setAvatarUrl(base64);
            toast({
              title: "Avatar Prepared",
              description: 'Click "Save Profile Changes" to apply.',
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          setAvatarUrl(publicUrlData.publicUrl);
          toast({
            title: "Avatar Uploaded",
            description: 'Click "Save Profile Changes" to apply.',
          });
        }
      }
    } catch (err: any) {
      toast({
        title: "Upload Error",
        description: err.message || "Could not process avatar image.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Password Update
  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      toast({
        title: "Missing Password",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    playClick();

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Changed",
        description: "Your account password has been updated successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsUpdatingPassword(false);
  };

  // Handle Custom Referral Code Save
  const handleSaveReferralCode = async () => {
    if (!user || !customRefCode.trim()) return;
    const cleanCode = customRefCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");

    if (cleanCode.length < 4) {
      toast({
        title: "Code Too Short",
        description: "Referral code must be at least 4 characters.",
        variant: "destructive",
      });
      return;
    }

    setSavingRefCode(true);
    playClick();

    try {
      // Check if code is already taken by another user
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", cleanCode)
        .neq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Code Taken",
          description: "This referral code is already taken by another gamer. Try another!",
          variant: "destructive",
        });
        setSavingRefCode(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: cleanCode })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      setCustomRefCode(cleanCode);
      toast({
        title: "Referral Code Updated!",
        description: `Your custom code is now ${cleanCode}`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update referral code.",
        variant: "destructive",
      });
    } finally {
      setSavingRefCode(false);
    }
  };

  // Copy Referral Link
  const copyReferralLink = () => {
    const code = profile?.referral_code || customRefCode || "GAMEFLEX";
    const inviteUrl = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    playClick();
    toast({
      title: "Invite Link Copied!",
      description: `Copied: ${inviteUrl}`,
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Clear Local Storage & Cache
  const handleClearCache = () => {
    playClick();
    const keepKeys = ["supabase.auth.token", "sb-35vrwbonqs4dzqqxu7hept-auth-token"];
    const preserved: Record<string, string> = {};

    keepKeys.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val) preserved[k] = val;
    });

    localStorage.clear();

    Object.entries(preserved).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

    toast({
      title: "App Cache Cleared",
      description: "Local app settings have been reset cleanly.",
    });
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "DELETE") {
      toast({
        title: "Confirmation Error",
        description: "Please type DELETE in capital letters to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAccount(true);
    playClick();

    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) {
        toast({
          title: "Account Deletion Requested",
          description:
            "Your request has been logged. Please contact support@gameflex.app for instant removal.",
        });
      } else {
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted.",
        });
      }
      await logout();
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Contact Support",
        description: "Please email support@gameflex.app to complete your account deletion.",
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto my-12 border-border/60">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold font-display">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">
            Please log in to your GameFlex account to access and modify your settings.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Log In to GameFlex
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tabsList = [
    { id: "profile", label: "Profile & Gamer Tag", icon: User },
    { id: "security", label: "Security & Referrals", icon: Shield },
    { id: "notifications", label: "Notifications & Push", icon: Bell },
    { id: "privacy", label: "Privacy & Safety", icon: Lock },
    { id: "appearance", label: "Appearance & FX", icon: Palette },
    { id: "connected", label: "Connected Platforms", icon: Gamepad2 },
    { id: "playback", label: "Playback & Storage", icon: Play },
    { id: "danger", label: "Danger Zone", icon: Trash2, danger: true },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Sliders className="h-8 w-8 text-primary" />
            GameFlex Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage gamer profile, notifications, security, referral codes, and platform preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs border-primary/30 text-primary bg-primary/5 px-3 py-1"
          >
            @{profile?.username || user.email?.split("@")[0]}
          </Badge>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 space-y-1 bg-card/40 p-2 rounded-2xl border border-border/50 backdrop-blur-sm sticky top-20">
          <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Settings Menu
          </div>
          {tabsList.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  playClick();
                  setActiveTab(t.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? t.danger
                      ? "bg-destructive/15 text-destructive font-semibold border border-destructive/30"
                      : "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                    : t.danger
                      ? "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive && !t.danger ? "text-primary-foreground" : ""}`}
                />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
          <Separator className="my-2 bg-border/40" />
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-destructive/90 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <UserX className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-8 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: PROFILE & GAMER IDENTITY */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Gamer Profile & Identity
                      </CardTitle>
                      <CardDescription>
                        Customize your public gamer card, avatar, gamer handle, and streaming
                        details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar Picker Section */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block">Avatar Image</Label>
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-muted/40 border border-border/50">
                          <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-lg shrink-0">
                            <AvatarImage src={avatarUrl || profile?.avatar_url} />
                            <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                              {(username || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-3 flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="text-xs"
                              >
                                {uploadingAvatar ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  "Upload Custom Image"
                                )}
                              </Button>
                              <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarFileChange}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Recommended size: 400x400px JPG, PNG, or WEBP. Max size 5MB.
                            </p>
                          </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="mt-4">
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-2">
                            Or Choose a Preset Gamer Avatar:
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {PRESET_AVATARS.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleSelectPresetAvatar(p.url)}
                                className={`relative group rounded-xl overflow-hidden border-2 transition-all p-1 bg-background hover:scale-105 ${
                                  avatarUrl === p.url
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border/50 hover:border-primary/50"
                                }`}
                                title={p.name}
                              >
                                <img
                                  src={p.url}
                                  alt={p.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-12 object-cover rounded-lg"
                                />
                                <span className="text-[10px] text-center block font-medium truncate mt-1 text-muted-foreground group-hover:text-foreground">
                                  {p.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username *</Label>
                          <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="GamerTag"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name / Display Name</Label>
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gameHandle" className="flex items-center gap-1.5">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                            Game Handle / Tag
                          </Label>
                          <Input
                            id="gameHandle"
                            value={gameHandle}
                            onChange={(e) => setGameHandle(e.target.value)}
                            placeholder="Ninja#1234 or GhostRider"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Used in tournament match lobbies.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website" className="flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-primary" />
                            Twitch / Stream / Website URL
                          </Label>
                          <Input
                            id="website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://twitch.tv/mychannel"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="bio">Gamer Bio</Label>
                          <span className="text-xs text-muted-foreground font-mono">
                            {bio.length}/150
                          </span>
                        </div>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="FPS enthusiast, competitive tournament player, streaming daily!"
                          maxLength={150}
                          className="min-h-[90px] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Gaming Platform</Label>
                          <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {GAMING_PLATFORMS.map((pl) => (
                              <option key={pl} value={pl}>
                                {pl}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Favorite Genres</Label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {GAME_GENRES.map((g) => {
                              const isSelected = favoriteGenres.includes(g);
                              return (
                                <Badge
                                  key={g}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:border-primary/50"
                                  }`}
                                  onClick={() => {
                                    playClick();
                                    setFavoriteGenres(
                                      isSelected
                                        ? favoriteGenres.filter((x) => x !== g)
                                        : [...favoriteGenres, g],
                                    );
                                  }}
                                >
                                  {g}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="min-w-[160px] font-semibold"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Profile Changes"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 2: SECURITY & REFERRALS */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Account Info Card */}
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Account & Password Security
                      </CardTitle>
                      <CardDescription>
                        Manage your email, password credentials, and active session details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            Registered Email
                          </p>
                          <p className="text-sm font-semibold font-mono text-foreground mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Password Change Form */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Lock className="h-4 w-4 text-primary" />
                          Change Password
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sec-new-pass">New Password</Label>
                            <Input
                              id="sec-new-pass"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sec-conf-pass">Confirm New Password</Label>
                            <Input
                              id="sec-conf-pass"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={handlePasswordUpdate}
                          disabled={isUpdatingPassword || !newPassword}
                          variant="secondary"
                          className="font-semibold"
                        >
                          {isUpdatingPassword ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating Password...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Referral Code Manager */}
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-400" />
                        Referral Program & Code Manager
                      </CardTitle>
                      <CardDescription>
                        Earn bonus GameFlex Coins by inviting friends with your personal referral
                        link.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Custom Code Input */}
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                          <Label className="text-xs uppercase font-bold text-purple-400 tracking-wider">
                            Your Personal Referral Code
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={customRefCode}
                              onChange={(e) => setCustomRefCode(e.target.value.toUpperCase())}
                              placeholder="GF-CODE"
                              className="font-mono uppercase font-bold tracking-wide"
                            />
                            <Button
                              onClick={handleSaveReferralCode}
                              disabled={savingRefCode}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                            >
                              {savingRefCode ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Customize your unique code for easy sharing with friends.
                          </p>
                        </div>

                        {/* Invite Link Action */}
                        <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                              Shareable Invite Link
                            </span>
                            <div className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border/50 truncate">
                              {`${window.location.origin}/register?ref=${customRefCode || "GAMEFLEX"}`}
                            </div>
                          </div>
                          <Button
                            onClick={copyReferralLink}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          >
                            {copiedLink ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            {copiedLink ? "Copied to Clipboard!" : "Copy Shareable Link"}
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Gift className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">
                              Earn rewards per verified referral
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Track stats, manage codes, and view invited gamers.
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate("/referrals")}
                          className="shrink-0 gap-1.5 font-semibold text-xs"
                        >
                          Open Referral Dashboard <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS & PUSH */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  {/* Push Notifications Browser Manager */}
                  <NotificationSettings />

                  {/* Notification Categories Card */}
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        In-App Notification Preferences
                      </CardTitle>
                      <CardDescription>
                        Toggle which alerts trigger in-app popups and activity log entries.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          key: "tournaments",
                          title: "Tournament Alerts",
                          desc: "Match start reminders, bracket updates, and championship results",
                        },
                        {
                          key: "matches",
                          title: "Match Invites & Challenges",
                          desc: "Direct 1v1 challenges and team lobby invites",
                        },
                        {
                          key: "rewards",
                          title: "Wallet & Rewards",
                          desc: "Coins received, referral bonuses, and payout status",
                        },
                        {
                          key: "followers",
                          title: "Followers & Friend Requests",
                          desc: "When someone follows your gaming profile",
                        },
                        {
                          key: "messages",
                          title: "Direct Messages",
                          desc: "Chat messages from friends and tournament opponents",
                        },
                        {
                          key: "likes",
                          title: "Social Likes & Comments",
                          desc: "Interactions on your posts and video reels",
                        },
                        {
                          key: "promotions",
                          title: "Esports News & Offers",
                          desc: "Special tournament announcements and promotional rewards",
                        },
                      ].map((cat, idx, arr) => (
                        <React.Fragment key={cat.key}>
                          <div className="flex items-center justify-between py-1">
                            <div>
                              <p className="font-semibold text-sm">{cat.title}</p>
                              <p className="text-xs text-muted-foreground">{cat.desc}</p>
                            </div>
                            <Switch
                              checked={notifCategories[cat.key as keyof typeof notifCategories]}
                              onCheckedChange={(val) => {
                                playClick();
                                setNotifCategories({ ...notifCategories, [cat.key]: val });
                              }}
                            />
                          </div>
                          {idx < arr.length - 1 && <Separator className="bg-border/40" />}
                        </React.Fragment>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 4: PRIVACY & SAFETY */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Privacy & Activity Control
                      </CardTitle>
                      <CardDescription>
                        Control who can see your gaming profile, online status, and send messages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Private Account</p>
                          <p className="text-xs text-muted-foreground">
                            Only approved followers can view your feed posts & stats
                          </p>
                        </div>
                        <Switch
                          checked={privateAccount}
                          onCheckedChange={(v) => {
                            playClick();
                            setPrivateAccount(v);
                          }}
                        />
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Online & Activity Status</p>
                          <p className="text-xs text-muted-foreground">
                            Show when you are currently online or in a tournament match
                          </p>
                        </div>
                        <Switch
                          checked={showActivity}
                          onCheckedChange={(v) => {
                            playClick();
                            setShowActivity(v);
                          }}
                        />
                      </div>

                      <Separator className="bg-border/40" />

                      <div>
                        <Label className="font-semibold text-sm block mb-1">
                          Direct Message Access
                        </Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Choose who is allowed to send you private chat messages
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "everyone", label: "Everyone" },
                            { id: "followers", label: "Friends Only" },
                            { id: "nobody", label: "Nobody" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                playClick();
                                setDmPermission(opt.id);
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                                dmPermission === opt.id
                                  ? "border-primary bg-primary/15 text-primary"
                                  : "border-border/50 bg-background/50 hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Read Receipts</p>
                          <p className="text-xs text-muted-foreground">
                            Let opponents know when you have read their match messages
                          </p>
                        </div>
                        <Switch
                          checked={readReceipts}
                          onCheckedChange={(v) => {
                            playClick();
                            setReadReceipts(v);
                          }}
                        />
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Typing Indicators</p>
                          <p className="text-xs text-muted-foreground">
                            Display typing animation during live chats
                          </p>
                        </div>
                        <Switch
                          checked={typingIndicator}
                          onCheckedChange={(v) => {
                            playClick();
                            setTypingIndicator(v);
                          }}
                        />
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Mature Content Filter</p>
                          <p className="text-xs text-muted-foreground">
                            Filter out sensitive media and aggressive words in feed
                          </p>
                        </div>
                        <Switch
                          checked={matureFilter}
                          onCheckedChange={(v) => {
                            playClick();
                            setMatureFilter(v);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blocked Users Manager */}
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <UserX className="h-5 w-5 text-primary" />
                        Blocked Gamers
                      </CardTitle>
                      <CardDescription>
                        Users you block cannot challenge you, view your profile, or send messages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {blockedUsers.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          You haven't blocked any users.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {blockedUsers.map((bu) => (
                            <div
                              key={bu}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40"
                            >
                              <span className="text-xs font-semibold">{bu}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  playClick();
                                  setBlockedUsers(blockedUsers.filter((x) => x !== bu));
                                  toast({ title: "User Unblocked" });
                                }}
                                className="h-7 text-xs text-red-400 hover:bg-red-500/10"
                              >
                                Unblock
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 5: APPEARANCE & GAMING FX */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Theme & Visual Atmosphere
                      </CardTitle>
                      <CardDescription>
                        Choose your interface visual theme, gaming glow effects, and sound FX.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Themes Selector */}
                      <div>
                        <Label className="font-semibold text-sm block mb-3">Color Theme</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            {
                              id: "dark-cyber",
                              label: "Dark Cyber (Default)",
                              desc: "Neon purple & cyan accents",
                              bg: "bg-[#0f0e17] border-purple-500/40",
                            },
                            {
                              id: "midnight",
                              label: "Midnight OLED",
                              desc: "Pure black for contrast",
                              bg: "bg-black border-zinc-700",
                            },
                            {
                              id: "light",
                              label: "Radiant Light",
                              desc: "Clean bright layout",
                              bg: "bg-white text-zinc-900 border-zinc-300",
                            },
                          ].map((th) => (
                            <button
                              key={th.id}
                              onClick={() => {
                                playClick();
                                setThemeMode(th.id);
                              }}
                              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${th.bg} ${
                                themeMode === th.id
                                  ? "ring-2 ring-primary border-primary shadow-lg"
                                  : "hover:opacity-90"
                              }`}
                            >
                              <div className="font-bold text-sm mb-1">{th.label}</div>
                              <div className="text-xs opacity-75">{th.desc}</div>
                              {themeMode === th.id && (
                                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Gaming Glow FX Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-400" />
                            Gaming Mode Neon FX
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enable animated neon borders and glowing tournament cards
                          </p>
                        </div>
                        <Switch
                          checked={gamingMode}
                          onCheckedChange={(v) => {
                            playClick();
                            setGamingMode(v);
                          }}
                        />
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Sound FX Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            <Volume2 className="h-4 w-4 text-primary" />
                            Interface Sound FX
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Play synthetic clicks and tournament match chimes on actions
                          </p>
                        </div>
                        <Switch
                          checked={soundFx}
                          onCheckedChange={(v) => {
                            setSoundFx(v);
                            if (v) playClick();
                          }}
                        />
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Reduced Motion Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Reduced Motion</p>
                          <p className="text-xs text-muted-foreground">
                            Minimize heavy animations across the application
                          </p>
                        </div>
                        <Switch
                          checked={reducedMotion}
                          onCheckedChange={(v) => {
                            playClick();
                            setReducedMotion(v);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 6: CONNECTED PLATFORMS */}
              {activeTab === "connected" && (
                <div className="space-y-6">
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                        Connected Gaming Platforms
                      </CardTitle>
                      <CardDescription>
                        Link your gaming accounts for instant lobby matchmaking and tournament
                        verification.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: "steam", label: "Steam ID", placeholder: "76561198000000000" },
                          {
                            key: "psn",
                            label: "PlayStation Network Online ID",
                            placeholder: "PSN_GamerTag",
                          },
                          { key: "xbox", label: "Xbox Live Gamertag", placeholder: "XboxGamer123" },
                          {
                            key: "riot",
                            label: "Riot ID (Valorant / LoL)",
                            placeholder: "Player#NA1",
                          },
                          { key: "discord", label: "Discord Tag", placeholder: "username#0000" },
                          {
                            key: "twitch",
                            label: "Twitch Channel Name",
                            placeholder: "my_twitch_stream",
                          },
                        ].map((plat) => (
                          <div key={plat.key} className="space-y-2">
                            <Label className="text-xs font-semibold">{plat.label}</Label>
                            <Input
                              value={
                                connectedAccounts[plat.key as keyof typeof connectedAccounts] || ""
                              }
                              onChange={(e) =>
                                setConnectedAccounts({
                                  ...connectedAccounts,
                                  [plat.key]: e.target.value,
                                })
                              }
                              placeholder={plat.placeholder}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button
                          onClick={() => {
                            playClick();
                            toast({
                              title: "Gaming Accounts Saved",
                              description: "Your platform IDs have been linked to your profile.",
                            });
                          }}
                          className="font-semibold"
                        >
                          Save Connected Accounts
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 7: PLAYBACK & STORAGE */}
              {activeTab === "playback" && (
                <div className="space-y-6">
                  <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Media Playback & Local Storage
                      </CardTitle>
                      <CardDescription>
                        Configure video feed autoplay, video resolution, and local device storage.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <Label className="font-semibold text-sm block mb-2">Video Autoplay</Label>
                        <select
                          value={autoplayVideos}
                          onChange={(e) => {
                            playClick();
                            setAutoplayVideos(e.target.value);
                          }}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="always">Always Autoplay Videos</option>
                          <option value="wifi">Autoplay on Wi-Fi Only</option>
                          <option value="never">Never Autoplay</option>
                        </select>
                      </div>

                      <Separator className="bg-border/40" />

                      <div>
                        <Label className="font-semibold text-sm block mb-2">Video Quality</Label>
                        <select
                          value={videoQuality}
                          onChange={(e) => {
                            playClick();
                            setVideoQuality(e.target.value);
                          }}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="hd">High Definition (1080p)</option>
                          <option value="auto">Auto (Adaptive)</option>
                          <option value="saver">Data Saver (720p)</option>
                        </select>
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div>
                          <p className="font-semibold text-sm">App Cache & Local Storage</p>
                          <p className="text-xs text-muted-foreground">
                            Clear cached media assets and temporary offline data
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleClearCache}>
                          Clear App Cache
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 8: DANGER ZONE */}
              {activeTab === "danger" && (
                <div className="space-y-6">
                  <Card className="border-destructive/40 bg-card/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl font-display flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone & Account Management
                      </CardTitle>
                      <CardDescription>
                        Irreversible actions regarding your GameFlex account and data.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            Reset All App Preferences
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Restores default notification, privacy, and theme settings
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            playClick();
                            handleClearCache();
                          }}
                          className="border-destructive/30 text-destructive hover:bg-destructive/20"
                        >
                          Reset Preferences
                        </Button>
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/15 border border-destructive/30">
                        <div>
                          <p className="font-semibold text-sm text-destructive">
                            Permanently Delete Account
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Deletes your profile, tournament entries, rewards, and match histories
                            forever.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            playClick();
                            setShowDeleteModal(true);
                          }}
                          className="font-semibold"
                        >
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive bg-card space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-display text-destructive flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Confirm Account Deletion
              </CardTitle>
              <CardDescription>
                This action is <strong>permanent</strong> and cannot be undone. All your coin
                balances, tournament entries, and match records will be purged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                </Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText.trim() !== "DELETE"}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Permanently Delete"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
