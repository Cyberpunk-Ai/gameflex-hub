// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type SearchableEntity =
  "players" | "teams" | "creators" | "posts" | "tournaments" | "products" | "communities";

export interface SearchResult {
  id: string;
  type: SearchableEntity;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface ISearchProvider {
  search(
    query: string,
    options: { entities?: SearchableEntity[]; limit?: number },
  ): Promise<SearchResult[]>;
}

export class SupabaseSearchProvider implements ISearchProvider {
  async search(
    query: string,
    options: { entities?: SearchableEntity[]; limit?: number },
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const entities = options.entities || ["players", "tournaments"];
    const limit = options.limit || 10;

    // Concurrently search across requested entities
    const promises = [];

    if (entities.includes("players")) {
      promises.push(
        supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${query}%`)
          .limit(limit)
          .then(({ data }) => {
            (data || []).forEach((p) =>
              results.push({
                id: p.id,
                type: "players",
                title: p.username || "Unknown",
                imageUrl: p.avatar_url,
              }),
            );
          }),
      );
    }

    if (entities.includes("tournaments")) {
      promises.push(
        supabase
          .from("tournaments")
          .select("id, title, game_id")
          .ilike("title", `%${query}%`)
          .limit(limit)
          .then(({ data }) => {
            (data || []).forEach((t) =>
              results.push({
                id: t.id,
                type: "tournaments",
                title: t.title,
                subtitle: t.game_id,
              }),
            );
          }),
      );
    }

    // Additional entity searches would be added here

    await Promise.allSettled(promises);
    return results;
  }
}

export class SearchService {
  private provider: ISearchProvider;

  constructor(provider: ISearchProvider) {
    this.provider = provider;
  }

  setProvider(provider: ISearchProvider): void {
    this.provider = provider;
  }

  async search(
    query: string,
    entities?: SearchableEntity[],
    limit?: number,
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    return this.provider.search(query, { entities, limit });
  }

  async searchPlayers(query: string, limit?: number): Promise<SearchResult[]> {
    return this.search(query, ["players"], limit);
  }

  async searchTournaments(query: string, limit?: number): Promise<SearchResult[]> {
    return this.search(query, ["tournaments"], limit);
  }

  async searchProducts(query: string, limit?: number): Promise<SearchResult[]> {
    return this.search(query, ["products"], limit);
  }

  async getSuggestions(query: string, entity?: SearchableEntity): Promise<string[]> {
    if (!query || query.length < 2) return [];
    const results = await this.search(query, entity ? [entity] : undefined, 5);
    return results.map((r) => r.title);
  }
}

export const searchService = new SearchService(new SupabaseSearchProvider());
