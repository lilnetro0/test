import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
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
import { LanguageProvider, useT, ROUTE_TITLE_KEYS, translateStatic, LANG_LABELS, type Lang } from "@/lib/i18n";
import { resolveRequestLang } from "@/lib/resolve-request-lang";
import { AuthProvider } from "@/lib/auth-provider";
import { NotificationsProvider } from "@/lib/notifications-provider";
import { WhatsNew } from "@/components/whats-new";
import { applyAppearanceClasses } from "@/lib/prefs";
import { bootstrapNativeShell } from "@/lib/capacitor";
import { registerServiceWorker } from "@/lib/pwa";
import { assertProductionClientEnv } from "@/lib/supabase/env";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
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

  // errorComponent renders outside RootComponent's LanguageProvider.
  return (
    <LanguageProvider initialLang={resolveShellLang()}>
      <ErrorBody
        onRetry={() => {
          router.invalidate();
          reset();
        }}
      />
    </LanguageProvider>
  );
}

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("error.loadTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.loadBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("error.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("error.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const lang = resolveShellLang();
    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
        },
        { title: translateStatic("meta.title", undefined, lang) },
        { name: "description", content: translateStatic("meta.description", undefined, lang) },
        { name: "theme-color", content: "#0e1116" },
        { property: "og:title", content: translateStatic("meta.title", undefined, lang) },
        {
          property: "og:description",
          content: translateStatic("meta.description", undefined, lang),
        },
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
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const LANG_BOOTSTRAP = `(function(){try{var k='nexus.lang';var l=localStorage.getItem(k);if(!l){var m=document.cookie.match(/(?:^|; )nexus\\.lang=([^;]*)/);l=m?decodeURIComponent(m[1]):null;}if(!l){var n=(navigator.language||'').toLowerCase();if(n.indexOf('ar')===0)l='ar';}if(!l){try{var r=localStorage.getItem('nexus.region');var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';var menaTz={};['Asia/Riyadh','Asia/Dubai','Asia/Qatar','Asia/Kuwait','Asia/Bahrain','Asia/Muscat','Asia/Amman','Asia/Beirut','Asia/Baghdad','Africa/Cairo','Africa/Casablanca','Africa/Tunis','Africa/Algiers'].forEach(function(z){menaTz[z]=1;});if(r||menaTz[tz])l='ar';}catch(e2){}}if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';}}catch(e){}})();`;

/** AF16/AF21 — isomorphic cookie / Accept-Language (see resolve-request-lang). */
function resolveShellLang(): Lang {
  try {
    return resolveRequestLang();
  } catch {
    return "en";
  }
}

function RootShell({ children }: { children: ReactNode }) {
  const lang = resolveShellLang();
  const dir = LANG_LABELS[lang].dir;
  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
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
  const bootLang = resolveShellLang();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider initialLang={bootLang}>
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
  const { t, lang } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useKeyboardInset();
  useEffect(() => {
    assertProductionClientEnv();
    applyAppearanceClasses();
    registerServiceWorker();
    void bootstrapNativeShell();
  }, []);
  useEffect(() => {
    const key = ROUTE_TITLE_KEYS[pathname];
    if (key) {
      document.title = t(key);
    } else if (pathname.startsWith("/profile/")) {
      const username = decodeURIComponent(pathname.split("/")[2] ?? "");
      document.title = t("meta.page.profile", { username });
    } else {
      document.title = t("meta.title");
    }
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        pathname === "/discover" ? t("meta.page.discoverDesc") : t("meta.description"),
      );
    }
  }, [lang, t, pathname]);
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-foreground"
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
