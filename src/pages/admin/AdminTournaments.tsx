// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, Link as LinkIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { formatExternalUrl } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<string, string> = {
  live: "Live",
  upcoming: "Upcoming",
  registration_open: "Open",
  registration_closed: "Closed",
  completed: "Done",
  cancelled: "Cancelled",
};

export default function AdminTournaments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "fifa" as const,
    format: "single_elimination" as const,
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 16,
    start_date: "",
    registration_deadline: "",
    rules: "",
    live_stream_link: "",
    group_link: "",
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("*")
        .limit(200)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage.from("tournament-images").upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("tournament-images").getPublicUrl(fileName);

    return publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload: any = {
        title: data.title,
        description: data.description,
        game: data.game,
        format: data.format,
        entry_fee: data.entry_fee,
        prize_pool: data.prize_pool,
        max_participants: data.max_participants,
        start_date: new Date(data.start_date).toISOString(),
        registration_deadline: new Date(data.registration_deadline).toISOString(),
        rules: data.rules,
        image_url: imageUrl,
        created_by: user?.id,
      };
      if (data.live_stream_link) payload.live_stream_link = data.live_stream_link;
      if (data.group_link) payload.group_link = data.group_link;

      let { error } = await supabase.from("tournaments").insert(payload);
      if (
        error &&
        (error.message?.includes("schema cache") ||
          error.message?.includes("live_stream_link") ||
          error.message?.includes("group_link") ||
          (error as any).code === "PGRST204")
      ) {
        delete payload.live_stream_link;
        delete payload.group_link;
        const retry = await supabase.from("tournaments").insert(payload);
        error = retry.error;
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({ title: "Tournament Created", description: "New tournament has been created" });
      setIsOpen(false);
      setImageFile(null);
      setFormData({
        title: "",
        description: "",
        game: "fifa",
        format: "single_elimination",
        entry_fee: 0,
        prize_pool: 0,
        max_participants: 16,
        start_date: "",
        registration_deadline: "",
        rules: "",
        live_stream_link: "",
        group_link: "",
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournaments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({ title: "Tournament Deleted" });
      setPendingDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toLocalInput = (value: string | null) =>
    value ? new Date(value).toISOString().slice(0, 16) : "";

  const startEditing = (t: any) => {
    setEditImageFile(null);
    setEditing({
      id: t.id,
      title: t.title ?? "",
      description: t.description ?? "",
      game: t.game ?? "fifa",
      format: t.format ?? "single_elimination",
      entry_fee: Number(t.entry_fee ?? 0),
      prize_pool: Number(t.prize_pool ?? 0),
      max_participants: Number(t.max_participants ?? 16),
      start_date: toLocalInput(t.start_date),
      registration_deadline: toLocalInput(t.registration_deadline),
      rules: t.rules ?? "",
      live_stream_link: t.live_stream_link ?? "",
      group_link: t.group_link ?? "",
      image_url: t.image_url ?? null,
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      let imageUrl = data.image_url;
      if (editImageFile) {
        imageUrl = await uploadImage(editImageFile);
      }

      const updatePayload: any = {
        title: data.title,
        description: data.description,
        game: data.game,
        format: data.format,
        entry_fee: data.entry_fee,
        prize_pool: data.prize_pool,
        max_participants: data.max_participants,
        start_date: new Date(data.start_date).toISOString(),
        registration_deadline: new Date(data.registration_deadline).toISOString(),
        rules: data.rules,
        image_url: imageUrl,
      };
      if (data.live_stream_link) updatePayload.live_stream_link = data.live_stream_link;
      if (data.group_link) updatePayload.group_link = data.group_link;

      let { error } = await supabase.from("tournaments").update(updatePayload).eq("id", data.id);

      if (
        error &&
        (error.message?.includes("schema cache") ||
          error.message?.includes("live_stream_link") ||
          error.message?.includes("group_link") ||
          (error as any).code === "PGRST204")
      ) {
        delete updatePayload.live_stream_link;
        delete updatePayload.group_link;
        const retry = await supabase.from("tournaments").update(updatePayload).eq("id", data.id);
        error = retry.error;
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({ title: "Tournament Updated", description: "Your changes are live" });
      setEditing(null);
      setEditImageFile(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status:
        | "upcoming"
        | "registration_open"
        | "registration_closed"
        | "live"
        | "completed"
        | "cancelled";
    }) => {
      const { error } = await supabase.from("tournaments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({ title: "Status Updated" });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Manage Tournaments</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Tournament</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="col-span-2">
                  <Label htmlFor="image">Tournament Image</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {imageFile && (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="h-16 w-24 object-cover rounded"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="game">Game</Label>
                  <Select
                    value={formData.game}
                    onValueChange={(v) => setFormData({ ...formData, game: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["fifa", "cod", "pubg", "fortnite", "apex", "valorant", "other"].map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(v) => setFormData({ ...formData, format: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["single_elimination", "double_elimination", "round_robin", "swiss"].map(
                        (f) => (
                          <SelectItem key={f} value={f}>
                            {f.replace("_", " ")}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entry_fee">Entry Fee (KES)</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: +e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="prize_pool">Prize Pool (KES)</Label>
                  <Input
                    id="prize_pool"
                    type="number"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({ ...formData, prize_pool: +e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({ ...formData, max_participants: +e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registration_deadline">Registration Deadline</Label>
                  <Input
                    id="registration_deadline"
                    type="datetime-local"
                    value={formData.registration_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_deadline: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Stream URL / Group Link */}
                <div className="col-span-2">
                  <Label htmlFor="live_stream_link">Live Stream URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="live_stream_link"
                      value={formData.live_stream_link}
                      onChange={(e) =>
                        setFormData({ ...formData, live_stream_link: e.target.value })
                      }
                      placeholder="YouTube URL or stream link..."
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube URLs will auto-embed on the Live page.
                  </p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="group_link">Join Group Link</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="group_link"
                      value={formData.group_link}
                      onChange={(e) => setFormData({ ...formData, group_link: e.target.value })}
                      placeholder="WhatsApp group or chat invite..."
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered players can use this link to join the tournament group.
                  </p>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="rules">Rules</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Tournament"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-8 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur">
              <div className="col-span-2">Tournament</div>
              <div>Game</div>
              <div>Prize</div>
              <div>Players</div>
              <div>Status</div>
              <div>Group</div>
              <div>Actions</div>
            </div>
            {tournaments.map((t: any) => (
              <div
                key={t.id}
                className="grid grid-cols-8 gap-4 p-4 border-t border-border/50 items-center text-sm"
              >
                <div className="col-span-2 flex items-center gap-3">
                  {t.image_url && (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={t.image_url}
                      alt=""
                      className="h-10 w-14 object-cover rounded"
                    />
                  )}
                  <span className="font-semibold truncate">{t.title}</span>
                </div>
                <div className="uppercase">{t.game}</div>
                <div>KES {Number(t.prize_pool).toLocaleString()}</div>
                <div>
                  {t.current_participants}/{t.max_participants}
                </div>
                <div>
                  <Select
                    value={t.status}
                    onValueChange={(
                      status:
                        | "upcoming"
                        | "registration_open"
                        | "registration_closed"
                        | "live"
                        | "completed"
                        | "cancelled",
                    ) => updateStatusMutation.mutate({ id: t.id, status })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <Badge
                        variant={
                          t.status === "live"
                            ? "destructive"
                            : t.status === "registration_open"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {statusLabels[t.status] ?? t.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "upcoming",
                        "registration_open",
                        "registration_closed",
                        "live",
                        "completed",
                        "cancelled",
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 text-xs">
                  {t.live_stream_link ? (
                    <a
                      href={formatExternalUrl(t.live_stream_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Stream
                    </a>
                  ) : null}
                  {t.group_link ? (
                    <a
                      href={formatExternalUrl(t.group_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Group
                    </a>
                  ) : null}
                  {!t.live_stream_link && !t.group_link ? (
                    <span className="text-muted-foreground">—</span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Edit ${t.title}`}
                    onClick={() => startEditing(t)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    aria-label={`Delete ${t.title}`}
                    onClick={() => setPendingDelete(t)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {tournaments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No tournaments found</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit tournament */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setEditImageFile(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(editing);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit_title">Title</Label>
                  <Input
                    id="edit_title"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_image">Tournament Image</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      id="edit_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {(editImageFile || editing.image_url) && (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={editImageFile ? URL.createObjectURL(editImageFile) : editing.image_url}
                        alt="Tournament preview"
                        className="h-16 w-24 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_game">Game</Label>
                  <Select
                    value={editing.game}
                    onValueChange={(v) => setEditing({ ...editing, game: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["fifa", "cod", "pubg", "fortnite", "apex", "valorant", "other"].map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_format">Format</Label>
                  <Select
                    value={editing.format}
                    onValueChange={(v) => setEditing({ ...editing, format: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["single_elimination", "double_elimination", "round_robin", "swiss"].map(
                        (f) => (
                          <SelectItem key={f} value={f}>
                            {f.replace("_", " ")}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_entry_fee">Entry Fee (KES)</Label>
                  <Input
                    id="edit_entry_fee"
                    type="number"
                    value={editing.entry_fee}
                    onChange={(e) => setEditing({ ...editing, entry_fee: +e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_prize_pool">Prize Pool (KES)</Label>
                  <Input
                    id="edit_prize_pool"
                    type="number"
                    value={editing.prize_pool}
                    onChange={(e) => setEditing({ ...editing, prize_pool: +e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_max">Max Participants</Label>
                  <Input
                    id="edit_max"
                    type="number"
                    value={editing.max_participants}
                    onChange={(e) => setEditing({ ...editing, max_participants: +e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_start">Start Date</Label>
                  <Input
                    id="edit_start"
                    type="datetime-local"
                    value={editing.start_date}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_deadline">Registration Deadline</Label>
                  <Input
                    id="edit_deadline"
                    type="datetime-local"
                    value={editing.registration_deadline}
                    onChange={(e) =>
                      setEditing({ ...editing, registration_deadline: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_live_stream_link">Live Stream URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit_live_stream_link"
                      value={editing.live_stream_link}
                      onChange={(e) => setEditing({ ...editing, live_stream_link: e.target.value })}
                      placeholder="YouTube URL or stream link..."
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube URLs will auto-embed on the Live page.
                  </p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_group_link">Join Group Link</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit_group_link"
                      value={editing.group_link}
                      onChange={(e) => setEditing({ ...editing, group_link: e.target.value })}
                      placeholder="WhatsApp group or chat invite..."
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered players can use this link to join the tournament group.
                  </p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit_rules">Rules</Label>
                  <Textarea
                    id="edit_rules"
                    value={editing.rules}
                    onChange={(e) => setEditing({ ...editing, rules: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" and its registrations will be permanently removed. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
