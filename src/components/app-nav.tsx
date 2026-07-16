import { useNavigate } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * In-app navigation without `<a href>` semantics.
 * Use for dock tabs, cards, chrome, and CTAs so iOS WKWebView does not show
 * Open Link / Copy Link / Share with the deployment domain on long-press.
 *
 * Prefer real `<Link>` / `<a>` only for external, mailto, or intentionally shareable URLs.
 */
export function AppNav({
  to,
  params,
  search,
  hash,
  replace,
  resetScroll,
  onClick,
  className,
  children,
  type = "button",
  ...rest
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  hash?: string;
  replace?: boolean;
  resetScroll?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    type?: "button" | "submit" | "reset";
  }) {
  const navigate = useNavigate();

  const go = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    void navigate({
      // TanStack route map is wider than string; callers pass app paths.
      to: to as never,
      params: params as never,
      search: search as never,
      hash,
      replace,
      resetScroll,
    });
  };

  return (
    <button type={type} onClick={go} className={cn(className)} {...rest}>
      {children}
    </button>
  );
}
