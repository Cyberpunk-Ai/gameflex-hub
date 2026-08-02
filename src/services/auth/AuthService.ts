import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export const SUPER_ADMIN_EMAILS = [
  "gameflex254@gmail.com",
  ((typeof process !== "undefined" && process.env?.DEFAULT_ADMIN_EMAIL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_DEFAULT_ADMIN_EMAIL) ||
  "").toLowerCase().trim(),
].filter(Boolean);

export class AuthService {
  isSuperAdmin(email?: string | null): boolean {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return SUPER_ADMIN_EMAILS.includes(clean);
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ data: { session: Session | null; user: User | null } | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err: any) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async signUp(
    email: string,
    password: string,
    username: string,
  ): Promise<{ data: { session: Session | null; user: User | null } | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      return { data, error };
    } catch (err: any) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out", err);
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async updatePassword(password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (err) {
      console.error("Error getting session", err);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch (err) {
      console.error("Error getting current user", err);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);
    return () => {
      subscription.unsubscribe();
    };
  }
}

export const authService = new AuthService();

