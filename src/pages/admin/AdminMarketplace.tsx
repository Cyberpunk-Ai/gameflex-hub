// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Store, Eye, Trash2, Ban, CheckCircle, ExternalLink } from "lucide-react";

export default function AdminMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedListing, setSelectedListing] = useState<any>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-marketplace-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("*")
        .limit(200)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ["sellers-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, email, phone")
        .limit(200);
      return data ?? [];
    },
  });

  const getSellerInfo = (sellerId: string) => sellers.find((s: any) => s.user_id === sellerId);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "sold" | "cancelled" }) => {
      const { error } = await supabase.from("marketplace_listings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-listings"] });
      toast({ title: "Listing Updated", description: "Status has been changed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-listings"] });
      setSelectedListing(null);
      toast({ title: "Listing Deleted", description: "Listing has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredListings = listings.filter((listing: any) => {
    const matchesSearch =
      listing.title?.toLowerCase().includes(search.toLowerCase()) ||
      listing.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    sold: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const categoryIcons: Record<string, string> = {
    account: "👤",
    items: "🎮",
    coaching: "🎯",
    other: "📦",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Marketplace Management</h1>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-4 p-4 bg-secondary/50 text-sm font-semibold text-muted-foreground sticky top-0 z-10 backdrop-blur">
              <div className="col-span-2">Listing</div>
              <div>Seller</div>
              <div>Category</div>
              <div>Price</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No listings found</div>
        ) : (
          filteredListings.map((listing: any) => {
            const seller = getSellerInfo(listing.seller_id);
            return (
              <div
                key={listing.id}
                className="grid grid-cols-7 gap-4 p-4 border-t border-border/50 items-center text-sm"
              >
                <div className="col-span-2 flex items-center gap-3">
                  {listing.image_url ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={listing.image_url}
                      alt={listing.title}
                      className="h-12 w-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-secondary rounded-lg flex items-center justify-center text-2xl">
                      {categoryIcons[listing.category]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold truncate max-w-48">{listing.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="truncate">{seller?.username || "Unknown"}</div>
                <div className="capitalize">{listing.category}</div>
                <div className="font-semibold">KES {Number(listing.price).toLocaleString()}</div>
                <div>
                  <Badge className={statusColors[listing.status] || ""}>{listing.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setSelectedListing(listing)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {listing.status === "active" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: listing.id, status: "cancelled" })
                      }
                    >
                      <Ban className="h-4 w-4 text-orange-400" />
                    </Button>
                  )}
                  {listing.status === "cancelled" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: listing.id, status: "active" })
                      }
                    >
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteListingMutation.mutate(listing.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
          </div>
        </div>
      </div>

      {/* Listing Detail Modal */}
      <Dialog open={!!selectedListing} onOpenChange={(open) => { if (!open) setSelectedListing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedListing?.title}</DialogTitle>
            <DialogDescription>Listing Details</DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              {selectedListing.image_url && (
                <img
                  loading="lazy"
                  decoding="async"
                  src={selectedListing.image_url}
                  alt={selectedListing.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-semibold capitalize">{selectedListing.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="font-semibold text-primary">
                    KES {Number(selectedListing.price).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={statusColors[selectedListing.status]}>
                    {selectedListing.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div>{new Date(selectedListing.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                <p className="text-sm">{selectedListing.description || "No description"}</p>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Seller</div>
                <div className="text-sm">
                  {(() => {
                    const seller = getSellerInfo(selectedListing.seller_id);
                    return seller
                      ? `${seller.username} (${seller.email || seller.phone || "No contact"})`
                      : "Unknown";
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
