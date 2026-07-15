/**
 * Per-game hero art for Discover tiles.
 * CSS-only atmospheric panels — no stock photos required.
 * Keys are **catalog `games.id`** (not hub slug). See docs/DOMAIN-MODEL.md.
 */

const HERO: Record<
  string,
  { from: string; via: string; to: string; pattern: string; accent: string }
> = {
  fortnite: {
    from: "from-violet-600/50",
    via: "via-fuchsia-500/20",
    to: "to-cyan-400/30",
    pattern:
      "bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.12)_0,transparent_40%),radial-gradient(circle_at_80%_20%,rgba(0,240,255,0.2)_0,transparent_35%)]",
    accent: "text-fuchsia-200",
  },
  valorant: {
    from: "from-rose-700/55",
    via: "via-red-900/30",
    to: "to-zinc-900/40",
    pattern:
      "bg-[linear-gradient(135deg,transparent_40%,rgba(255,70,85,0.25)_40%,rgba(255,70,85,0.25)_42%,transparent_42%),linear-gradient(45deg,transparent_60%,rgba(255,255,255,0.06)_60%)]",
    accent: "text-rose-200",
  },
  lol: {
    from: "from-amber-600/40",
    via: "via-yellow-700/25",
    to: "to-blue-900/40",
    pattern:
      "bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.35)_0,transparent_55%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.25)_0,transparent_45%)]",
    accent: "text-amber-200",
  },
  cs2: {
    from: "from-orange-700/45",
    via: "via-amber-900/20",
    to: "to-stone-900/50",
    pattern:
      "bg-[repeating-linear-gradient(90deg,transparent,transparent_12px,rgba(255,255,255,0.03)_12px,rgba(255,255,255,0.03)_13px)]",
    accent: "text-orange-200",
  },
  minecraft: {
    from: "from-emerald-700/45",
    via: "via-lime-800/25",
    to: "to-stone-900/40",
    pattern:
      "bg-[linear-gradient(90deg,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[length:16px_16px]",
    accent: "text-emerald-200",
  },
  apex: {
    from: "from-red-600/50",
    via: "via-orange-700/25",
    to: "to-zinc-900/45",
    pattern:
      "bg-[conic-gradient(from_210deg_at_70%_30%,rgba(255,80,40,0.35),transparent_40%)]",
    accent: "text-red-200",
  },
  rocket: {
    from: "from-sky-600/45",
    via: "via-blue-700/25",
    to: "to-orange-500/20",
    pattern:
      "bg-[radial-gradient(circle_at_30%_70%,rgba(56,189,248,0.4)_0,transparent_40%),radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.3)_0,transparent_35%)]",
    accent: "text-sky-200",
  },
  overwatch: {
    from: "from-orange-500/45",
    via: "via-amber-600/20",
    to: "to-slate-800/40",
    pattern:
      "bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.25)_0,transparent_55%)]",
    accent: "text-orange-100",
  },
  dota2: {
    from: "from-red-800/50",
    via: "via-rose-900/30",
    to: "to-stone-950/50",
    pattern:
      "bg-[radial-gradient(ellipse_at_bottom,rgba(185,28,28,0.4)_0,transparent_60%)]",
    accent: "text-red-200",
  },
  cod: {
    from: "from-lime-700/40",
    via: "via-olive-900/30",
    to: "to-zinc-900/50",
    pattern:
      "bg-[repeating-linear-gradient(-45deg,transparent,transparent_8px,rgba(163,230,53,0.06)_8px,rgba(163,230,53,0.06)_16px)]",
    accent: "text-lime-200",
  },
  elden: {
    from: "from-yellow-800/40",
    via: "via-amber-950/30",
    to: "to-stone-950/50",
    pattern:
      "bg-[radial-gradient(ellipse_at_top,rgba(202,138,4,0.35)_0,transparent_50%)]",
    accent: "text-yellow-200",
  },
  gta: {
    from: "from-pink-600/40",
    via: "via-purple-800/25",
    to: "to-cyan-700/30",
    pattern:
      "bg-[linear-gradient(120deg,rgba(236,72,153,0.2)_0%,transparent_40%,rgba(6,182,212,0.2)_100%)]",
    accent: "text-pink-200",
  },
};

const FALLBACK = {
  from: "from-accent/30",
  via: "via-surface-mid",
  to: "to-background",
  pattern: "bg-[radial-gradient(circle_at_30%_70%,rgba(0,240,255,0.15)_0,transparent_50%)]",
  accent: "text-accent",
};

export function HubHero({
  gameId,
  short,
  imageUrl,
  className = "",
  large = false,
}: {
  gameId: string;
  short: string;
  imageUrl?: string | null;
  className?: string;
  large?: boolean;
}) {
  const h = HERO[gameId] ?? FALLBACK;
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-stone-900 ${className}`} aria-hidden>
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <div className={`relative grid h-full place-items-center ${large ? "py-8" : ""}`}>
          <span
            className={`font-display font-bold uppercase tracking-tight text-white drop-shadow ${
              large ? "text-5xl md:text-6xl" : "text-2xl"
            }`}
          >
            {short}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${h.from} ${h.via} ${h.to} ${className}`}
      aria-hidden
    >
      <div className={`absolute inset-0 ${h.pattern}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
      <div className={`relative grid h-full place-items-center ${large ? "py-8" : ""}`}>
        <span
          className={`font-display font-bold uppercase tracking-tight ${h.accent} ${
            large ? "text-5xl md:text-6xl" : "text-2xl"
          }`}
        >
          {short}
        </span>
      </div>
    </div>
  );
}
