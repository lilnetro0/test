// Central mock data for the entire Nexus frontend.
// No persistence, no backend — this is a design-complete UI.
// Domain rules: docs/DOMAIN-MODEL.md (games = catalog, hubs = joinable).

/**
 * UI card for a joinable hub (Discover, dock, settings).
 * `id` = hubs.slug; `gameId` = games.id. Not a catalog `games` row.
 */
export type HubCard = {
  /**
   * Hub route / join key = `hubs.slug` in live mode.
   * In mock mode this usually matches the catalog game id.
   */
  id: string;
  /** Catalog `games.id` — hero presets, category. Defaults to `id` when omitted. */
  gameId?: string;
  /** Live `hubs.id` (uuid). */
  hubUuid?: string;
  name: string;
  short: string;
  hubName: string;
  tint: string;
  textTint: string;
  activeCount: string;
  category: "shooter" | "moba" | "sandbox" | "battle-royale" | "sports";
  members: number;
  /** Resolved cover: hub image, else game image */
  imageUrl?: string | null;
  /** Hub audience region (ISO / MENA); omit or empty = global */
  region?: string | null;
  /** True when hub has #lfg text channel (Discover AF6) */
  hasLfg?: boolean;
  /** AF13 — DB folded hub name when live */
  nameSearchNorm?: string | null;
  /** AF13 — DB folded game name when live */
  gameNameSearchNorm?: string | null;
};

/** @deprecated Prefer `HubCard` — same shape (historical mock name). */
export type Game = HubCard;

/** Catalog id for hero presets / filters (`gameId` or fallback to card `id`). */
export function catalogGameId(g: Pick<HubCard, "id" | "gameId">): string {
  return g.gameId ?? g.id;
}

export const GAMES: HubCard[] = [
  { id: "fortnite", gameId: "fortnite", name: "Fortnite", short: "FTN", hubName: "Fortnite Hub", tint: "bg-purple-500/20", textTint: "text-purple-300", activeCount: "1.2k", category: "battle-royale", members: 42800, region: "MENA", hasLfg: true },
  { id: "valorant", gameId: "valorant", name: "Valorant", short: "VAL", hubName: "Valorant Protocol", tint: "bg-rose-500/20", textTint: "text-rose-300", activeCount: "4.8k", category: "shooter", members: 89200, region: "MENA", hasLfg: true },
  { id: "lol", gameId: "lol", name: "League of Legends", short: "LOL", hubName: "Summoner's Rift", tint: "bg-amber-500/20", textTint: "text-amber-300", activeCount: "3.4k", category: "moba", members: 61500 },
  { id: "cs2", gameId: "cs2", name: "Counter-Strike 2", short: "CS2", hubName: "CS2 Global", tint: "bg-orange-500/20", textTint: "text-orange-300", activeCount: "2.1k", category: "shooter", members: 54300 },
  { id: "minecraft", gameId: "minecraft", name: "Minecraft", short: "MC", hubName: "Overworld", tint: "bg-emerald-500/20", textTint: "text-emerald-300", activeCount: "980", category: "sandbox", members: 33900 },
  { id: "apex", gameId: "apex", name: "Apex Legends", short: "APX", hubName: "Apex Games", tint: "bg-red-500/20", textTint: "text-red-300", activeCount: "1.7k", category: "battle-royale", members: 28100 },
  { id: "rocket", gameId: "rocket", name: "Rocket League", short: "RL", hubName: "Boost Arena", tint: "bg-sky-500/20", textTint: "text-sky-300", activeCount: "640", category: "sports", members: 18700, region: "SA" },
  { id: "overwatch", gameId: "overwatch", name: "Overwatch 2", short: "OW", hubName: "Watchpoint", tint: "bg-orange-400/20", textTint: "text-orange-200", activeCount: "820", category: "shooter", members: 22400 },
];

/** Mock Discover = every joinable hub (matches seed: one hub per catalog game). */
export const DISCOVER_HUBS: HubCard[] = [
  { id: "dota2", gameId: "dota2", name: "Dota 2", short: "DT2", hubName: "Ancient Grounds", tint: "bg-red-600/20", textTint: "text-red-300", activeCount: "2.9k", category: "moba", members: 41200 },
  { id: "cod", gameId: "cod", name: "Call of Duty: Warzone", short: "COD", hubName: "Verdansk Ops", tint: "bg-lime-500/20", textTint: "text-lime-300", activeCount: "3.6k", category: "battle-royale", members: 67000, region: "MENA", hasLfg: true },
  { id: "elden", gameId: "elden", name: "Elden Ring", short: "ELD", hubName: "The Lands Between", tint: "bg-yellow-600/20", textTint: "text-yellow-300", activeCount: "580", category: "sandbox", members: 15200 },
  { id: "gta", gameId: "gta", name: "GTA Online", short: "GTA", hubName: "Los Santos", tint: "bg-pink-500/20", textTint: "text-pink-300", activeCount: "1.9k", category: "sandbox", members: 39400 },
  { id: "fifa", gameId: "fifa", name: "EA Sports FC", short: "FC", hubName: "Pitch Side", tint: "bg-emerald-500/20", textTint: "text-emerald-300", activeCount: "1.1k", category: "sports", members: 22100, region: "SA", hasLfg: true },
  ...GAMES,
];

