import {
  Link as TLink,
  Outlet as TOutlet,
  useNavigate as tUseNavigate,
  useParams as tUseParams,
  useLocation as tUseLocation,
} from "@tanstack/react-router";
import { forwardRef, useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Compatibility shim so the ported react-router-dom v6 codebase keeps working
// on top of @tanstack/react-router. Re-exported under @/lib/router-compat.

export const Outlet = TOutlet;

type LinkBaseProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>;

export interface LinkProps extends LinkBaseProps {
  to: string;
  replace?: boolean;
  state?: unknown;
  className?: string;
  children?: ReactNode;
  preload?: false | "intent" | "viewport" | "render";
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, state, className, children, preload, ...rest }, ref) => {
    const props: Record<string, unknown> = {
      ...(rest as Record<string, unknown>),
      ...parsePath(to),
      replace,
      preload: preload ?? "intent",
      className,
      children,
      ref,
    };

    if (state !== undefined) props.state = state;
    // Cast: TanStack Link expects literal route paths; we accept any string.
    return <TLink {...(props as Record<string, unknown> as Parameters<typeof TLink>[0])} />;
  },
);
Link.displayName = "Link";

type NavLinkRender = { isActive: boolean; isPending: boolean };

export interface NavLinkProps extends LinkBaseProps {
  to: string;
  end?: boolean;
  className?: string | ((p: NavLinkRender) => string);
  children?: ReactNode | ((p: NavLinkRender) => ReactNode);
  activeClassName?: string;
  pendingClassName?: string;
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, end, className, children, activeClassName, pendingClassName, ...rest }, ref) => {
    const linkProps: Record<string, unknown> = {
      ...(rest as Record<string, unknown>),
      to,
      activeOptions: { exact: end ?? false },
      preload: "intent",
      ref,
    };
    return (
      <TLink {...(linkProps as Record<string, unknown> as Parameters<typeof TLink>[0])}>
        {
          ((state: { isActive?: boolean; isTransitioning?: boolean }) => {
            const renderState: NavLinkRender = {
              isActive: !!state?.isActive,
              isPending: !!state?.isTransitioning,
            };
            const cls =
              typeof className === "function"
                ? className(renderState)
                : cn(
                    className,
                    renderState.isActive && activeClassName,
                    renderState.isPending && pendingClassName,
                  );
            const kids = typeof children === "function" ? children(renderState) : children;
            return <span className={cls}>{kids}</span>;
          }) as never
        }
      </TLink>
    );
  },
);
NavLink.displayName = "NavLink";

export type NavigateFn = ((
  to: string,
  options?: { replace?: boolean; state?: unknown },
) => void) & {
  (delta: number): void;
};

// Splits a react-router style path ("/login?returnTo=/x#top") into the
// pathname / search / hash parts TanStack Router expects.
export function parsePath(to: string): {
  to: string;
  search?: Record<string, string>;
  hash?: string;
} {
  const [beforeHash, ...hashRest] = to.split("#");
  const hash = hashRest.join("#") || undefined;
  const [pathname, ...searchRest] = beforeHash.split("?");
  const searchStr = searchRest.join("?");
  let search: Record<string, string> | undefined;
  if (searchStr) {
    search = {};
    for (const [k, v] of new URLSearchParams(searchStr).entries()) search[k] = v;
  }
  return { to: pathname || "/", ...(search ? { search } : {}), ...(hash ? { hash } : {}) };
}

export function useNavigate(): NavigateFn {
  const navigate = tUseNavigate();
  return useCallback(
    ((toOrDelta: string | number, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof toOrDelta === "number") {
        // history delta — best-effort using window.history
        if (typeof window !== "undefined") window.history.go(toOrDelta);
        return;
      }
      navigate({
        ...parsePath(toOrDelta),
        replace: options?.replace,
        ...(options?.state !== undefined ? { state: options.state } : {}),
      } as never);

    }) as NavigateFn,
    [navigate],
  );
}


export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  const params = tUseParams({ strict: false });
  return (params ?? {}) as T;
}

export function useLocation() {
  const loc = tUseLocation();
  return useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.searchStr ?? "",
      hash: loc.hash ?? "",
      state: loc.state,
      key: loc.href,
    }),
    [loc.pathname, loc.searchStr, loc.hash, loc.state, loc.href],
  );
}

// react-router-dom v6 type re-exports used by the codebase
export type { NavLinkProps as RouterNavLinkProps };
