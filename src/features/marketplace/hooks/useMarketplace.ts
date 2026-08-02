import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { marketplaceService } from "@/services/marketplace/MarketplaceService";
import type { ListingFilters } from "@/services/marketplace/MarketplaceService";

export function useMarketplace(filters?: ListingFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.marketplace.listings, filters],
    queryFn: () => marketplaceService.getListings(filters),
  });
}

export function useMarketplaceListing(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.marketplace.detail(id),
    queryFn: () => marketplaceService.getById(id),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketplaceService.createListing.bind(marketplaceService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marketplace.listings });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketplaceService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marketplace.listings });
    },
  });
}

export function useContactSeller() {
  return useMutation({
    mutationFn: ({
      listingId,
      buyerId,
      message,
    }: {
      listingId: string;
      buyerId: string;
      message: string;
    }) => marketplaceService.contactSeller(listingId, buyerId, message),
  });
}
