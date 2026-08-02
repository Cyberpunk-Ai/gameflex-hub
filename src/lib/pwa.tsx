import { useEffect, useState, useCallback } from "react";

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null as any);
  const [hasInstallPrompt, setHasInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      // store locally and on window so other components/pages can access it
      setDeferredPrompt(e);
      setHasInstallPrompt(true);
      try {
        (window as any).__GAMEFLEX_DEFERRED_PROMPT = e;
      } catch (e) {}
    };
    window.addEventListener("beforeinstallprompt", handler as any);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    // iOS detection
    const ua = window.navigator.userAgent.toLowerCase();
    const ios =
      /ipad|iphone|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // detect standalone for iOS/Android
    const checkStandalone = () => {
      const ls = (() => {
        try {
          return localStorage.getItem("gameflex_installed");
        } catch (e) {
          return null;
        }
      })();
      if (ls) {
        setIsInstalled(true);
        return;
      }
      const standalone =
        (window.navigator as any).standalone ||
        window.matchMedia("(display-mode: standalone)").matches;
      setIsInstalled(!!standalone);
    };
    checkStandalone();

    window.addEventListener("load", checkStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("load", checkStandalone);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPrompt ?? (window as any).__GAMEFLEX_DEFERRED_PROMPT;
    if (!prompt) return null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setDeferredPrompt(null);
      try {
        (window as any).__GAMEFLEX_DEFERRED_PROMPT = null;
      } catch (e) {}
      if (choice?.outcome === "accepted") {
        try {
          localStorage.setItem("gameflex_installed", "1");
        } catch (e) {}
        setIsInstalled(true);
      }
      return choice;
    } catch (e) {
      setDeferredPrompt(null);
      try {
        (window as any).__GAMEFLEX_DEFERRED_PROMPT = null;
      } catch (e) {}
      return null;
    }
  }, [deferredPrompt]);

  const hideInstallLink = useCallback(() => {
    try {
      localStorage.setItem("gameflex_installed", "1");
    } catch (e) {}
    setIsInstalled(true);
  }, []);

  return {
    deferredPrompt,
    promptInstall,
    isInstalled,
    isIos,
    hideInstallLink,
    hasInstallPrompt,
  } as const;
}
