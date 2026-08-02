// @ts-nocheck
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@/lib/router-compat";
import { SocialLayout } from "@/components/social/social-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  X,
  Globe,
  Lock,
  Loader2,
  Check,
  ImageIcon,
  Video,
  Infinity as InfinityIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const POST_TYPES = [
  { emoji: "🏆", label: "Victory", id: "victory" },
  { emoji: "🎮", label: "Gameplay", id: "gameplay" },
  { emoji: "📸", label: "Screenshot", id: "screenshot" },
  { emoji: "🎬", label: "Clip", id: "clip" },
  { emoji: "📢", label: "Announce", id: "announcement" },
  { emoji: "👥", label: "Team", id: "team" },
];

const GRADIENTS = [
  {
    id: "neon",
    label: "Neon",
    css: "linear-gradient(135deg, hsl(142 76% 45%) 0%, hsl(180 100% 50%) 100%)",
  },
  {
    id: "victory",
    label: "Victory",
    css: "linear-gradient(135deg, hsl(45 100% 50%) 0%, hsl(142 76% 45%) 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    css: "linear-gradient(135deg, hsl(142 76% 28%) 0%, hsl(160 80% 45%) 100%)",
  },
  {
    id: "midnight",
    label: "Midnight",
    css: "linear-gradient(135deg, hsl(220 80% 40%) 0%, hsl(142 76% 45%) 100%)",
  },
  {
    id: "ember",
    label: "Ember",
    css: "linear-gradient(135deg, hsl(25 100% 55%) 0%, hsl(142 76% 45%) 100%)",
  },
  {
    id: "aurora",
    label: "Aurora",
    css: "linear-gradient(135deg, hsl(280 80% 55%) 0%, hsl(142 76% 45%) 100%)",
  },
];

export default function Create() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState("victory");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [textMode, setTextMode] = useState(false);
  const [gradient, setGradient] = useState(GRADIENTS[0].css);

  const handleFile = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      toast({ title: "Images and videos only", variant: "destructive" });
      return;
    }
    setFile(f);
    setFileType(f.type.startsWith("video/") ? "video" : "image");
    setFilePreview(URL.createObjectURL(f));
    setTextMode(false);
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      let mediaUrl = null;
      if (file) {
        let uploadPayload: Blob = file;
        let ext = file.name.split(".").pop() || "jpg";
        if (fileType === "image") {
          const { compressImageFile } = await import("@/utils/media-optimizer");
          uploadPayload = await compressImageFile(file, 3840, 0.98);
          ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        }
        const path = `${user.id}/post-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("status-media")
          .upload(path, uploadPayload, {
            contentType: fileType === "image" ? "image/webp" : file.type,
          });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("status-media").getPublicUrl(path);
        mediaUrl = publicUrl;
      }
      const { error } = await supabase.from("user_statuses").insert({
        user_id: user.id,
        content: caption.trim() || null,
        media_url: mediaUrl,
        media_type: fileType,
        expires_at: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Posted!" });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-counts"] });
      queryClient.invalidateQueries({ queryKey: ["player-user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["player-profile-counts"] });
      nav("/social");
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  if (!user) {
    return (
      <SocialLayout title="Create">
        <p className="text-center text-muted-foreground py-20">Sign in to create a post.</p>
      </SocialLayout>
    );
  }

  const canPost = !!caption.trim() || !!file;

  return (
    <SocialLayout title="New Post">
      <div className="max-w-xl mx-auto px-4 md:px-0 pb-10">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* ── Media area ─────────────────────────────── */}
        <div className="mb-4">
          {/* Mode toggle */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Media
            </span>
            {!filePreview && (
              <button
                onClick={() => setTextMode(!textMode)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {textMode ? "← Upload instead" : "Use text gradient →"}
              </button>
            )}
          </div>

          {filePreview ? (
            /* Preview */
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-md aspect-video">
              {fileType === "video" ? (
                <video src={filePreview} controls className="w-full h-full object-cover" />
              ) : (
                <img loading="lazy" decoding="async" src={filePreview} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : textMode ? (
            /* Text gradient preview */
            <div
              className="relative rounded-2xl overflow-hidden shadow-md aspect-video flex items-center justify-center p-8 text-center cursor-pointer"
              style={{ background: gradient }}
            >
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              <p className="font-bold text-xl text-white drop-shadow-xl z-10 leading-snug">
                {caption || "Your caption appears here…"}
              </p>
            </div>
          ) : (
            /* Drop zone */
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Video className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Upload photo or video</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click to browse</p>
              </div>
            </button>
          )}

          {/* Gradient swatches — text mode only */}
          {textMode && !filePreview && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
              {GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGradient(g.css)}
                  className={cn(
                    "relative shrink-0 h-9 w-14 rounded-lg overflow-hidden transition-all hover:scale-105",
                    gradient === g.css
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : "",
                  )}
                  style={{ background: g.css }}
                  title={g.label}
                >
                  {gradient === g.css && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white drop-shadow stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Caption ────────────────────────────────── */}
        <div className="mb-4">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption…"
            maxLength={2200}
            className="resize-none min-h-[90px] bg-secondary/30 border-border/50 text-sm"
          />
          <p className="text-right text-xs text-muted-foreground mt-1">{caption.length}/2200</p>
        </div>

        {/* ── Post type ──────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Type
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {POST_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setPostType(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium shrink-0 transition-all",
                  postType === t.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/30 border-border/50 hover:bg-secondary/60",
                )}
              >
                <span className="text-base leading-none">{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Visibility ─────────────────────────────── */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Audience
          </p>
          <div className="flex gap-3">
            {[
              { id: "public", icon: Globe, label: "Everyone" },
              { id: "private", icon: Lock, label: "Followers" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setVisibility(id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  visibility === id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/30 border-border/50 hover:bg-secondary/50",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Publish ────────────────────────────────── */}
        <Button
          size="lg"
          className="w-full font-bold h-12 rounded-xl"
          disabled={!canPost || uploadMutation.isPending}
          onClick={() => uploadMutation.mutate()}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting…
            </>
          ) : (
            "Publish Post"
          )}
        </Button>
      </div>
    </SocialLayout>
  );
}
