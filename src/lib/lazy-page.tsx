import { lazy, Suspense } from "react";

const loadingFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
    </div>
  </div>
);

export function createLazyPage(loader: () => Promise<{ default: React.ComponentType<any> }>) {
  const LazyComponent = lazy(loader);

  return function LazyPage() {
    return (
      <Suspense fallback={loadingFallback}>
        <LazyComponent />
      </Suspense>
    );
  };
}
