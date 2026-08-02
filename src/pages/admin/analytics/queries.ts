// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

const sum = (rows?: any[], key = "amount") =>
  rows?.reduce((s, r) => s + Number(r[key] ?? 0), 0) ?? 0;

const uniq = (rows?: any[], key = "user_id") =>
  new Set((rows ?? []).map((r) => r[key]).filter(Boolean)).size;

const pct = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

/** Executive KPIs with period-over-period deltas. */
export function useKpis(days: number) {
  return useQuery({
    queryKey: ["analytics", "kpis", days],
    refetchInterval: 60_000,
    queryFn: async () => {
      const now = Date.now();
      const start = subDays(new Date(), days).toISOString();
      const prevStart = subDays(new Date(), days * 2).toISOString();
      const dayAgo = subDays(new Date(), 1).toISOString();
      const liveWindow = new Date(now - 30 * 60 * 1000).toISOString();

      const [
        totalUsers,
        newUsers,
        prevNewUsers,
        live,
        payCurr,
        payPrev,
        payToday,
        regsCurr,
        regsPrev,
        regsLive,
        matches,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("id").gte("created_at", start),
        supabase.from("profiles").select("id").gte("created_at", prevStart).lt("created_at", start),
        supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("payments").select("amount, user_id").eq("status", "verified").gte("created_at", start),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "verified")
          .gte("created_at", prevStart)
          .lt("created_at", start),
        supabase.from("payments").select("amount").eq("status", "verified").gte("created_at", dayAgo),
        supabase.from("registrations").select("user_id").gte("created_at", start),
        supabase
          .from("registrations")
          .select("user_id")
          .gte("created_at", prevStart)
          .lt("created_at", start),
        supabase.from("registrations").select("user_id").gte("created_at", liveWindow),
        supabase.from("matches").select("*", { count: "exact", head: true }),
      ]);

      const revenue = sum(payCurr.data);
      const revenuePrev = sum(payPrev.data);
      const activeUsers = uniq(regsCurr.data);
      const activeUsersPrev = uniq(regsPrev.data);
      const payers = uniq(payCurr.data);
      const total = totalUsers.count ?? 0;

      return {
        totalUsers: total,
        newUsers: newUsers.data?.length ?? 0,
        newUsersDelta: pct(newUsers.data?.length ?? 0, prevNewUsers.data?.length ?? 0),
        usersOnline: uniq(regsLive.data),
        liveTournaments: live.count ?? 0,
        matches: matches.count ?? 0,
        revenue,
        revenueDelta: pct(revenue, revenuePrev),
        revenueToday: sum(payToday.data),
        activeUsers,
        activeDelta: pct(activeUsers, activeUsersPrev),
        engagementRate: total > 0 ? Math.round((activeUsers / total) * 100) : 0,
        conversionRate: activeUsers > 0 ? Math.round((payers / activeUsers) * 100) : 0,
        arpu: total > 0 ? revenue / total : 0,
        arppu: payers > 0 ? revenue / payers : 0,
        payers,
      };
    },
  });
}

/** Daily revenue + signups + joins time series. */
export function useTrends(days: number) {
  return useQuery({
    queryKey: ["analytics", "trends", days],
    queryFn: async () => {
      const start = subDays(new Date(), days).toISOString();
      const [pay, prof, regs] = await Promise.all([
        supabase.from("payments").select("amount, created_at").eq("status", "verified").gte("created_at", start),
        supabase.from("profiles").select("created_at").gte("created_at", start),
        supabase.from("registrations").select("created_at").gte("created_at", start),
      ]);

      const keys: string[] = [];
      for (let i = days - 1; i >= 0; i--) keys.push(format(subDays(new Date(), i), "MMM dd"));
      const mk = () => Object.fromEntries(keys.map((k) => [k, 0]));
      const rev = mk();
      const signups = mk();
      const joins = mk();

      pay.data?.forEach((p: any) => {
        const k = format(new Date(p.created_at), "MMM dd");
        if (rev[k] !== undefined) rev[k] += Number(p.amount ?? 0);
      });
      prof.data?.forEach((p: any) => {
        const k = format(new Date(p.created_at), "MMM dd");
        if (signups[k] !== undefined) signups[k] += 1;
      });
      regs.data?.forEach((r: any) => {
        const k = format(new Date(r.created_at), "MMM dd");
        if (joins[k] !== undefined) joins[k] += 1;
      });

      return {
        revenue: keys.map((k) => ({ name: k, value: rev[k] })),
        growth: keys.map((k) => ({ name: k, value: signups[k], secondary: joins[k] })),
        joins: keys.map((k) => ({ name: k, value: joins[k] })),
      };
    },
  });
}

