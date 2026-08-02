// @ts-nocheck
import React, { useState } from "react";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Store, Plus, Search, User, Tag, MessageCircle, Loader2 } from "lucide-react";
import { ContactSellerModal } from "@/components/contact-seller-modal";
import { mockMarketplaceListings } from "@/lib/mock-data";

const categoryIcons: Record<string, string> = {
  account: "👤",
  items: "🎮",
  coaching: "🎯",
  other: "📦",
};

const Marketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contactListing, setContactListing] = useState<any>(null);
  const [contactSeller, setContactSeller] = useState<any>(null);

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    category: "other" as "account" | "items" | "coaching" | "other",
    price: "",
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("marketplace_listings")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) return data;
      } catch (e) {
        console.warn("Marketplace fallback active");
      }
      return mockMarketplaceListings.map((m) => ({
        id: m.id,
        user_id: m.sellerId,
        seller_id: m.sellerId,
        title: m.title,
        description: m.description,
        category: m.category === "accounts" ? "account" : "items",
        price: m.price,
        image_url: m.imageUrl,
        status: m.status,
        created_at: m.createdAt.toISOString(),
      }));
    },
  });

  const { data: sellers } = useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, email, phone")
        .limit(200);
      return data || [];
    },
  });

  const handleContactSeller = (listing: any) => {
    const seller = getSellerInfo(listing.seller_id);
    setContactListing(listing);
    setContactSeller(seller);
  };

  const getSellerInfo = (sellerId: string) => {
    return sellers?.find((s) => s.user_id === sellerId);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `marketplace/${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage.from("tournament-images").upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("tournament-images").getPublicUrl(fileName);

    return publicUrl;
  };

  const createListingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from("marketplace_listings").insert({
        seller_id: user.id,
        title: newListing.title,
        description: newListing.description,
        category: newListing.category,
        price: parseFloat(newListing.price),
        image_url: imageUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      setIsCreating(false);
      setNewListing({ title: "", description: "", category: "other", price: "" });
      setImageFile(null);
      toast({
        title: "Listing Created",
        description: "Your item is now listed on the marketplace.",
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

  const filteredListings = listings?.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || listing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold font-display">Marketplace</h1>
              <p className="text-muted-foreground">Buy and sell gaming items</p>
            </div>
          </div>
          {user && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Listing</DialogTitle>
                  <DialogDescription>List your item on the marketplace</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newListing.title}
                      onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                      placeholder="What are you selling?"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="listing-image">Image</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="listing-image"
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
                          className="h-12 w-12 object-cover rounded"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newListing.category}
                      onValueChange={(value: "account" | "items" | "coaching" | "other") =>
                        setNewListing({ ...newListing, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="items">In-Game Items</SelectItem>
                        <SelectItem value="coaching">Coaching</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (KES)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newListing.price}
                      onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newListing.description}
                      onChange={(e) =>
                        setNewListing({ ...newListing, description: e.target.value })
                      }
                      placeholder="Describe your item..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={() => createListingMutation.mutate()}
                    disabled={
                      createListingMutation.isPending || !newListing.title || !newListing.price
                    }
                    className="w-full"
                  >
                    {createListingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Listing"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="account">Accounts</SelectItem>
                  <SelectItem value="items">In-Game Items</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading listings...</p>
          </div>
        ) : filteredListings && filteredListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing: any) => {
              const seller = getSellerInfo(listing.seller_id);
              return (
                <Card
                  key={listing.id}
                  className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {listing.image_url && (
                    <div className="h-40 overflow-hidden">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={optimizeImageUrl(listing.image_url, { width: 500, quality: 75 })}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{listing.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3" />
                          {seller?.username || "Unknown Seller"}
                        </CardDescription>
                      </div>
                      <span className="text-2xl">{categoryIcons[listing.category]}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {listing.description || "No description provided"}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant="outline">{listing.category}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">
                        KES {Number(listing.price).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContactSeller(listing)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== "all"
                  ? "No listings found matching your criteria"
                  : "No listings yet. Be the first to sell something!"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Seller Modal */}
        <ContactSellerModal
          isOpen={!!contactListing}
          onClose={() => {
            setContactListing(null);
            setContactSeller(null);
          }}
          listing={contactListing}
          seller={contactSeller}
        />
      </div>
    </div>
  );
};

export default Marketplace;
