// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  Search,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-500",
  medium: "bg-yellow-500/20 text-yellow-500",
  high: "bg-orange-500/20 text-orange-500",
  urgent: "bg-red-500/20 text-red-500",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-500",
  in_progress: "bg-yellow-500/20 text-yellow-500",
  resolved: "bg-green-500/20 text-green-500",
  closed: "bg-muted text-muted-foreground",
};

export default function AdminSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .limit(200)
        .order("created_at", { ascending: false });

      if (
        statusFilter !== "all" &&
        (statusFilter === "open" ||
          statusFilter === "in_progress" ||
          statusFilter === "resolved" ||
          statusFilter === "closed")
      ) {
        query = query.eq("status", statusFilter);
      }

      const { data } = await query;

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, email, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((t) => ({
        ...t,
        profiles: profileMap.get(t.user_id),
      }));
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["ticket-messages", selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!selectedTicket,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: "open" | "in_progress" | "resolved" | "closed";
    }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedTicket || !newMessage.trim()) return;

      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: newMessage,
        is_staff: true,
      });

      if (error) throw error;

      // Auto-update status to in_progress if it was open
      if (selectedTicket.status === "open") {
        await supabase
          .from("support_tickets")
          .update({ status: "in_progress" })
          .eq("id", selectedTicket.id);
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: selectedTicket.user_id,
        type: "system",
        title: "Support Reply",
        message: "You have a new reply on your support ticket",
        action_url: "/support",
      });
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast({ title: "Message sent" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      t.subject?.toLowerCase().includes(search) ||
      t.profiles?.username?.toLowerCase().includes(search) ||
      t.profiles?.email?.toLowerCase().includes(search)
    );
  });

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    total: tickets.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">Manage and respond to user support requests</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{stats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-2xl text-green-500">{stats.resolved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
            <CardTitle className="text-2xl text-primary">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedTicket?.id === ticket.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium truncate flex-1">{ticket.subject}</p>
                        <Badge className={priorityColors[ticket.priority]} variant="outline">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{ticket.profiles?.username || "Unknown"}</span>
                        <span>•</span>
                        <Badge className={statusColors[ticket.status]} variant="outline">
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="border-border/50 h-full flex flex-col">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4" />
                        {selectedTicket.profiles?.username} • {selectedTicket.profiles?.email}
                      </span>
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(status: "open" | "in_progress" | "resolved" | "closed") => {
                      updateStatusMutation.mutate({ ticketId: selectedTicket.id, status });
                      setSelectedTicket({ ...selectedTicket, status });
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Initial description */}
                <div className="p-4 rounded-lg bg-muted/50 mb-4">
                  <p className="text-sm">{selectedTicket.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-[300px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_staff
                          ? "bg-primary/10 border border-primary/20 ml-8"
                          : "bg-muted/50 mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.is_staff ? "Support Team" : "User"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== "closed" && (
                  <div className="flex gap-2 pt-4 border-t border-border/50">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={() => sendMessageMutation.mutate()}
                      disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      className="self-end"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a ticket to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
