// @ts-nocheck
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatDistanceToNow } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-500",
  medium: "bg-yellow-500/20 text-yellow-500",
  high: "bg-orange-500/20 text-orange-500",
  urgent: "bg-red-500/20 text-red-500",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  closed: <CheckCircle className="w-4 h-4" />,
};

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{
    id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
  } | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: messages } = useQuery({
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

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: newTicket.subject,
          description: newTicket.description,
          priority: newTicket.priority,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setIsCreating(false);
      setNewTicket({ subject: "", description: "", priority: "medium" });
      toast({
        title: "Ticket Created",
        description: "Our support team will respond soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedTicket) throw new Error("Invalid state");
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: newMessage,
        is_staff: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages"] });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Sign in to contact support</h2>
            <p className="text-muted-foreground mb-6">
              Create an account or log in to open a support ticket and track your conversations.
            </p>
            <Button asChild>
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold font-display">Support</h1>
              <p className="text-muted-foreground">Get help with your account</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tickets List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Tickets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="divide-y divide-border">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedTicket?.id === ticket.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(ticket.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusIcons[ticket.status]}
                            <Badge variant="outline" className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-muted-foreground">No tickets yet</p>
                    <p className="text-sm text-muted-foreground">
                      Open a new ticket for account, payment, or tournament questions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ticket Detail / Create Form */}
          <div className="lg:col-span-2">
            {isCreating ? (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Create New Ticket</CardTitle>
                  <CardDescription>Describe your issue and we'll help you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="Brief summary of your issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                        setNewTicket({ ...newTicket, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      placeholder="Detailed description of your issue..."
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => createTicketMutation.mutate()}
                      disabled={
                        createTicketMutation.isPending ||
                        !newTicket.subject ||
                        !newTicket.description
                      }
                    >
                      {createTicketMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Ticket"
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedTicket ? (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedTicket.subject}</CardTitle>
                      <CardDescription>
                        Created{" "}
                        {formatDistanceToNow(new Date(selectedTicket.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedTicket.status}</Badge>
                      <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/50 mb-4">
                    <p className="text-sm">{selectedTicket.description}</p>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.is_staff ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.is_staff ? "Support" : "You"}
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
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newMessage.trim()) {
                            sendMessageMutation.mutate();
                          }
                        }}
                      />
                      <Button
                        onClick={() => sendMessageMutation.mutate()}
                        disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a ticket to view details or create a new one
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
