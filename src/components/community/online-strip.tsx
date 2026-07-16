import type { MemberInfo } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function OnlineStrip({ online }: { online: MemberInfo[] }) {
  const { t } = useT();
  const shown = online.slice(0, 8);
  const overflow = Math.max(0, online.length - shown.length);

  return (
    <section className="px-4 pt-4" aria-label={t("community.whoOnline")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="nx-label text-stone-400">{t("community.whoOnline")}</h2>
        <span className="nx-caption text-online">{online.length}</span>
      </div>
      {online.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">{t("community.onlineEmpty")}</p>
      ) : (
        <ul className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {shown.map((m) => (
            <li key={m.userId ?? m.name} className="flex shrink-0 flex-col items-center gap-1">
              <span
                className="grid size-11 place-items-center rounded-full border border-online/40 bg-online/15 text-xs font-semibold text-online"
                title={m.name}
              >
                {initials(m.name)}
              </span>
              <span className="max-w-14 truncate text-[10px] text-stone-400" dir="auto">
                {m.name}
              </span>
            </li>
          ))}
          {overflow > 0 && (
            <li className="grid size-11 shrink-0 place-items-center rounded-full border border-border-subtle bg-white/5 text-xs text-stone-400">
              +{overflow}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
