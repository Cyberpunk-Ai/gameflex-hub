// @ts-nocheck
import { useEffect, useState } from "react";

export type Telemetry = {
  ready: boolean;
  vitals: { lcp: number | null; cls: number | null; inp: number | null; fcp: number | null; ttfb: number | null };
  nav: { dns: number; tcp: number; tls: number; ttfb: number; download: number; domReady: number; load: number };
  resources: { type: string; count: number; kb: number }[];
  totalKb: number;
  memory: { usedMb: number | null; limitMb: number | null; pct: number | null };
  network: {
    effectiveType: string;
    downlinkMbps: number | null;
    rttMs: number | null;
    saveData: boolean | null;
    online: boolean;
  };
  device: {
    platform: string;
    formFactor: string;
    cores: number | null;
    deviceMemoryGb: number | null;
    viewport: string;
    dpr: number;
    language: string;
    timezone: string;
    touch: boolean;
    reducedMotion: boolean;
  };
  longTasks: { count: number; totalMs: number };
};

const empty: Telemetry = {
  ready: false,
  vitals: { lcp: null, cls: null, inp: null, fcp: null, ttfb: null },
  nav: { dns: 0, tcp: 0, tls: 0, ttfb: 0, download: 0, domReady: 0, load: 0 },
  resources: [],
  totalKb: 0,
  memory: { usedMb: null, limitMb: null, pct: null },
  network: { effectiveType: "unknown", downlinkMbps: null, rttMs: null, saveData: null, online: true },
  device: {
    platform: "unknown",
    formFactor: "unknown",
    cores: null,
    deviceMemoryGb: null,
    viewport: "-",
    dpr: 1,
    language: "-",
    timezone: "-",
    touch: false,
    reducedMotion: false,
  },
  longTasks: { count: 0, totalMs: 0 },
};

function formFactor(ua: string) {
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function resourceType(entry: PerformanceResourceTiming) {
  const t = entry.initiatorType;
  if (t === "script") return "JavaScript";
  if (t === "link" || t === "css") return "CSS";
  if (t === "img" || t === "image") return "Images";
  if (t === "fetch" || t === "xmlhttprequest") return "API / XHR";
  if (t === "font") return "Fonts";
  return "Other";
}

/** Live client-side telemetry: Core Web Vitals, network, device, memory, long tasks. */
export function useTelemetry(): Telemetry {
  const [state, setState] = useState<Telemetry>(empty);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observers: PerformanceObserver[] = [];
    let cls = 0;
    let longTasks = { count: 0, totalMs: 0 };
    const vitals = { lcp: null, cls: null, inp: null, fcp: null, ttfb: null } as Telemetry["vitals"];

    const observe = (type: string, cb: (entries: any[]) => void, buffered = true) => {
      try {
        const po = new PerformanceObserver((list) => cb(list.getEntries()));
        po.observe({ type, buffered } as any);
        observers.push(po);
      } catch {
        /* unsupported entry type */
      }
    };

    observe("largest-contentful-paint", (e) => {
      const last = e[e.length - 1];
      if (last) vitals.lcp = Math.round(last.startTime);
    });
    observe("paint", (e) => {
      const fcp = e.find((x: any) => x.name === "first-contentful-paint");
      if (fcp) vitals.fcp = Math.round(fcp.startTime);
    });
    observe("layout-shift", (e) => {
      e.forEach((x: any) => {
        if (!x.hadRecentInput) cls += x.value;
      });
      vitals.cls = Math.round(cls * 1000) / 1000;
    });
    observe("event", (e) => {
      const worst = Math.max(...e.map((x: any) => x.duration ?? 0), vitals.inp ?? 0);
      if (Number.isFinite(worst) && worst > 0) vitals.inp = Math.round(worst);
    });
    observe("longtask", (e) => {
      longTasks = {
        count: longTasks.count + e.length,
        totalMs: Math.round(longTasks.totalMs + e.reduce((s: number, x: any) => s + x.duration, 0)),
      };
    });

    const collect = () => {
      const [n] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const nav = n
        ? {
            dns: Math.round(n.domainLookupEnd - n.domainLookupStart),
            tcp: Math.round(n.connectEnd - n.connectStart),
            tls: Math.round(n.secureConnectionStart ? n.connectEnd - n.secureConnectionStart : 0),
            ttfb: Math.round(n.responseStart - n.requestStart),
            download: Math.round(n.responseEnd - n.responseStart),
            domReady: Math.round(n.domContentLoadedEventEnd - n.startTime),
            load: Math.round((n.loadEventEnd || n.responseEnd) - n.startTime),
          }
        : empty.nav;
      if (n) vitals.ttfb = nav.ttfb;

      const grouped: Record<string, { count: number; bytes: number }> = {};
      let totalBytes = 0;
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).forEach((r) => {
        const k = resourceType(r);
        const bytes = r.transferSize || r.encodedBodySize || 0;
        grouped[k] = { count: (grouped[k]?.count ?? 0) + 1, bytes: (grouped[k]?.bytes ?? 0) + bytes };
        totalBytes += bytes;
      });

      const mem = (performance as any).memory;
      const conn = (navigator as any).connection ?? {};
      const ua = navigator.userAgent;

      setState({
        ready: true,
        vitals: { ...vitals },
        nav,
        resources: Object.entries(grouped)
          .map(([type, v]) => ({ type, count: v.count, kb: Math.round(v.bytes / 1024) }))
          .sort((a, b) => b.kb - a.kb),
        totalKb: Math.round(totalBytes / 1024),
        memory: mem
          ? {
              usedMb: Math.round(mem.usedJSHeapSize / 1048576),
              limitMb: Math.round(mem.jsHeapSizeLimit / 1048576),
              pct: Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100),
            }
          : empty.memory,
        network: {
          effectiveType: conn.effectiveType ?? "unknown",
          downlinkMbps: conn.downlink ?? null,
          rttMs: conn.rtt ?? null,
          saveData: conn.saveData ?? null,
          online: navigator.onLine,
        },
        device: {
          platform: (navigator as any).userAgentData?.platform || navigator.platform || "unknown",
          formFactor: formFactor(ua),
          cores: navigator.hardwareConcurrency ?? null,
          deviceMemoryGb: (navigator as any).deviceMemory ?? null,
          viewport: `${window.innerWidth}×${window.innerHeight}`,
          dpr: Math.round(window.devicePixelRatio * 100) / 100,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          touch: navigator.maxTouchPoints > 0,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        },
        longTasks,
      });
    };

    collect();
    const id = window.setInterval(collect, 5000);
    return () => {
      window.clearInterval(id);
      observers.forEach((o) => o.disconnect());
      window.clearInterval(id);
    };
  }, []);

  return state;
}
