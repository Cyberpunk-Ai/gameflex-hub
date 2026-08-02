// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trophy,
  Medal,
  Crown,
  Gamepad2,
  Shield,
  User,
  Users,
  Star,
  DollarSign,
  Gem,
  Loader2,
  Search,
  Award,
  Trash2,
} from "lucide-react";

const iconOptions = [
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "medal", label: "Medal", icon: Medal },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "gamepad-2", label: "Gamepad", icon: Gamepad2 },
  { value: "shield", label: "Shield", icon: Shield },
  { value: "user", label: "User", icon: User },
  { value: "users", label: "Users", icon: Users },
  { value: "star", label: "Star", icon: Star },
  { value: "dollar-sign", label: "Dollar", icon: DollarSign },
  { value: "gem", label: "Gem", icon: Gem },
];

const categoryOptions = ["competition", "participation", "profile", "social", "earnings"];
const requirementTypes = [
  { value: "wins", label: "Wins Count" },
  { value: "earnings", label: "Earnings Amount" },
  { value: "tournaments", label: "Tournaments Played" },
  { value: "referrals", label: "Referrals Count" },
  { value: "profile_complete", label: "Profile Complete" },
];

export default function AdminAchievements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "trophy",
    category: "competition",
    points: 100,
    requirement_type: "wins",
    requirement_value: 1,
  });

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("*")
        .limit(200)
        .order("category", { ascending: true })
        .order("points", { ascending: true });
      return data ?? [];
    },
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ["admin-user-achievements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("*, achievements(name)")
        .order("earned_at", { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((ua) => ua.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((ua) => ({
        ...ua,
        profile: profileMap.get(ua.user_id),
      }));
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-for-grant", searchTerm],
    queryFn: async () => {
      let query = supabase.from("profiles").select("user_id, username, email").limit(20);
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      const { data } = await query;
      return data ?? [];
    },
    enabled: isGrantOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("achievements").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
      toast({ title: "Achievement Created" });
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        icon: "trophy",
        category: "competition",
        points: 100,
        requirement_type: "wins",
        requirement_value: 1,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const grantMutation = useMutation({
    mutationFn: async ({ userId, achievementId }: { userId: string; achievementId: string }) => {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievementId,
      });
      if (error) throw error;

      // Log activity
      const achievement = achievements.find((a) => a.id === achievementId);
      await supabase.from("activity_feed").insert({
        activity_type: "achievement_earned",
        title: `Achievement Unlocked: ${achievement?.name}`,
        description: achievement?.description,
        user_id: userId,
        is_public: true,
        metadata: {
          achievement_id: achievementId,
          points: achievement?.points,
          granted_by_admin: true,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-achievements"] });
      toast({ title: "Achievement Granted" });
      setIsGrantOpen(false);
      setSelectedAchievement(null);
      setSelectedUser("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("achievements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
      toast({ title: "Achievement Deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getIcon = (iconName: string) => {
    const IconComponent = iconOptions.find((i) => i.value === iconName)?.icon || Trophy;
    return <IconComponent className="h-5 w-5" />;
  };

  const categoryColors: Record<string, string> = {
    competition: "bg-yellow-500/20 text-yellow-500",
    participation: "bg-blue-500/20 text-blue-500",
    profile: "bg-green-500/20 text-green-500",
    social: "bg-purple-500/20 text-purple-500",
    earnings: "bg-amber-500/20 text-amber-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">Manage badges and manually grant achievements</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award className="h-4 w-4 mr-2" />
                Grant Achievement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Achievement to User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Search User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or email..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.username} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Achievement</Label>
                  <Select
                    value={selectedAchievement?.id || ""}
                    onValueChange={(v) =>
                      setSelectedAchievement(achievements.find((a) => a.id === v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an achievement" />
                    </SelectTrigger>
                    <SelectContent>
                      {achievements.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            {getIcon(a.icon)} {a.name} ({a.points} pts)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedUser || !selectedAchievement || grantMutation.isPending}
                  onClick={() =>
                    grantMutation.mutate({
                      userId: selectedUser,
                      achievementId: selectedAchievement.id,
                    })
                  }
                >
                  {grantMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Grant Achievement"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Achievement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Achievement</DialogTitle>
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
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(v) => setFormData({ ...formData, icon: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <opt.icon className="h-4 w-4" /> {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: +e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Requirement Type</Label>
                    <Select
                      value={formData.requirement_type}
                      onValueChange={(v) => setFormData({ ...formData, requirement_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {requirementTypes.map((rt) => (
                          <SelectItem key={rt.value} value={rt.value}>
                            {rt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Requirement Value</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.requirement_value}
                      onChange={(e) =>
                        setFormData({ ...formData, requirement_value: +e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Achievement"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 p-4">
          <Trophy className="h-6 w-6 text-yellow-500 mb-2" />
          <div className="font-display text-2xl font-bold">{achievements.length}</div>
          <div className="text-sm text-muted-foreground">Total Achievements</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 p-4">
          <Award className="h-6 w-6 text-green-500 mb-2" />
          <div className="font-display text-2xl font-bold">{userAchievements.length}</div>
          <div className="text-sm text-muted-foreground">Total Granted</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 p-4">
          <Users className="h-6 w-6 text-blue-500 mb-2" />
          <div className="font-display text-2xl font-bold">
            {new Set(userAchievements.map((ua) => ua.user_id)).size}
          </div>
          <div className="text-sm text-muted-foreground">Users with Badges</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 p-4">
          <Star className="h-6 w-6 text-purple-500 mb-2" />
          <div className="font-display text-2xl font-bold">
            {achievements.reduce((sum, a) => sum + a.points, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Points Available</div>
        </div>
      </div>

      {/* Achievements Table */}
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden mb-8 shadow-sm">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Achievement</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              achievements.map((achievement: any) => (
                <TableRow key={achievement.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        {getIcon(achievement.icon)}
                      </div>
                      <div>
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryColors[achievement.category]}>
                      {achievement.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {achievement.requirement_type.replace("_", " ")}:{" "}
                      {achievement.requirement_value}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge>{achievement.points} pts</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(achievement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Recent Grants */}
      <div className="rounded-xl bg-card border border-border/50 p-6">
        <h2 className="font-display font-bold text-lg mb-4">Recent Achievement Grants</h2>
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {userAchievements.slice(0, 10).map((ua: any) => (
            <div
              key={ua.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium">{ua.profile?.username ?? "Unknown"}</span>
                  <span className="text-muted-foreground"> earned </span>
                  <span className="font-medium">{ua.achievements?.name}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(ua.earned_at).toLocaleDateString()}
              </span>
            </div>
          ))}
          {userAchievements.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No achievements granted yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
