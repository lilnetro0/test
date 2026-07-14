import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Command as CommandIcon, Keyboard, MessageSquare, Mic, Search, HelpCircle } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Shortcuts — Nexus" },
      { name: "description", content: "Keyboard shortcuts, tips, and getting-started guide for Nexus." },
    ],
  }),
  component: HelpPage,
});

const SHORTCUTS: { keys: string[]; labelKey: TKey }[] = [
  { keys: ["⌘", "K"], labelKey: "help.sc.palette" },
  { keys: ["/"], labelKey: "help.sc.composer" },
  { keys: ["Esc"], labelKey: "help.sc.escape" },
  { keys: ["G", "H"], labelKey: "help.sc.home" },
  { keys: ["G", "D"], labelKey: "help.sc.discover" },
  { keys: ["G", "M"], labelKey: "help.sc.dm" },
  { keys: ["G", "F"], labelKey: "help.sc.friends" },
  { keys: ["G", "S"], labelKey: "help.sc.settings" },
  { keys: ["Shift", "?"], labelKey: "help.sc.help" },
];

const TIPS: { icon: typeof MessageSquare; titleKey: TKey; bodyKey: TKey }[] = [
  { icon: MessageSquare, titleKey: "help.tip.reactions.title", bodyKey: "help.tip.reactions.body" },
  { icon: Mic, titleKey: "help.tip.voice.title", bodyKey: "help.tip.voice.body" },
  { icon: Search, titleKey: "help.tip.cmd.title", bodyKey: "help.tip.cmd.body" },
  { icon: CommandIcon, titleKey: "help.tip.dock.title", bodyKey: "help.tip.dock.body" },
];

function HelpPage() {
  const { t } = useT();
  return (
    <AppShell>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <header className="border-b border-border-subtle px-6 py-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                <HelpCircle className="size-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                  {t("help.title")}
                </h1>
                <p className="text-xs text-stone-500">{t("help.subtitle")}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-10 px-6 py-8">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-stone-400">
              <Keyboard className="size-3.5" /> {t("help.shortcuts")}
            </h2>
            <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-surface-mid">
              {SHORTCUTS.map((s) => (
                <div key={s.labelKey} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-stone-200">{t(s.labelKey)}</span>
                  <div className="flex gap-1.5">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="min-w-7 rounded-md border border-border-subtle bg-background px-2 py-0.5 text-center font-mono text-[11px] font-semibold text-stone-300"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-stone-400">
              {t("help.tips")}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {TIPS.map((tip) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={tip.titleKey}
                    className="rounded-xl border border-border-subtle bg-surface-mid p-4"
                  >
                    <div className="mb-2 grid size-8 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-tight text-white">
                      {t(tip.titleKey)}
                    </h3>
                    <p className="mt-1 text-xs text-stone-400">{t(tip.bodyKey)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-gradient-to-br from-accent/10 via-transparent to-transparent p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">
              {t("help.stuck.title")}
            </h2>
            <p className="mt-1 text-sm text-stone-400">{t("help.stuck.body")}</p>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
