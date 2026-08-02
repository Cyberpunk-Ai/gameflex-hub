// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Crown,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { SocialLayout } from "@/components/social/social-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { squadService } from "@/services/squads/SquadService";
import {
  useDiscoverSquads,
  useInviteCandidates,
  useMyInvites,
  useMySquads,
  useSendSquadMessage,
  useSquadChat,
  useSquadInvites,
  useSquadMembers,
  useSquadRoleMutation,
} from "@/features/teams/hooks/useSquads";

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-primary/15 text-primary border-primary/30",
  captain: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  player: "bg-secondary text-muted-foreground border-border/60",
  sub: "bg-secondary text-muted-foreground border-border/60",
};

export default function Teams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tag: "", description: "", game: "", region: "" });
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: mySquads = [], isLoading: squadsLoading } = useMySquads(userId);
  const { data: discover = [] } = useDiscoverSquads(userId);
  const { data: myInvites = [] } = useMyInvites(userId);

  const activeSquad = useMemo(
    () => mySquads.find((s: any) => s.id === activeSquadId) ?? mySquads[0] ?? null,
    [mySquads, activeSquadId],
  );
  const squadId = activeSquad?.id;
  const canManage = activeSquad?.my_role === "owner" || activeSquad?.my_role === "captain";

  const { data: members = [], isLoading: membersLoading } = useSquadMembers(squadId);
  const { data: pendingInvites = [] } = useSquadInvites(squadId);
  const { data: messages = [], isLoading: chatLoading } = useSquadChat(squadId);
  const { data: candidates = [] } = useInviteCandidates(userId, inviteOpen ? squadId : undefined);
  const sendMessage = useSendSquadMessage(squadId, userId);
  const roleMutation = useSquadRoleMutation(squadId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const refreshSquads = () => {
    queryClient.invalidateQueries({ queryKey: ["squads"] });
  };

  const handleCreate = async () => {
    if (!userId) return;
    if (form.name.trim().length < 3 || form.tag.trim().length < 2) {
      toast.error("Squad needs a name (3+ chars) and a tag (2+ chars)");
      return;
    }
    setCreating(true);
    const { squad, error } = await squadService.createSquad(userId, form);
    setCreating(false);

    if (error || !squad) {
      toast.error(error?.message ?? "Could not create squad");
      return;
    }
    toast.success(`Squad ${squad.name} created`);
    setCreateOpen(false);
    setForm({ name: "", tag: "", description: "", game: "", region: "" });
    setActiveSquadId(squad.id);
    refreshSquads();
  };

  const handleInvite = async (invitedUserId: string) => {
    if (!userId || !squadId) return;
    const { error } = await squadService.invite(squadId, userId, invitedUserId);
    if (error) toast.error(error.message);
    else {
      toast.success("Invite sent");
      queryClient.invalidateQueries({ queryKey: ["squads"] });
    }
  };

  const handleInviteResponse = async (invite: any, accept: boolean) => {
    if (!userId) return;
    const { error } = await squadService.respondToInvite(invite, accept, userId);
    if (error) toast.error(error.message);
    else {
      toast.success(accept ? `Joined ${invite.squads?.name ?? "squad"}` : "Invite declined");
      refreshSquads();
    }
  };

  const handleJoin = async (id: string) => {
    if (!userId) return;
    const { error } = await squadService.joinPublicSquad(id, userId);
    if (error) toast.error(error.message);
    else {
      toast.success("You're in — say hi in squad chat");
      setActiveSquadId(id);
      refreshSquads();
    }
  };

  const handleLeave = async () => {
    if (!userId || !squadId) return;
    const { error } = await squadService.leaveSquad(squadId, userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Left the squad");
      setActiveSquadId(null);
      refreshSquads();
    }
  };

  const handleSend = async () => {
    const content = draft;
    if (!content.trim()) return;
    setDraft("");
    try {
      await sendMessage.mutateAsync(content);
    } catch (error: any) {
      setDraft(content);
      toast.error(error?.message ?? "Message failed to send");
    }
  };

  if (!user) {
    return (
      <SocialLayout title="Squads" subtitle="Squad up, recruit, and compete together">
        <Card className="p-8 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">Log in to create or join a squad.</p>
        </Card>
      </SocialLayout>
    );
  }

  return (
    <SocialLayout title="Squads" subtitle="Squad up, recruit, chat, and compete together">
      <div className="space-y-6">
        {myInvites.length > 0 && (
          <Card className="border-primary/30 bg-primary/5 p-4">
            <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <UserPlus className="h-4 w-4 text-primary" /> Squad invites
            </h2>
            <div className="space-y-2">
              {myInvites.map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {invite.squads?.name ?? "A squad"}{" "}
                      <span className="text-muted-foreground">[{invite.squads?.tag}]</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invite.message || "You've been invited to join"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => handleInviteResponse(invite, true)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInviteResponse(invite, false)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {squadsLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            mySquads.map((squad: any) => (
              <button
                key={squad.id}
                onClick={() => setActiveSquadId(squad.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  squad.id === squadId
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <Shield className="h-4 w-4" />
                {squad.name}
                <Badge variant="secondary" className="text-[10px]">
                  {squad.member_count ?? 0}/{squad.max_members}
                </Badge>
              </button>
            ))
          )}
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New squad
          </Button>
        </div>

        {!activeSquad ? (
          <Card className="p-8 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-primary" />
            <h2 className="font-display mb-1 text-lg font-bold">You're not in a squad yet</h2>
            <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">
              Create your own clan and invite the players you follow, or join one of the public
              squads below.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create your squad
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Squad chat */}
            <Card className="flex h-[560px] flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/60 p-4">
                <div className="min-w-0">
                  <h2 className="font-display flex items-center gap-2 truncate text-base font-bold">
                    <MessageSquare className="h-4 w-4 text-primary" /> {activeSquad.name} chat
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {members.length} member{members.length === 1 ? "" : "s"} · live
                  </p>
                </div>
                <Badge variant="secondary">[{activeSquad.tag}]</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No messages yet — kick off the squad talk.
                  </p>
                ) : (
                  messages.map((message: any) => {
                    const mine = message.user_id === userId;
                    return (
                      <div
                        key={message.id}
                        className={cn("flex gap-2", mine && "flex-row-reverse")}
                      >
                        <Avatar className="h-8 w-8 shrink-0 border border-border/60">
                          <AvatarImage src={message.profiles?.avatar_url ?? undefined} />
                          <AvatarFallback>
                            {(message.profiles?.username ?? "GF").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[75%]", mine && "text-right")}>
                          <p className="text-[11px] text-muted-foreground">
                            {mine ? "You" : (message.profiles?.username ?? "Player")} ·{" "}
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                          <div
                            className={cn(
                              "mt-1 inline-block rounded-2xl px-3 py-2 text-sm",
                              mine
                                ? "bg-primary/15 text-foreground"
                                : "bg-secondary text-foreground",
                            )}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-border/60 p-3">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message your squad…"
                  aria-label="Squad message"
                />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !draft.trim()}>
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Wins" value={activeSquad.wins ?? 0} />
                  <Stat label="Losses" value={activeSquad.losses ?? 0} />
                  <Stat label="Points" value={activeSquad.points ?? 0} />
                </div>
                {activeSquad.description && (
                  <p className="text-xs text-muted-foreground">{activeSquad.description}</p>
                )}
              </Card>

              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    <Users className="h-4 w-4 text-primary" /> Roster
                  </h3>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {membersLoading
                    ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)
                    : members.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-border/60">
                            <AvatarImage src={member.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {(member.profiles?.username ?? "GF").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {member.profiles?.username ?? "Player"}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] uppercase", ROLE_STYLES[member.role])}
                          >
                            {member.role === "owner" && <Crown className="mr-1 h-3 w-3" />}
                            {member.role}
                          </Badge>
                          {canManage && member.role === "player" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() =>
                                roleMutation.mutate({ memberId: member.id, role: "captain" })
                              }
                            >
                              Promote
                            </Button>
                          )}
                        </div>
                      ))}
                </div>

                {pendingInvites.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {pendingInvites.length} invite(s) pending
                  </p>
                )}

                {activeSquad.my_role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-destructive"
                    onClick={handleLeave}
                  >
                    Leave squad
                  </Button>
                )}
              </Card>
            </div>
          </div>
        )}

        {discover.length > 0 && (
          <div>
            <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-primary" /> Public squads recruiting
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {discover.map((squad: any) => (
                <Card key={squad.id} className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="truncate text-sm font-semibold">{squad.name}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      [{squad.tag}]
                    </Badge>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                    {squad.description || "No description yet."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {squad.member_count ?? 0}/{squad.max_members} members
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleJoin(squad.id)}>
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create squad */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a squad</DialogTitle>
            <DialogDescription>Your clan, your tag, your chat.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="squad-name">Name</Label>
                <Input
                  id="squad-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Nairobi Snipers"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="squad-tag">Tag</Label>
                <Input
                  id="squad-tag"
                  value={form.tag}
                  maxLength={6}
                  onChange={(event) => setForm({ ...form, tag: event.target.value.toUpperCase() })}
                  placeholder="NRB"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="squad-game">Main game</Label>
                <Input
                  id="squad-game"
                  value={form.game}
                  onChange={(event) => setForm({ ...form, game: event.target.value })}
                  placeholder="COD Mobile"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="squad-region">Region</Label>
                <Input
                  id="squad-region"
                  value={form.region}
                  onChange={(event) => setForm({ ...form, region: event.target.value })}
                  placeholder="Kenya"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="squad-desc">Description</Label>
              <Textarea
                id="squad-desc"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Who you are and who you're recruiting."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite members */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite squad members</DialogTitle>
            <DialogDescription>Players you follow who aren't in the squad yet.</DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No one to invite yet — follow more players first.
              </p>
            ) : (
              candidates.map((candidate: any) => (
                <div key={candidate.user_id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-border/60">
                    <AvatarImage src={candidate.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(candidate.username ?? "GF").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {candidate.username ?? "Player"}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleInvite(candidate.user_id)}>
                    Invite
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SocialLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