export type TextChannel = { id: string; name: string; slug?: string; topic?: string; unread?: number };
export type VoiceMember = { name: string; muted?: boolean; deafened?: boolean; speaking?: boolean };
export type VoiceChannel = {
  id: string;
  name: string;
  members: VoiceMember[];
  /** LiveKit room name from DB (Phase 5) */
  livekitRoomName?: string;
};

export type Reaction = { emoji: string; count: number; mine?: boolean };

export type ChatMessage = {
  id: string;
  author: string;
  time: string;
  body: string;
  system?: boolean;
  tint?: string;
  reactions?: Reaction[];
  replyTo?: { author: string; body: string };
  /** Live mode: DB message id being replied to */
  replyToId?: string;
  /** Live mode: author profile id */
  authorId?: string;
  /** Live mode: ISO created_at for pagination cursors */
  createdAt?: string;
  edited?: boolean;
  pinned?: boolean;
  attachment?: { name: string; kind: "image" | "file"; meta?: string; url?: string };
};

export type MemberInfo = {
  name: string;
  status?: string;
  inVoice?: string;
  role?: "admin" | "mod" | "member";
  tag?: string;
  /** Live mode profile id (for admin kick / role) */
  userId?: string;
};

/** Mock chat layout keyed by hub slug (= catalog id in mock). Not a DB hubs row. */
export type Hub = {
  textChannels: TextChannel[];
  voiceChannels: VoiceChannel[];
  activeChannelId: string;
  messages: ChatMessage[];
  members: { online: MemberInfo[]; offline: MemberInfo[] };
  pinnedCount: number;
};

