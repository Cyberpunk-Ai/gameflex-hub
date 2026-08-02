import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Send, Loader2, Phone, Mail, Tag } from "lucide-react";

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    seller_id: string;
  } | null;
  seller: {
    user_id: string;
    username: string;
    avatar_url?: string;
    email?: string;
    phone?: string;
  } | null;
}

export function ContactSellerModal({ isOpen, onClose, listing, seller }: ContactSellerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user || !listing || !seller) throw new Error("Missing required data");

      // Create a notification for the seller
      const { error } = await supabase.from("notifications").insert({
        user_id: seller.user_id,
        type: "system",
        title: `Inquiry about "${listing.title}"`,
        message: `${user.email || "A user"} is interested in your listing: ${message}`,
        action_url: "/marketplace",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "The seller has been notified of your interest.",
      });
      setMessage("");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!listing || !seller) return null;

  const defaultMessage = `Hi! I'm interested in your listing "${listing.title}" priced at KES ${Number(listing.price).toLocaleString()}. Is it still available?`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Contact Seller
          </DialogTitle>
          <DialogDescription>Send a message to the seller about this listing</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Listing Preview */}
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{listing.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Tag className="h-3 w-3 text-primary" />
                  <span className="text-primary font-bold text-sm">
                    KES {Number(listing.price).toLocaleString()}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {listing.category}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={seller.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {(seller.username ?? "Seller").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{seller.username}</div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {seller.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {seller.email}
                  </div>
                )}
                {seller.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {seller.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Input */}
          {user ? (
            <div className="space-y-2">
              <Textarea
                placeholder={defaultMessage}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default message
              </p>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Please log in to contact the seller
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {user && (
            <Button
              onClick={() => sendMessageMutation.mutate()}
              disabled={sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
