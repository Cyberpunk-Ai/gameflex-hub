// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .limit(200)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filteredUsers = users.filter(
    (user: any) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search),
  );

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove spaces and ensure it starts with country code
    let formatted = phone.replace(/\s+/g, "").replace(/^0/, "254");
    if (!formatted.startsWith("+")) {
      formatted = formatted.replace(/^/, "");
    }
    // Remove any non-numeric characters except +
    return formatted.replace(/[^\d]/g, "");
  };

  const openWhatsAppChat = (user: any, customMessage?: string) => {
    if (!user.phone) {
      toast.error("This user has no phone number");
      return;
    }

    const phone = formatPhoneForWhatsApp(user.phone);
    const text = encodeURIComponent(
      customMessage || `Hi ${user.username}, this is GameFlex Admin.`,
    );
    const whatsappUrl = `https://wa.me/${phone}?text=${text}`;

    // Log the outreach
    supabase
      .from("whatsapp_messages")
      .insert({
        user_id: user.user_id,
        phone: user.phone,
        type: "promotion",
        message: customMessage || `Hi ${user.username}, this is GameFlex Admin.`,
        status: "sent",
      })
      .then(() => {
        toast.success("Opening WhatsApp...");
      });

    window.open(whatsappUrl, "_blank");
    setIsDialogOpen(false);
    setMessage("");
  };

  const openMessageDialog = (user: any) => {
    setSelectedUser(user);
    setMessage(`Hi ${user.username}, this is GameFlex Admin. `);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">User Management</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur">
              <div className="col-span-2">User</div>
              <div>Phone</div>
              <div>Balance</div>
              <div>Status</div>
              <div>Joined</div>
              <div>Actions</div>
            </div>
            {filteredUsers.map((user: any) => (
              <div
                key={user.id}
                className="grid grid-cols-7 gap-4 p-4 border-t border-border/50 items-center text-sm"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {(user.username ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email ?? "-"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{user.phone ?? "-"}</span>
                </div>
                <div className="font-semibold">
                  KES {Number(user.wallet_balance ?? 0).toLocaleString()}
                </div>
                <div>
                  <Badge variant={user.is_verified ? "default" : "secondary"}>
                    {user.is_verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10"
                    onClick={() => openWhatsAppChat(user)}
                    disabled={!user.phone}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Quick
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1 bg-[#25D366] hover:bg-[#25D366]/90 text-black font-semibold"
                    onClick={() => openMessageDialog(user)}
                    disabled={!user.phone}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Message Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Message {selectedUser?.username} on WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">Phone: {selectedUser?.phone}</div>
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => openWhatsAppChat(selectedUser, message)}
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