export const HUBS: Record<string, Hub> = {
  fortnite: {
    textChannels: [
      { id: "general", name: "general", topic: "General chatter for the squad." },
      { id: "lfg-ranked", name: "lfg-ranked", unread: 3, topic: "Looking for group — ranked only." },
      { id: "clips", name: "clips-and-highlights", topic: "Post your best plays." },
      { id: "tournaments", name: "tournaments", unread: 1 },
      { id: "creative", name: "creative-builds" },
    ],
    voiceChannels: [
      { id: "lobby-alpha", name: "Lobby Alpha", members: [{ name: "Ghost_Protocol", speaking: true }, { name: "RogueOne" }] },
      { id: "competitive", name: "Competitive", members: [] },
      { id: "creative", name: "Creative Build", members: [{ name: "SurgicalStrike", muted: true }] },
      { id: "afk", name: "AFK", members: [] },
    ],
    activeChannelId: "general",
    pinnedCount: 4,
    messages: [
      { id: "1", author: "RogueOne", time: "14:20", body: "Anyone down for some Trios? Trying to push for Unreal rank this season before the reset.", reactions: [{ emoji: "🔥", count: 3, mine: true }, { emoji: "🎮", count: 1 }] },
      { id: "2", author: "PixelViper", time: "14:22", body: "I'm in, just need 10 mins to finish this tournament match. I'll join Lobby Alpha when I'm done.", tint: "bg-indigo-900/40 border border-indigo-500/20" },
      { id: "3", author: "Automata_Bot", time: "14:23", body: "User RogueOne has started a party search in Lobby Alpha.", system: true },
      { id: "4", author: "Ghost_Protocol", time: "14:25", body: "In voice, drop when ready. Running Zero Point → Tilted.", replyTo: { author: "RogueOne", body: "Anyone down for some Trios? Trying to push for Unreal rank…" }, reactions: [{ emoji: "👍", count: 2 }] },
      { id: "5", author: "SurgicalStrike", time: "14:27", body: "Streaming creative builds on the side, mic will be off for that.", edited: true },
      { id: "6", author: "PixelViper", time: "14:31", body: "Clip from last match — the 200-pump was clean.", attachment: { name: "victory-royale.mp4", kind: "file", meta: "12.4 MB" }, reactions: [{ emoji: "🏆", count: 5 }, { emoji: "😱", count: 2, mine: true }] },
    ],
    members: {
      online: [
        { name: "SurgicalStrike", status: "Streaming Creative", role: "admin", tag: "#0001" },
        { name: "Ghost_Protocol", inVoice: "Lobby Alpha", role: "mod", tag: "#1122" },
        { name: "RogueOne", inVoice: "Lobby Alpha", tag: "#8821" },
        { name: "PixelViper", status: "In Match", tag: "#4419" },
      ],
      offline: [
        { name: "Vortex_X" },
        { name: "ShadowStep" },
        { name: "Cpt_Price" },
        { name: "NeonRacer" },
      ],
    },
  },
  valorant: {
    textChannels: [
      { id: "general", name: "general", topic: "Official hub for team coordination." },
      { id: "lfg-comp", name: "lfg-competitive", unread: 5 },
      { id: "lineups", name: "lineups-and-strats" },
      { id: "clips", name: "clips" },
    ],
    voiceChannels: [
      { id: "squad-bravo", name: "Squad Bravo", members: [{ name: "Jett_Diff", speaking: true }, { name: "RazeX" }, { name: "KAYO_Main", muted: true }] },
      { id: "warmup", name: "Warmup Lobby", members: [] },
      { id: "5-stack", name: "5-Stack Ranked", members: [{ name: "Viper_Queen" }] },
    ],
    activeChannelId: "general",
    pinnedCount: 2,
    messages: [
      { id: "1", author: "Skyline_Zero", time: "14:20", body: "Anyone down for ranked? Diamond 2, need a Viper main for Haven. Code: T8X2-99L.", reactions: [{ emoji: "🎯", count: 2 }] },
      { id: "2", author: "Viper_Queen", time: "14:22", body: "I'm in. Just finished warm-up, sent you a friend request." },
      { id: "3", author: "Tactic_Bot", time: "14:25", body: "New map guide uploaded: Sunset controller lineups.", system: true },
      { id: "4", author: "Jett_Diff", time: "14:28", body: "Hopping in Squad Bravo now — mic hot." },
    ],
    members: {
      online: [
        { name: "Jett_Diff", inVoice: "Squad Bravo", role: "admin", tag: "#0001" },
        { name: "Viper_Queen", inVoice: "5-Stack Ranked", tag: "#4021" },
        { name: "Skyline_Zero", status: "In Queue", tag: "#7788" },
        { name: "RazeX", inVoice: "Squad Bravo", tag: "#1290" },
      ],
      offline: [{ name: "Omen_Shadow" }, { name: "Radiant_X" }, { name: "ClutchKing" }],
    },
  },
  lol: baseHub("Summoner"),
  cs2: baseHub("Operator"),
  minecraft: baseHub("Crafter"),
  apex: baseHub("Legend"),
  rocket: baseHub("Driver"),
  overwatch: baseHub("Hero"),
  dota2: baseHub("Ancient"),
  cod: baseHub("Operator"),
  elden: baseHub("Tarnished"),
  gta: baseHub("Hustler"),
};

function baseHub(role: string): Hub {
  return {
    textChannels: [
      { id: "general", name: "general" },
      { id: "lfg", name: "lfg" },
      { id: "clips", name: "clips" },
    ],
    voiceChannels: [
      { id: "lobby", name: "Main Lobby", members: [{ name: `${role}_01`, speaking: true }] },
      { id: "ranked", name: "Ranked", members: [] },
    ],
    activeChannelId: "general",
    pinnedCount: 0,
    messages: [
      { id: "1", author: `${role}_01`, time: "14:10", body: "Anyone up for a few games tonight?" },
      { id: "2", author: `${role}_42`, time: "14:12", body: "Down. Give me 15." },
      { id: "3", author: "Automata_Bot", time: "14:13", body: "Match search started.", system: true },
    ],
    members: {
      online: [
        { name: `${role}_01`, inVoice: "Main Lobby", tag: "#0001" },
        { name: `${role}_42`, status: "Online", tag: "#0042" },
      ],
      offline: [{ name: `${role}_07` }, { name: `${role}_88` }],
    },
  };
}

// ============ FRIENDS ============
export type Friend = {
  /** Live mode: profile id */
  id?: string;
  /** Live mode: pending friend_requests.id */
  requestId?: string;
  name: string;
  tag: string;
  status: "online" | "idle" | "dnd" | "offline";
  activity?: string;
  mutualGames?: number;
};

export const FRIENDS: Friend[] = [
  { name: "Ghost_Protocol", tag: "#1122", status: "online", activity: "Playing Fortnite", mutualGames: 4 },
  { name: "Viper_Queen", tag: "#4021", status: "online", activity: "In Voice — Squad Bravo", mutualGames: 3 },
  { name: "Skyline_Zero", tag: "#7788", status: "dnd", activity: "In Queue — Valorant", mutualGames: 2 },
  { name: "PixelViper", tag: "#4419", status: "idle", activity: "Away", mutualGames: 5 },
  { name: "RogueOne", tag: "#8821", status: "online", activity: "Playing Fortnite", mutualGames: 4 },
  { name: "SurgicalStrike", tag: "#0001", status: "online", activity: "Streaming on Twitch", mutualGames: 6 },
  { name: "NeonRacer", tag: "#5502", status: "offline", mutualGames: 1 },
  { name: "ShadowStep", tag: "#3311", status: "offline", mutualGames: 2 },
];

