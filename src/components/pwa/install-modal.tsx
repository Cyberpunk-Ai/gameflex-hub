import React, { useEffect } from "react";
import { usePWA } from "@/lib/pwa";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@/lib/router-compat";

export function InstallModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { deferredPrompt, promptInstall, isInstalled, hideInstallLink, isIos } = usePWA();
  const navigate = useNavigate();

  useEffect(() => {
    // auto-prompt when modal opens and a deferred prompt exists
    const promptAvailable = deferredPrompt || (window as any).__GAMEFLEX_DEFERRED_PROMPT;
    if (open && promptAvailable) {
      (async () => {
        const res = await promptInstall();
        if (res?.outcome === "accepted") {
          try {
            hideInstallLink();
          } catch (e) {}
          onOpenChange(false);
          // navigate to root; installed apps will open from Home Screen.
          navigate("/");
        }
      })();
    }
  }, [open, deferredPrompt, promptInstall, hideInstallLink, navigate, onOpenChange]);

  if (!open) return null;

  const promptAvailable = !!deferredPrompt || !!(window as any).__GAMEFLEX_DEFERRED_PROMPT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Install GameFlex</h3>
            <p className="text-sm text-muted-foreground">
              Add GameFlex to your device for a faster, native-like experience.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {!isIos && !promptAvailable && (
            <p className="text-sm text-muted-foreground">
              Your browser doesn't support the direct install prompt. Use the browser menu and
              choose "Install" or "Add to Home Screen".
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isIos ? (
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Show iOS Guide
            </Button>
          ) : promptAvailable ? (
            <Button
              onClick={async () => {
                const res = await promptInstall();
                if (res?.outcome === "accepted") {
                  try {
                    hideInstallLink();
                  } catch (e) {}
                  onOpenChange(false);
                  navigate("/");
                }
              }}
            >
              Install
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Got it</Button>
          )}
        </div>
      </div>
    </div>
  );
}
