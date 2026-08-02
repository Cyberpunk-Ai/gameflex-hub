import { Link, useLocation } from "@/lib/router-compat";
import { useEffect } from "react";
import { Home, LifeBuoy, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-background/90 p-10 text-center shadow-lg shadow-primary/5">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Search className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mb-3 text-3xl font-bold">We couldn’t find that page</h1>
        <p className="mb-8 text-muted-foreground">
          The route you tried to open may have moved, or it may never have existed. You can head
          home or browse help resources.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Home className="mr-2 h-4 w-4" />
            Return home
          </Link>
          <Link
            to="/support"
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
