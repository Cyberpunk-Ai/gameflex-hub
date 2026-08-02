// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GAMER_AVATARS, getGamerAvatar } from "@/constants/avatars";
import { Camera, Loader2, Save, Phone, User, Gamepad2, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    phone: profile?.phone ?? "",
    game_handle: profile?.game_handle ?? "",
  });

  // Sync form data when profile changes or modal opens
  useEffect(() => {
    if (open && profile) {
      setFormData({
        username: profile.username ?? "",
        bio: (profile as any).bio ?? "",
        phone: profile.phone ?? "",
        game_handle: profile.game_handle ?? "",
      });
    }
  }, [open, profile]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    setSelectedPresetUrl(null);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePresetSelect = (url: string) => {
    setAvatarFile(null);
    setSelectedPresetUrl(url);
    setAvatarPreview(url);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      let avatarUrl = selectedPresetUrl || profile?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username.trim(),
          bio: formData.bio.trim() || null,
          phone: formData.phone.trim() || null,
          game_handle: formData.game_handle.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      queryClient.invalidateQueries({ queryKey: ["social-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-rail-profile"] });
      queryClient.invalidateQueries({ queryKey: ["squad-suggestions"] });
      onOpenChange(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information visible to other players
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-primary/30 shadow-lg">
                <AvatarImage src={avatarPreview ?? profile?.avatar_url ?? getGamerAvatar(profile?.username)} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-accent/20">
                  {formData.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow-md border-2 border-background"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Custom Photo"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Gamer Avatar Presets */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Select Gamer Avatar
                </span>
                <span className="text-[11px] text-muted-foreground">Or click camera to upload</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {GAMER_AVATARS.map((url, index) => {
                  const isSelected = (avatarPreview ?? profile?.avatar_url) === url;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetSelect(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-secondary hover:scale-105 ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 scale-105"
                          : "border-border/60 hover:border-primary/50 opacity-80 hover:opacity-100"
                      }`}
                      title={`Gamer Avatar ${index + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Username
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Your username"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself, your gaming style..."
                className="resize-none min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                WhatsApp Number
                <span className="text-xs text-muted-foreground ml-auto">(Public)</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+254 7XX XXX XXX"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Other players can contact you via WhatsApp for match coordination
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="game_handle" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                Game Handle / IGN
              </Label>
              <Input
                id="game_handle"
                value={formData.game_handle}
                onChange={(e) => setFormData((prev) => ({ ...prev, game_handle: e.target.value }))}
                placeholder="Your in-game name"
                className="h-11"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending || !formData.username.trim()}
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