/** Retention cohorts: DAU/WAU/MAU + stickiness. */
export function useRetention() {
  return useQuery({
    queryKey: ["analytics", "retention"],
    refetchInterval: 120_000,
    queryFn: async () => {
      const [d1, d7, d30] = await Promise.all([
        supabase.from("registrations").select("user_id").gte("created_at", subDays(new Date(), 1).toISOString()),
        supabase.from("registrations").select("user_id").gte("created_at", subDays(new Date(), 7).toISOString()),
        supabase.from("registrations").select("user_id").gte("created_at", subDays(new Date(), 30).toISOString()),
      ]);
      const dau = uniq(d1.data);
      const wau = uniq(d7.data);
      const mau = uniq(d30.data);
      return {
        dau,
        wau,
        mau,
        stickiness: mau > 0 ? Math.round((dau / mau) * 100) : 0,
        weeklyRetention: mau > 0 ? Math.round((wau / mau) * 100) : 0,
      };
    },
  });
}

/** Signup activity by hour of day (last 30d) — peak-load planning. */
export function useHourlyActivity() {
  return useQuery({
    queryKey: ["analytics", "hourly"],
    queryFn: async () => {
      const start = subDays(new Date(), 30).toISOString();
      const { data } = await supabase.from("registrations").select("created_at").gte("created_at", start);
      const buckets = Array.from({ length: 24 }, (_, h) => ({ name: `${String(h).padStart(2, "0")}h`, value: 0 }));
      data?.forEach((r: any) => {
        const h = new Date(r.created_at).getHours();
        buckets[h].value += 1;
      });
      return buckets;
    },
  });
}

/** Breakdown lists: games, countries, acquisition channels. */
export function useSegments(days: number) {
  return useQuery({
    queryKey: ["analytics", "segments", days],
    queryFn: async () => {
      const start = subDays(new Date(), days).toISOString();
      const [regs, countries, sources] = await Promise.all([
        supabase.from("registrations").select("tournaments(game)").gte("created_at", start),
        supabase.from("profiles").select("country").gte("created_at", start).not("country", "is", null),
        supabase.from("profiles").select("referral_source").not("referral_source", "is", null).limit(2000),
      ]);

      const tally = (rows: any[], pick: (r: any) => string) => {
        const c: Record<string, number> = {};
        rows?.forEach((r) => {
          const k = pick(r) || "Unknown";
          c[k] = (c[k] ?? 0) + 1;
        });
        return Object.entries(c)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }));
      };

      return {
        games: tally(regs.data ?? [], (r) => r.tournaments?.game),
        countries: tally(countries.data ?? [], (r) => r.country),
        acquisition: tally(sources.data ?? [], (r) => r.referral_source),
      };
    },
  });
}

/** Revenue leaders: tournaments and spenders. */
export function useRevenueLeaders() {
  return useQuery({
    queryKey: ["analytics", "revenue-leaders"],
    queryFn: async () => {
      const [tour, pay] = await Promise.all([
        supabase
          .from("tournaments")
          .select("id, title, game, entry_fee, current_participants, prize_pool, status")
          .order("current_participants", { ascending: false })
          .limit(8),
        supabase.from("payments").select("user_id, amount, status, created_at"),
      ]);

      const verified = (pay.data ?? []).filter((p: any) => p.status === "verified");
      const totals: Record<string, number> = {};
      verified.forEach((p: any) => {
        totals[p.user_id] = (totals[p.user_id] ?? 0) + Number(p.amount ?? 0);
      });
      const top = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      let spenders: { name: string; value: number }[] = [];
      if (top.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", top.map(([id]) => id));
        const names = new Map((profs ?? []).map((p: any) => [p.user_id, p.username]));
        spenders = top.map(([id, value]) => ({ name: names.get(id) ?? "Unknown", value }));
      }

      const byStatus: Record<string, number> = {};
      (pay.data ?? []).forEach((p: any) => {
        byStatus[p.status ?? "unknown"] = (byStatus[p.status ?? "unknown"] ?? 0) + 1;
      });

      return {
        tournaments: (tour.data ?? []).map((t: any) => ({
          ...t,
          revenue: Number(t.entry_fee ?? 0) * Number(t.current_participants ?? 0),
        })),
        spenders,
        paymentStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        verifiedCount: verified.length,
        totalCount: pay.data?.length ?? 0,
      };
    },
  });
}

/** Data-layer health: table reachability + query latency. */
export function useDataHealth() {
  return useQuery({
    queryKey: ["analytics", "data-health"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const tables = ["profiles", "tournaments", "registrations", "payments", "matches", "notifications"];
      return Promise.all(
        tables.map(async (table) => {
          const t0 = performance.now();
          const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
          return {
            table,
            latency: Math.round(performance.now() - t0),
            rows: count ?? 0,
            ok: !error,
            error: error?.message ?? null,
          };
        }),
      );
    },
  });
}
