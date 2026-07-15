import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/command-palette";
import { GlobalHotkeys } from "@/components/global-hotkeys";
import { Onboarding } from "@/components/onboarding";
import { LanguageProvider, useT } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-provider";
import { NotificationsProvider } from "@/lib/notifications-provider";
import { WhatsNew } from "@/components/whats-new";
import { applyAppearanceClasses } from "@/lib/prefs";
import { bootstrapNativeShell } from "@/lib/capacitor";
import { registerServiceWorker } from "@/lib/pwa";
import { Home, Search, MessageSquare } from "lucide-react";

function NotFoundComponent() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-accent">
          {t("notfound.eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-6xl font-black uppercase tracking-tight text-white md:text-7xl">
          {t("notfound.title")}
        </h1>
        <p className="mt-4 text-sm text-stone-400">{t("notfound.body")}</p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          <QuickLink to="/" icon={<Home className="size-4" />} label={t("nav.home")} />
          <QuickLink to="/discover" icon={<Search className="size-4" />} label={t("nav.discover")} />
          <QuickLink to="/dm" icon={<MessageSquare className="size-4" />} label={t("nav.messages")} />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-mid px-3 py-4 text-stone-300 transition-all hover:border-accent/40 hover:text-white"
    >
      <span className="text-accent">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
    </Link>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: "Nexus — Voice & Chat for Gamers" },
      { name: "description", content: "A Discord-style app built for gamers. Every game is a hub with its own text and voice channels." },
      { name: "theme-color", content: "#0e1116" },
      { property: "og:title", content: "Nexus — Voice & Chat for Gamers" },
      { property: "og:description", content: "Every game is a hub. Text channels, voice nodes, live squads." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/icons/icon-512.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/icons/icon-512.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <NotificationsProvider>
            <LocalizedShell />
          </NotificationsProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function LocalizedShell() {
  const { t } = useT();
  useEffect(() => {
    applyAppearanceClasses();
    registerServiceWorker();
    void bootstrapNativeShell();
  }, []);
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-foreground ltr:focus:left-4 rtl:focus:right-4"
      >
        {t("nav.skip")}
      </a>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <GlobalHotkeys />
      <CommandPalette />
      <Onboarding />
      <WhatsNew />
      <Toaster
        theme="dark"
        position="top-center"
        offset={{ top: "max(12px, env(safe-area-inset-top))" }}
      />
    </>
  );
}