export const FRIEND_REQUESTS: Friend[] = [
  { name: "AceHunter", tag: "#9001", status: "online", activity: "Wants to be friends", mutualGames: 1 },
  { name: "RadiantDream", tag: "#2244", status: "idle", activity: "Wants to be friends" },
];

// ============ DIRECT MESSAGES ============
export type DMConversation = {
  id: string;
  with: Friend;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: ChatMessage[];
};

export const DM_CONVERSATIONS: DMConversation[] = [
  {
    id: "dm-ghost",
    with: FRIENDS[0],
    lastMessage: "Drop when you're on — running trios.",
    lastTime: "14:32",
    unread: 2,
    messages: [
      { id: "d1", author: "Ghost_Protocol", time: "14:28", body: "Hey, you online?" },
      { id: "d2", author: "You", time: "14:30", body: "Yeah just got back. Same lobby?" },
      { id: "d3", author: "Ghost_Protocol", time: "14:31", body: "Yeah Lobby Alpha in Fortnite hub." },
      { id: "d4", author: "Ghost_Protocol", time: "14:32", body: "Drop when you're on — running trios.", reactions: [{ emoji: "🎮", count: 1, mine: true }] },
    ],
  },
  {
    id: "dm-viper",
    with: FRIENDS[1],
    lastMessage: "Send me the lineup pack later 🙏",
    lastTime: "13:04",
    unread: 0,
    messages: [
      { id: "d1", author: "Viper_Queen", time: "12:50", body: "Are you free tonight?" },
      { id: "d2", author: "You", time: "13:00", body: "Yeah after 9. Ranked?" },
      { id: "d3", author: "Viper_Queen", time: "13:04", body: "Send me the lineup pack later 🙏" },
    ],
  },
  {
    id: "dm-pixel",
    with: FRIENDS[3],
    lastMessage: "gg wp",
    lastTime: "Yesterday",
    unread: 0,
    messages: [
      { id: "d1", author: "You", time: "22:14", body: "That last game was rough" },
      { id: "d2", author: "PixelViper", time: "22:15", body: "gg wp" },
    ],
  },
];

// ============ EMOJIS ============
export const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: "Gaming",
    icon: "🎮",
    emojis: ["🎮", "🕹️", "🎯", "🏆", "🔫", "⚔️", "🛡️", "🏹", "💥", "🔥", "⚡", "💀", "👾", "🎲", "♠️", "♥️"],
  },
  {
    name: "Reactions",
    icon: "😂",
    emojis: ["😂", "🤣", "😎", "😱", "😭", "🥲", "😤", "🤯", "🥶", "🤡", "💯", "👀", "🙄", "😴", "🤩", "🥵"],
  },
  {
    name: "Hands",
    icon: "👋",
    emojis: ["👍", "👎", "👊", "✊", "🤝", "🙏", "👋", "🤙", "🤘", "✌️", "👌", "🫡", "🫰", "🖖", "💪", "🫵"],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💘", "💝", "💔", "❣️", "💞", "💓"],
  },
  {
    name: "Symbols",
    icon: "✨",
    emojis: ["✨", "⭐", "🌟", "💫", "🎉", "🎊", "🏁", "🚀", "💎", "🔔", "📢", "⚠️", "✅", "❌", "❓", "❗"],
  },
];

// ============ NOTIFICATIONS ============
export type NotificationItem = {
  id: string;
  kind: "mention" | "friend" | "voice" | "system" | "dm";
  title: string;
  body: string;
  time: string;
  read?: boolean;
  href?: string;
};

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", kind: "mention", title: "@you in #lfg-ranked", body: "Ghost_Protocol: yo @you drop in", time: "2m", href: "/" },
  { id: "n2", kind: "friend", title: "New friend request", body: "AceHunter wants to be your friend", time: "12m", href: "/friends" },
  { id: "n3", kind: "voice", title: "Voice channel active", body: "Squad Bravo has 3 members", time: "24m" },
  { id: "n4", kind: "system", title: "New hub feature", body: "You can now pin messages in any text channel", time: "1h" },
  { id: "n5", kind: "dm", title: "New message from Ghost_Protocol", body: "Drop when you're on — running trios.", time: "5m", href: "/dm" },
];

// ============ CURRENT USER ============
export const ME = {
  name: "You",
  tag: "#0420",
  status: "online" as const,
  avatar: null,
  bio: "Gaming on Nexus (demo profile).",
};
