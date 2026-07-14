import { Link } from "@tanstack/react-router";
import logo from "@/assets/nexus-logo.png";
import { useT } from "@/lib/i18n";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border-subtle bg-surface-mid/40 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" width={28} height={28} className="size-7 object-contain" />
            <span className="font-display text-sm font-bold uppercase tracking-tight text-white">
              Nexus
            </span>
          </Link>
          <nav className="flex flex-wrap gap-3 text-xs font-semibold text-stone-400">
            <Link to="/terms" className="hover:text-accent">
              {t("legal.termsNav")}
            </Link>
            <Link to="/privacy" className="hover:text-accent">
              {t("legal.privacyNav")}
            </Link>
            <Link to="/cookies" className="hover:text-accent">
              {t("legal.cookiesNav")}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
          {t("legal.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-xs text-stone-500">{t("legal.updated", { date: updated })}</p>
        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
          {children}
        </div>
      </main>
      <footer className="border-t border-border-subtle px-6 py-8 text-center text-xs text-stone-500">
        <LegalLinks className="justify-center" />
        <p className="mt-3">
          © {new Date().getFullYear()} Nexus. {t("legal.footerTag")}
        </p>
      </footer>
    </div>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  const { t } = useT();
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 ${className}`}>
      <Link to="/terms" className="hover:text-accent">
        {t("legal.termsNav")}
      </Link>
      <Link to="/privacy" className="hover:text-accent">
        {t("legal.privacyNav")}
      </Link>
      <Link to="/cookies" className="hover:text-accent">
        {t("legal.cookiesNav")}
      </Link>
      <Link to="/help" className="hover:text-accent">
        {t("nav.help")}
      </Link>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-bold uppercase tracking-tight text-white">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-stone-400">{children}</div>
    </section>
  );
}
