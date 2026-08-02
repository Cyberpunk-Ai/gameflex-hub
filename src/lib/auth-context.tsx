// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { track } from "@/lib/analytics";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const generateReferralCode = useCallback((username?: string) => {
    const base = String(username ?? "")
      .replace(/[^A-Z0-9]/gi, "")
      .slice(0, 6)
      .toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${base || "GF"}${suffix}`.slice(0, 10);
  }, []);

  const getPendingReferralCode = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("gameflex_referral_code");
  }, []);

  const clearPendingReferralCode = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("gameflex_referral_code");
  }, []);

  const applyPendingReferral = useCallback(async (userId: string) => {
    const referralCode = getPendingReferralCode();
    if (!referralCode) return;

    const cleanCode = referralCode.trim();

    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("referral_code", cleanCode)
      .maybeSingle();

    if (referrerError || !referrer?.user_id || referrer.user_id === userId) {
      clearPendingReferralCode();
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", userId)
      .maybeSingle();

    if (existingError || existing) {
      clearPendingReferralCode();
      return;
    }

    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_id: referrer.user_id,
      referred_id: userId,
      status: "completed",
      bonus_claimed: false,
    });

    if (!insertError) {
      await supabase
        .from("profiles")
        .update({ referral_source: `ref_${cleanCode.toUpperCase()}` })
        .eq("user_id", userId);
    }

    clearPendingReferralCode();
  }, [clearPendingReferralCode, getPendingReferralCode]);

  const fetchProfile = useCallback(async (userId: string, metadata?: any) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      if (!data.referral_code) {
        const referral_code = generateReferralCode(data.username);
        await supabase.from("profiles").update({ referral_code }).eq("user_id", userId);
        setProfile({ ...data, referral_code });
        return { ...data, referral_code };
      }
      setProfile(data);
      return data;
    }

    const username = metadata?.username || `Player${Math.floor(1000 + Math.random() * 9000)}`;
    const profileData = {
      user_id: userId,
      username,
      email: metadata?.email ?? null,
      referral_code: generateReferralCode(username),
    };

    const { data: inserted } = await supabase
      .from("profiles")
      .insert(profileData)
      .select("*")
      .maybeSingle();

    setProfile(inserted ?? profileData);
    return inserted ?? profileData;
  }, [generateReferralCode]);

  const checkAdminRole = useCallback(async (userId: string, userEmail?: string | null) => {
    const SUPER_ADMIN_EMAILS = [
      "gameflex254@gmail.com",
      ((typeof process !== "undefined" && process.env?.DEFAULT_ADMIN_EMAIL) ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_DEFAULT_ADMIN_EMAIL) ||
      "").toLowerCase().trim(),
    ].filter(Boolean);

    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : "";
    const isSuperAdmin = cleanEmail !== "" && SUPER_ADMIN_EMAILS.includes(cleanEmail);

    if (isSuperAdmin) {
      setIsAdmin(true);
      // Auto-heal admin role in DB if missing/wiped
      try {
        await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      } catch (e) {
        // Even if DB fails or table is missing, super admin access is preserved in code
      }
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  }, []);

  useEffect(() => {
    let isActive = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        void Promise.all([
          fetchProfile(session.user.id),
          checkAdminRole(session.user.id, session.user.email),
          applyPendingReferral(session.user.id),
        ]);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        void Promise.all([
          fetchProfile(session.user.id),
          checkAdminRole(session.user.id, session.user.email),
          applyPendingReferral(session.user.id),
        ]);
      }

      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [applyPendingReferral, checkAdminRole, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error)
      void track("login", { method: email.includes("@gameflex.app") ? "phone" : "email" });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    username: string,
    referralCode?: string,
  ) => {
    if (typeof window !== "undefined" && referralCode) {
      localStorage.setItem("gameflex_referral_code", referralCode);
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
        },
      },
    });
    if (!error) void track("signup", { username });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    let { error } = await supabase.from("profiles").update(data).eq("user_id", user.id);

    if (
      error &&
      (error.message?.includes("column") ||
        error.message?.includes("schema cache") ||
        error.code === "PGRST204")
    ) {
      console.warn("Profile update schema fallback active:", error.message);
      const safeData: Record<string, any> = {};
      const safeKeys = [
        "username",
        "game_handle",
        "bio",
        "avatar_url",
        "phone",
        "referral_code",
        "updated_at",
      ];
      for (const k of safeKeys) {
        if (k in (data as any)) {
          safeData[k] = (data as any)[k];
        }
      }
      const retry = await supabase.from("profiles").update(safeData).eq("user_id", user.id);
      error = retry.error;
    }

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error: error ? new Error(error.message) : null };
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthenticated: !!user,
      isAdmin,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
    }),
    [user, session, profile, isLoading, isAdmin, login, register, logout, updateProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
