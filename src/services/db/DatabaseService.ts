import { supabase } from "@/integrations/supabase/client";

export interface IDatabaseService {
  select<T = any>(table: string, query?: any): Promise<{ data: T[] | null; error: any }>;
  selectOne<T = any>(table: string, id: string): Promise<{ data: T | null; error: any }>;
  insert<T = any>(table: string, payload: any): Promise<{ data: T | null; error: any }>;
  update<T = any>(table: string, id: string, payload: any): Promise<{ data: T | null; error: any }>;
  delete(table: string, id: string): Promise<{ error: any }>;
}

export class SupabaseDatabaseService implements IDatabaseService {
  async select<T = any>(table: string, query?: any): Promise<{ data: T[] | null; error: any }> {
    try {
      let q = supabase.from(table as any).select(query?.select || "*");
      if (query?.eq) {
        Object.entries(query.eq).forEach(([k, v]) => {
          q = q.eq(k, v as any);
        });
      }
      if (query?.order) {
        q = q.order(query.order.column, { ascending: query.order.ascending ?? true });
      }
      if (query?.limit) {
        q = q.limit(query.limit);
      }
      const { data, error } = await q;
      return { data: (data as unknown) as T[], error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async selectOne<T = any>(table: string, id: string): Promise<{ data: T | null; error: any }> {
    try {
      const { data, error } = await supabase.from(table as any).select("*").eq("id", id).maybeSingle();
      return { data: (data as unknown) as T, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async insert<T = any>(table: string, payload: any): Promise<{ data: T | null; error: any }> {
    try {
      const { data, error } = await supabase.from(table as any).insert(payload).select().single();
      return { data: (data as unknown) as T, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async update<T = any>(table: string, id: string, payload: any): Promise<{ data: T | null; error: any }> {
    try {
      const { data, error } = await supabase.from(table as any).update(payload).eq("id", id).select().single();
      return { data: (data as unknown) as T, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async delete(table: string, id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      return { error };
    } catch (err) {
      return { error: err };
    }
  }
}

/**
 * Custom VPS REST API Database Adapter
 * Serves as a gateway when pointing to a custom backend on VPS or Contabo
 */
export class RESTDatabaseService implements IDatabaseService {
  private apiBase: string;

  constructor() {
    this.apiBase =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
      (typeof process !== "undefined" && process.env?.API_URL) ||
      "/api";
  }

  async select<T = any>(table: string, query?: any): Promise<{ data: T[] | null; error: any }> {
    try {
      const params = new URLSearchParams(query ? { q: JSON.stringify(query) } : {});
      const res = await fetch(`${this.apiBase}/${table}?${params.toString()}`);
      if (!res.ok) throw new Error(`Fetch failed for ${table}: ${res.statusText}`);
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async selectOne<T = any>(table: string, id: string): Promise<{ data: T | null; error: any }> {
    try {
      const res = await fetch(`${this.apiBase}/${table}/${id}`);
      if (!res.ok) throw new Error(`Fetch failed for ${table}/${id}`);
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async insert<T = any>(table: string, payload: any): Promise<{ data: T | null; error: any }> {
    try {
      const res = await fetch(`${this.apiBase}/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Insert failed for ${table}`);
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async update<T = any>(table: string, id: string, payload: any): Promise<{ data: T | null; error: any }> {
    try {
      const res = await fetch(`${this.apiBase}/${table}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update failed for ${table}/${id}`);
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async delete(table: string, id: string): Promise<{ error: any }> {
    try {
      const res = await fetch(`${this.apiBase}/${table}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed for ${table}/${id}`);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }
}

export function createDatabaseService(): IDatabaseService {
  const backendType = (
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_TYPE) ||
    (typeof process !== "undefined" && process.env?.BACKEND_TYPE) ||
    "supabase"
  )
    .toLowerCase()
    .trim();

  if (backendType === "rest" || backendType === "vps" || backendType === "custom") {
    return new RESTDatabaseService();
  }
  return new SupabaseDatabaseService();
}

export const databaseService = createDatabaseService();
