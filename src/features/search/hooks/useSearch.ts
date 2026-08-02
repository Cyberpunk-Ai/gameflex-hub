import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

export function useSearch() {
  const [query, setQuery] = useState("");

  const searchQuery = useQuery({
    queryKey: QUERY_KEYS.search.results(query),
    queryFn: async () => {
      if (!query) return [];
      // @ts-ignore
      const { searchService } = await import("@/services/search/SearchService");
      return searchService.search(query);
    },
    enabled: query.length > 2,
  });

  return {
    query,
    setQuery,
    results: searchQuery.data || [],
    isLoading: searchQuery.isLoading,
  };
}
