/**
 * Per-game hero art for Discover tiles.
 * CSS-only atmospheric panels — premium console depth, no neon glow.
 * Keys are **catalog `games.id`** (not hub slug). See docs/DOMAIN-MODEL.md.
 */

const HERO: Record<
  string,
  { from: string; via: string; to: string; pattern: string; accent: string }
> = {
  fortnite: {
    from: "from-violet-700/45",
    via: "via-fuchsia-800/18",
    to: "to-slate-950/55",
    pattern:
      "bg-[radial-gradient(ellipse_at_25%_85%,rgba(255,255,255,0.08)_0,transparent_42%),radial-gradient(circle_at_78%_18%,rgba(94,160,180,0.14)_0,transparent_38%)]",
    accent: "text-fuchsia-100/90",
  },
  valorant: {
    from: "from-rose-800/48",
    via: "via-red-950/28",
    to: "to-zinc-950/50",
    pattern:
      "bg-[linear-gradient(135deg,transparent_40%,rgba(255,70,85,0.16)_40%,rgba(255,70,85,0.16)_42%,transparent_42%),linear-gradient(45deg,transparent_60%,rgba(255,255,255,0.04)_60%)]",
    accent: "text-rose-100/90",
  },
  lol: {
    from: "from-amber-700/35",
    via: "via-yellow-900/20",
    to: "to-blue-950/45",
    pattern:
      "bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.22)_0,transparent_55%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16)_0,transparent_45%)]",
    accent: "text-amber-100/90",
  },
  cs2: {
    from: "from-orange-800/38",
    via: "via-amber-950/18",
    to: "to-stone-950/55",
    pattern:
      "bg-[repeating-linear-gradient(90deg,transparent,transparent_12px,rgba(255,255,255,0.025)_12px,rgba(255,255,255,0.025)_13px)]",
    accent: "text-orange-100/90",
  },
  minecraft: {
    from: "from-emerald-800/40",
    via: "via-lime-950/20",
    to: "to-stone-950/45",
    pattern:
      "bg-[linear-gradient(90deg,rgba(0,0,0,0.12)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.12)_1px,transparent_1px)] bg-[length:16px_16px]",
    accent: "text-emerald-100/90",
  },
  apex: {
    from: "from-red-700/42",
    via: "via-orange-950/20",
    to: "to-zinc-950/50",
    pattern:
      "bg-[conic-gradient(from_210deg_at_70%_30%,rgba(255,80,40,0.22),transparent_42%)]",
    accent: "text-red-100/90",
  },
  rocket: {
    from: "from-sky-700/38",
    via: "via-blue-950/22",
    to: "to-orange-950/25",
    pattern:
      "bg-[radial-gradient(circle_at_30%_70%,rgba(56,189,248,0.22)_0,transparent_42%),radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.16)_0,transparent_36%)]",
    accent: "text-sky-100/90",
  },
  overwatch: {
    from: "from-orange-600/38",
    via: "via-amber-900/16",
    to: "to-slate-950/45",
    pattern:
      "bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.16)_0,transparent_55%)]",
    accent: "text-orange-50/90",
  },
  dota2: {
    from: "from-red-900/45",
    via: "via-rose-950/25",
    to: "to-stone-950/55",
    pattern:
      "bg-[radial-gradient(ellipse_at_bottom,rgba(185,28,28,0.28)_0,transparent_60%)]",
    accent: "text-red-100/90",
  },
  cod: {
    from: "from-lime-900/35",
    via: "via-stone-900/30",
    to: "to-zinc-950/55",
    pattern:
      "bg-[repeating-linear-gradient(-45deg,transparent,transparent_8px,rgba(163,230,53,0.04)_8px,rgba(163,230,53,0.04)_16px)]",
    accent: "text-lime-100/90",
  },
  elden: {
    from: "from-yellow-900/35",
    via: "via-amber-950/25",
    to: "to-stone-950/55",
    pattern:
      "bg-[radial-gradient(ellipse_at_top,rgba(202,138,4,0.22)_0,transparent_52%)]",
    accent: "text-yellow-100/90",
  },
  gta: {
    from: "from-pink-700/32",
    via: "via-purple-950/22",
    to: "to-cyan-950/30",
    pattern:
      "bg-[linear-gradient(120deg,rgba(236,72,153,0.14)_0%,transparent_42%,rgba(6,182,212,0.12)_100%)]",
    accent: "text-pink-100/90",
  },
};

const FALLBACK = {
  from: "from-accent/22",
  via: "via-surface-mid",
  to: "to-background",
  pattern:
    "bg-[radial-gradient(circle_at_30%_70%,color-mix(in_oklab,var(--accent)_12%,transparent)_0,transparent_50%)]",
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
  /** Prefer banner for large heroes; cover for cards. */
  imageUrl?: string | null;
  className?: string;
  large?: boolean;
}) {
  const h = HERO[gameId] ?? FALLBACK;
  if (imageUrl) {
    return (
      <div className={`nx-ui-media relative overflow-hidden bg-stone-950 ${className}`} aria-hidden>
        <img
          src={imageUrl}
          alt=""
          width={large ? 1200 : 320}
          height={large ? 480 : 160}
          sizes={large ? "100vw" : "(max-width: 640px) 40vw, 160px"}
          loading={large ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          className="nx-no-drag absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_28%)]" />
        <div className={`relative grid h-full place-items-center ${large ? "py-8" : ""}`}>
          <span
            className={`font-display font-semibold tracking-tight text-white/95 drop-shadow-sm ${
              large ? "text-5xl md:text-6xl" : "text-xl"
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/[0.04]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className={`relative grid h-full place-items-center ${large ? "py-8" : ""}`}>
        <span
          className={`font-display font-semibold tracking-tight ${h.accent} ${
            large ? "text-5xl md:text-6xl" : "text-xl"
          }`}
        >
          {short}
        </span>
      </div>
    </div>
  );
}
