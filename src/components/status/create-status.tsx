import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/lib/router-compat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Smile, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function CreateStatus() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const createStatus = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Not authenticated");
      let media_url: string | undefined;
      let media_type: string | undefined;

      if (mediaFile) {
        setIsUploading(true);
        let uploadPayload: Blob = mediaFile;
        const isImage = mediaFile.type.startsWith("image");
        let ext = mediaFile.name.split(".").pop() ?? "bin";
        if (isImage) {
          const { compressImageFile } = await import("@/utils/media-optimizer");
          uploadPayload = await compressImageFile(mediaFile, 3840, 0.98);
          ext =
            mediaFile.type === "image/png"
              ? "png"
              : mediaFile.type === "image/webp"
                ? "webp"
                : "jpg";
        }
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("status-media")
          .upload(path, uploadPayload, {
            upsert: false,
            contentType: isImage ? "image/webp" : mediaFile.type,
          });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from("status-media").getPublicUrl(path);
        media_url = publicData.publicUrl;
        media_type = isImage ? "image" : "video";
        setIsUploading(false);
      }

      const { error } = await supabase.from("user_statuses").insert({
        user_id: user.id,
        content: text,
        expires_at: null,
        ...(media_url ? { media_url, media_type } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setIsExpanded(false);
      clearMedia();
      queryClient.invalidateQueries({ queryKey: ["user-statuses"] });
    },
    onError: (err: Error) => {
      setIsUploading(false);
      toast({ title: "Failed to post", description: err.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const isSubmitting = createStatus.isPending || isUploading;

  return (
    <div className="bg-card border-b border-border/50 md:border md:rounded-xl p-4 mb-4 shadow-sm md:mx-0 transition-all duration-300">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
      />

      <div className="flex gap-3">
        <Link to="/social/profile">
          <Avatar className="h-10 w-10 shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
            <AvatarImage src={profile?.avatar_url ?? ""} />
            <AvatarFallback className="bg-muted">
              {(profile?.username ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div
            className={cn(
              "w-full rounded-2xl bg-secondary/30 transition-all duration-300 cursor-text",
              isExpanded ? "min-h-[100px] p-3" : "h-10 px-4 flex items-center",
            )}
            onClick={() => !isExpanded && setIsExpanded(true)}
          >
            {isExpanded ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind, Gamer?"
                className="w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground text-sm min-h-[80px]"
                autoFocus
              />
            ) : (
              <span className="text-sm text-muted-foreground">What's on your mind, Gamer?</span>
            )}
          </div>

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-border/50">
              {mediaFile?.type.startsWith("video") ? (
                <video
                  src={mediaPreview}
                  className="w-full max-h-48 object-cover"
                  muted
                  controls={false}
                />
              ) : (
                <img loading="lazy" decoding="async" src={mediaPreview} alt="Preview" className="w-full max-h-48 object-cover" />
              )}
              <button
                onClick={clearMedia}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden flex items-center justify-between mt-3 pt-3 border-t border-border/50"
              >
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary rounded-full hover:bg-primary/10"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary rounded-full hover:bg-primary/10"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground rounded-full"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs",
                      content.length > 250 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {content.length}/280
                  </span>
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-full font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={
                      (!content.trim() && !mediaFile) || content.length > 280 || isSubmitting
                    }
                    onClick={() => createStatus.mutate(content)}
                  >
                    {isSubmitting ? "Posting…" : "Post"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
