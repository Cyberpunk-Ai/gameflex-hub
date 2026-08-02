import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { mediaService } from "@/services/media/MediaService";

export type MarketplaceListing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
export type MarketplaceListingInsert =
  Database["public"]["Tables"]["marketplace_listings"]["Insert"];

export interface ListingFilters {
  category?: string;
  search?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class MarketplaceService {
  async getListings(filters?: ListingFilters): Promise<MarketplaceListing[]> {
    try {
      let query = supabase
        .from("marketplace_listings")
        .select("*, profiles!inner(username, avatar_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters?.category) query = query.eq("category", filters.category as any);
      if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
      if (filters?.sellerId) query = query.eq("seller_id", filters.sellerId);
      if (filters?.minPrice) query = query.gte("price", filters.minPrice);
      if (filters?.maxPrice) query = query.lte("price", filters.maxPrice);

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketplaceListing[];
    } catch (err) {
      console.error("[MarketplaceService] getListings:", err);
      return [];
    }
  }

  async getById(id: string): Promise<MarketplaceListing | null> {
    try {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*, profiles!inner(username, avatar_url)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as MarketplaceListing;
    } catch (err) {
      return null;
    }
  }

  async createListing(
    data: Omit<MarketplaceListingInsert, "id" | "created_at" | "updated_at">,
  ): Promise<{ listing: MarketplaceListing | null; error?: string }> {
    try {
      const { data: result, error } = await supabase
        .from("marketplace_listings")
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return { listing: result as MarketplaceListing };
    } catch (err: any) {
      return { listing: null, error: err.message || String(err) };
    }
  }

  async updateListing(
    id: string,
    updates: Partial<MarketplaceListingInsert>,
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }

  async deleteListing(id: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
      if (error) throw error;
      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }

  async uploadListingImage(
    file: File,
    listingId: string,
  ): Promise<{ url: string; error?: string }> {
    const path = `listings/${listingId}/${Date.now()}-${file.name}`;
    const result = await mediaService.upload("marketplace", path, file);
    return { url: result.url, error: result.error };
  }

  async contactSeller(
    listingId: string,
    buyerId: string,
    message: string,
  ): Promise<{ error?: string }> {
    // Creates a conversation or sends a message to the seller
    try {
      const { data: listing } = await supabase
        .from("marketplace_listings")
        .select("seller_id")
        .eq("id", listingId)
        .single();
      if (!listing) return { error: "Listing not found" };

      // Check for existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${buyerId},participant2_id.eq.${listing.seller_id}),and(participant1_id.eq.${listing.seller_id},participant2_id.eq.${buyerId})`,
        )
        .single();

      let conversationId = existing?.id;

      if (!conversationId) {
        const { data: conv, error } = await supabase
          .from("conversations")
          .insert({ participant1_id: buyerId, participant2_id: listing.seller_id })
          .select("id")
          .single();
        if (error) throw error;
        conversationId = conv.id;
      }

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: buyerId,
        content: `Re listing #${listingId}: ${message}`,
      });

      return {};
    } catch (err: any) {
      return { error: err.message || String(err) };
    }
  }
}

export const marketplaceService = new MarketplaceService();
