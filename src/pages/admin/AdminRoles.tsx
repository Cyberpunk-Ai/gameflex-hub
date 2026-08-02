// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, UserCog, Plus, Trash2, Crown, Users, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function AdminRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("moderator");

  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("*")
        .limit(200)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, email, avatar_url")
        .limit(200)
        .order("username");
      return data ?? [];
    },
  });

  const getProfile = (userId: string) => profiles.find((p: any) => p.user_id === userId);

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Check if role already exists
      const existing = userRoles.find((r: any) => r.user_id === userId && r.role === role);
      if (existing) throw new Error("User already has this role");

      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setShowAddRole(false);
      setSelectedUserId("");
      toast({ title: "Role Added", description: "User role has been assigned." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "Role Removed", description: "User role has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredRoles = userRoles.filter((role: any) => {
    const profile = getProfile(role.user_id);
    const matchesSearch =
      profile?.username?.toLowerCase().includes(search.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || role.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    user: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Crown className="h-4 w-4" />,
    moderator: <ShieldCheck className="h-4 w-4" />,
    user: <Users className="h-4 w-4" />,
  };

  // Get users without a specific elevated role for the dropdown
  const availableUsers = profiles.filter((p: any) => {
    const existingRoles = userRoles.filter(
      (r: any) => r.user_id === p.user_id && r.role === selectedRole,
    );
    return existingRoles.length === 0;
  });

  // Stats
  const adminCount = userRoles.filter((r: any) => r.role === "admin").length;
  const modCount = userRoles.filter((r: any) => r.role === "moderator").length;
  const userCount = userRoles.filter((r: any) => r.role === "user").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Role Management</h1>
        </div>
        <Button onClick={() => setShowAddRole(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Role
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Crown className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{adminCount}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{modCount}</div>
              <div className="text-sm text-muted-foreground">Moderators</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-500/20">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{userCount}</div>
              <div className="text-sm text-muted-foreground">Regular Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="moderator">Moderators</SelectItem>
            <SelectItem value="user">Users</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-5 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur">
              <div className="col-span-2">User</div>
              <div>Role</div>
              <div>Assigned</div>
              <div>Actions</div>
            </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading roles...</div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No roles found</div>
        ) : (
            filteredRoles.map((role: any) => {
            const profile = getProfile(role.user_id);
            const isSuperAdminEmail =
              profile?.email?.toLowerCase().trim() === "gameflex254@gmail.com";

            return (
              <div
                key={role.id}
                className="grid grid-cols-5 gap-4 p-4 border-t border-border/50 items-center text-sm"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      {profile?.username || "Unknown"}
                      {isSuperAdminEmail && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {profile?.email || "No email"}
                    </div>
                  </div>
                </div>
                <div>
                  <Badge className={`${roleColors[role.role]} flex items-center gap-1 w-fit`}>
                    {roleIcons[role.role]}
                    {role.role}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {new Date(role.created_at).toLocaleDateString()}
                </div>
                <div>
                  {isSuperAdminEmail ? (
                    <Badge variant="secondary" className="text-[11px]">Protected</Badge>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRoleMutation.mutate(role.id)}
                      disabled={removeRoleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>Grant a user elevated privileges</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={(v: AppRole) => setSelectedRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((p: any) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.username} ({p.email || "No email"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRole(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole })}
              disabled={!selectedUserId || addRoleMutation.isPending}
            >
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
